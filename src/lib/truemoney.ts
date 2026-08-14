/**
 * ซองอังเปาทรูมันนี่ (TrueMoney Wallet gift voucher)
 *
 * The customer pastes the gift link they were given; the shop redeems it into
 * its own wallet and credits the customer for whatever actually arrived. Unlike
 * a slip there is nothing to verify afterwards — TrueMoney's answer *is* the
 * receipt, because the money has already moved by the time it replies.
 *
 * That ordering is the whole risk in this file: a successful redeem cannot be
 * undone. So nothing here refuses money after the fact (see `/api/topups/truemoney`
 * — no min/max is applied to a redeemed voucher), and every failure has to be
 * distinguishable, so the caller knows whether the money moved or not.
 *
 * The endpoint is the one the TrueMoney app itself calls; it is not a published
 * API, so `TRUEMONEY_BASE_URL` exists to redirect it if the path ever moves, or
 * to point at a proxy.
 *
 * A proxy is often necessary. gift.truemoney.com sits behind Cloudflare's bot
 * protection, which scores the caller, not the request: the same call can be
 * answered normally and then blocked minutes later from the same address once a
 * few automated requests have been made, and datacenter addresses tend to be
 * refused outright. No combination of headers gets past it. `edgeBlocked()` tells
 * that HTML block page apart from a real answer, and `docs/truemoney-proxy-worker.js`
 * is a ready-made relay to point `TRUEMONEY_BASE_URL` at.
 */
const DEFAULT_BASE_URL = 'https://gift.truemoney.com';

/** One call blocks a customer's top-up, so it is cut off rather than left hanging. */
const TIMEOUT_MS = 15_000;

export class VoucherError extends Error {
  readonly code: string;
  readonly status: number;
  /** true = the voucher was never redeemed, so trying again is safe. */
  readonly retryable: boolean;

  constructor(code: string, message: string, status = 400, retryable = false) {
    super(message);
    this.name = 'VoucherError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export interface RedeemedVoucher {
  hash: string;
  /** บาท — ยอดที่ซองใบนี้จ่ายให้การไถ่ครั้งนี้จริง */
  amount: number;
  ownerName?: string;
  redeemedAt: string;
  raw: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Pulls the voucher hash out of whatever the customer pasted: the full campaign
 * link, a shortened one they retyped, or the bare hash.
 *
 * Bounded on purpose — the hash goes into a URL path, so anything with a slash,
 * a query, or an unexpected length is rejected here rather than sent upstream.
 */
export function readVoucherHash(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromQuery = /[?&]v=([a-z0-9]+)/i.exec(trimmed);
  const candidate = fromQuery ? fromQuery[1] : trimmed;

  return /^[a-z0-9]{16,64}$/i.test(candidate) ? candidate : null;
}

/** ยอดที่ทรูคืนมาเป็นสตริง "100.00" — ต้องเป็นบาทที่มากกว่าศูนย์เท่านั้น */
function readAmount(source: unknown, keys: string[]): number | undefined {
  if (!isRecord(source)) return undefined;

  for (const key of keys) {
    const value = source[key];
    const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return undefined;
}

function readName(source: unknown): string | undefined {
  if (!isRecord(source)) return undefined;
  const value = source.full_name;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * What each code from TrueMoney means for the customer, and whether the voucher
 * is still unspent.
 *
 * Everything unknown is treated as *possibly redeemed* (retryable: false): if the
 * money did move and we invited another attempt, the second one would fail as
 * already-used and the customer would be told their voucher was worthless while
 * the shop kept it.
 */
const CODES: Record<string, { message: string; status: number; retryable?: boolean }> = {
  VOUCHER_NOT_FOUND: { message: 'ไม่พบซองอังเปาใบนี้ ลิงก์อาจผิดหรือถูกยกเลิกไปแล้ว', status: 404, retryable: true },
  VOUCHER_EXPIRED: { message: 'ซองอังเปาใบนี้หมดอายุแล้ว', status: 400, retryable: true },
  VOUCHER_OUT_OF_STOCK: { message: 'ซองอังเปาใบนี้ถูกรับไปครบแล้ว', status: 409, retryable: true },
  TARGET_USER_REDEEMED: { message: 'ซองอังเปาใบนี้ถูกรับไปแล้ว', status: 409, retryable: true },
  CANNOT_GET_OWN_VOUCHER: {
    message: 'ซองอังเปาใบนี้เป็นของบัญชีทรูวอลเล็ตร้านเอง ใช้เติมเงินไม่ได้',
    status: 400,
    retryable: true,
  },
  INTERNAL_ERROR: { message: 'ระบบทรูมันนี่ขัดข้อง กรุณาลองใหม่อีกครั้ง', status: 502, retryable: true },
};

/**
 * Was this the CDN turning us away rather than TrueMoney answering?
 *
 * The tell is a reply with no JSON status in it at all: the real service always
 * names a code, while a Cloudflare challenge or block returns an HTML page. The
 * distinction decides what the customer is told — "the shop cannot reach
 * TrueMoney, your voucher is safe" versus "TrueMoney refused your voucher".
 */
function edgeBlocked(response: Response, code: string | null): boolean {
  if (code) return false;

  // 404 is in the list only because `code` is null: TrueMoney's own "no such
  // voucher" carries VOUCHER_NOT_FOUND, so a bodiless 404 means the request died
  // at a relay or a wrong base URL — the voucher was never touched.
  return [403, 404, 429, 503].includes(response.status);
}

/**
 * Redeems `hash` into the wallet belonging to `mobile`.
 *
 * Resolving successfully means the money is already in the shop's TrueMoney
 * wallet — the caller must credit it, and must not drop it on the floor.
 */
export async function redeemVoucher(hash: string, mobile: string): Promise<RedeemedVoucher> {
  const digits = mobile.replace(/\D/g, '');
  if (!/^0\d{9}$/.test(digits)) {
    throw new VoucherError(
      'truemoney_not_configured',
      'ร้านยังไม่ได้ตั้งเบอร์ทรูวอลเล็ตสำหรับรับซองอังเปา กรุณาให้ผู้ดูแลระบบตั้งค่าที่หน้าแอดมิน → ตั้งค่าร้านค้า',
      503,
      true
    );
  }

  const base = (process.env.TRUEMONEY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // A relay must be able to tell the shop apart from anyone who finds its URL:
  // left open, it would redeem vouchers into any wallet a stranger names.
  const proxySecret = process.env.TRUEMONEY_PROXY_SECRET;
  if (proxySecret) headers['X-Proxy-Secret'] = proxySecret;

  let response: Response;
  try {
    response = await fetch(`${base}/campaign/vouchers/${hash}/redeem`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mobile: digits, voucher_hash: hash }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Never reached TrueMoney, or gave up waiting for an answer. The first is
    // safe to retry; the second is not distinguishable from here, so it is
    // reported as unknown rather than as "your voucher is untouched".
    throw new VoucherError(
      'truemoney_unreachable',
      'ติดต่อระบบทรูมันนี่ไม่ได้ กรุณาลองใหม่อีกครั้ง — ถ้าซองถูกใช้ไปแล้วให้แจ้งผู้ดูแลระบบ',
      502
    );
  }

  const body: unknown = await response.json().catch(() => null);
  const status = isRecord(body) && isRecord(body.status) ? body.status : null;
  const code = typeof status?.code === 'string' ? status.code : null;

  if (!response.ok || code !== 'SUCCESS') {
    // A block page never reached the redeem logic, so the voucher is certainly
    // untouched — say that, instead of implying the customer's voucher was bad.
    if (edgeBlocked(response, code)) {
      // What to do about it is an operator's job, not the customer's — they get
      // the one fact that matters to them (the voucher is still theirs), and the
      // fix goes to the log where whoever can act on it will see it.
      console.error(
        '[truemoney] BLOCKED BY CLOUDFLARE — the shop cannot reach gift.truemoney.com.',
        `Set TRUEMONEY_BASE_URL to a relay (see docs/truemoney-proxy-worker.js).`,
        JSON.stringify({ base, status: response.status })
      );

      throw new VoucherError(
        'truemoney_blocked',
        'ตอนนี้ระบบเชื่อมต่อทรูมันนี่ไม่ได้ ซองของคุณยังไม่ถูกใช้ — ลองใหม่อีกครั้งภายหลัง ' +
          'หรือเติมด้วยช่องทางอื่นไปก่อน',
        502,
        true
      );
    }

    const known = code ? CODES[code] : undefined;

    if (code && known) {
      throw new VoucherError(
        `truemoney_${code.toLowerCase()}`,
        known.message,
        known.status,
        known.retryable ?? false
      );
    }

    // An answer we do not recognise: it may or may not have moved money, so the
    // whole reply is logged rather than summarised.
    console.error(
      '[truemoney] unrecognised reply',
      JSON.stringify({ hash, status: response.status, body })
    );

    const detail = code ?? `HTTP ${response.status}`;
    throw new VoucherError(
      'truemoney_rejected',
      `ทรูมันนี่ไม่ยอมรับซองนี้ (${detail}) — ถ้าเงินถูกหักไปแล้วให้แจ้งผู้ดูแลระบบพร้อมลิงก์ซอง`,
      response.status >= 500 ? 502 : 400
    );
  }

  const data = isRecord(body) && isRecord(body.data) ? body.data : {};
  const voucher = isRecord(data.voucher) ? data.voucher : undefined;

  // `my_ticket` is this redemption's share; a voucher split across several people
  // reports the whole pot in `voucher.amount_baht`, which is not what arrived.
  const amount =
    readAmount(data.my_ticket, ['amount_baht']) ??
    readAmount(voucher, ['redeemed_amount_baht', 'amount_baht']);

  if (amount === undefined) {
    // Money has moved and we cannot tell how much — refuse to guess, and leave
    // the full reply in the log so the amount can be settled by hand.
    console.error('[truemoney] REDEEMED BUT AMOUNT UNREADABLE', JSON.stringify({ hash, body }));

    throw new VoucherError(
      'truemoney_amount_unreadable',
      'ไถ่ซองสำเร็จแต่อ่านยอดเงินจากคำตอบของทรูไม่ได้ กรุณาแจ้งผู้ดูแลระบบพร้อมลิงก์ซอง',
      502
    );
  }

  return {
    hash,
    amount,
    ownerName: readName(data.owner_profile) ?? readName(voucher),
    // TrueMoney's own timestamps vary by campaign; the moment it answered is the
    // one fact we can state exactly.
    redeemedAt: new Date().toISOString(),
    raw: isRecord(body) ? body : {},
  };
}
