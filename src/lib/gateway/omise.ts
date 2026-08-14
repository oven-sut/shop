import {
  ChargeMethod,
  ChargeStatus,
  GATEWAY_TIMEOUT_MS,
  GatewayCharge,
  GatewayError,
  isRecord,
  PaymentGateway,
} from './types';

/**
 * Omise / Opn Payments — PromptPay QR และ TrueMoney Wallet
 * https://docs.opn.ooo/api  (charges, sources)
 *
 * Flow: create a source of the chosen type, charge it, and the charge comes back
 * `pending` with something for the customer to act on — a scannable QR for
 * PromptPay, an `authorize_uri` to confirm with an OTP for TrueMoney Wallet.
 * Either way it turns `successful` once the money moves, reported both by webhook
 * and by asking for the charge again, which is what this shop actually trusts.
 *
 * TrueMoney here is the sanctioned route: the gateway holds the merchant
 * relationship, so there is no unofficial endpoint to reach and nothing for
 * TrueMoney's bot protection to refuse.
 */
const DEFAULT_BASE_URL = 'https://api.omise.co';

/** Omise คิดเป็นสตางค์เสมอ */
const toSatang = (baht: number) => Math.round(baht * 100);
const toBaht = (satang: number) => satang / 100;

function authorization(): string {
  const key = process.env.OMISE_SECRET_KEY ?? '';
  // Basic <key>: — Omise ใช้ secret key เป็น username และปล่อยรหัสผ่านว่าง
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

const baseUrl = () => (process.env.OMISE_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

async function call(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: authorization(),
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
  } catch {
    throw new GatewayError('gateway_unreachable', 'ติดต่อระบบรับชำระเงินไม่ได้ กรุณาลองใหม่');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || !isRecord(body)) {
    // Omise ตอบ error เป็น {object:"error", code, message}
    const code = isRecord(body) && typeof body.code === 'string' ? body.code : `http_${response.status}`;
    const message =
      isRecord(body) && typeof body.message === 'string' ? body.message : 'เรียกระบบรับชำระเงินไม่สำเร็จ';

    // คีย์ผิด/ยังไม่เปิดใช้ = ปัญหาฝั่งร้าน ไม่ใช่ของลูกค้า จึงเป็น 503
    const status = response.status === 401 || response.status === 403 ? 503 : 502;
    throw new GatewayError(`omise_${code}`, `ระบบรับชำระเงินตอบกลับว่า: ${message}`, status);
  }

  return body;
}

/** Omise: pending | successful | failed | expired | reversed */
function toStatus(charge: Record<string, unknown>): ChargeStatus {
  if (charge.paid === true || charge.status === 'successful') return 'paid';
  if (charge.status === 'expired') return 'expired';
  if (charge.status === 'pending') return 'pending';
  return 'failed';
}

/**
 * `source.scannable_code.image.download_uri` ซ้อนลึก และหายไปได้ถ้า charge หมดอายุ
 *
 * The URL is checked before it is ever fetched: this value comes from an outside
 * response, and the shop fetches it with its own key attached. https, or the host
 * the operator pointed `OMISE_BASE_URL` at — nothing else.
 */
function readQrUrl(charge: Record<string, unknown>): string | undefined {
  const source = isRecord(charge.source) ? charge.source : undefined;
  const code = source && isRecord(source.scannable_code) ? source.scannable_code : undefined;
  const image = code && isRecord(code.image) ? code.image : undefined;
  const uri = image?.download_uri;

  if (typeof uri !== 'string') return undefined;

  return uri.startsWith('https://') || uri.startsWith(`${baseUrl()}/`) ? uri : undefined;
}

/** ชนิดของ source บอกว่าลูกค้าต้องทำอะไรต่อ — อ่านกลับมาแทนที่จะเดา */
function readMethod(charge: Record<string, unknown>): ChargeMethod {
  const source = isRecord(charge.source) ? charge.source : undefined;
  return source?.type === 'truemoney' ? 'truemoney' : 'promptpay';
}

function toCharge(charge: Record<string, unknown>): GatewayCharge {
  const metadata = isRecord(charge.metadata) ? charge.metadata : {};
  const amount = typeof charge.amount === 'number' ? toBaht(charge.amount) : 0;
  const authorizeUri = charge.authorize_uri;

  return {
    // Only a string id is usable — it goes into a URL path and into trans_ref.
    id: typeof charge.id === 'string' ? charge.id : '',
    amount,
    status: toStatus(charge),
    method: readMethod(charge),
    // Same rule as the QR URL: this comes from outside and the customer is sent
    // to it, so anything but https is dropped rather than followed.
    authorizeUri:
      typeof authorizeUri === 'string' && authorizeUri.startsWith('https://')
        ? authorizeUri
        : undefined,
    userId: typeof metadata.userId === 'string' ? metadata.userId : undefined,
    expiresAt: typeof charge.expires_at === 'string' ? charge.expires_at : undefined,
    qrUrl: readQrUrl(charge),
    raw: charge,
  };
}

export const omiseGateway: PaymentGateway = {
  name: 'omise',

  isConfigured() {
    return Boolean(process.env.OMISE_SECRET_KEY);
  },

  methods: ['promptpay', 'truemoney'],

  async createCharge({ amount, userId, method, phone, returnUri }) {
    const satang = toSatang(amount);

    const source = await call('/sources', {
      method: 'POST',
      body: JSON.stringify({
        type: method,
        amount: satang,
        currency: 'thb',
        // TrueMoney sends the OTP to this number, so it is the customer's own
        // wallet number — nothing to do with the shop's receiving accounts.
        ...(method === 'truemoney' ? { phone_number: phone } : {}),
      }),
    });

    const charge = await call('/charges', {
      method: 'POST',
      body: JSON.stringify({
        amount: satang,
        currency: 'thb',
        source: source.id,
        // Required by the redirect flow: where the customer lands after the OTP.
        ...(returnUri ? { return_uri: returnUri } : {}),
        // The only place the owner is recorded. It comes back on every later read
        // of this charge, so a webhook — which carries no session — still knows
        // exactly whose wallet to credit.
        metadata: { userId, kind: 'topup' },
      }),
    });

    const result = toCharge(charge);

    if (!result.id) {
      throw new GatewayError('omise_no_charge', 'ระบบรับชำระเงินไม่ได้ส่งรายการกลับมา กรุณาลองใหม่');
    }

    // Each method has one thing the customer must be handed. Without it the page
    // would show a charge nobody can pay, so it fails here instead.
    if (method === 'promptpay' && !result.qrUrl) {
      throw new GatewayError(
        'omise_no_qr',
        'ระบบรับชำระเงินไม่ได้ส่ง QR กลับมา กรุณาลองใหม่หรือใช้วิธีอัปโหลดสลิป'
      );
    }

    if (method === 'truemoney' && !result.authorizeUri) {
      throw new GatewayError(
        'omise_no_authorize_uri',
        'ระบบรับชำระเงินไม่ได้ส่งลิงก์ยืนยันกลับมา กรุณาลองใหม่'
      );
    }

    return result;
  },

  async fetchCharge(id) {
    return toCharge(await call(`/charges/${encodeURIComponent(id)}`));
  },

  async fetchQrImage(charge) {
    if (!charge.qrUrl) {
      throw new GatewayError('omise_no_qr', 'รายการนี้ไม่มีรูป QR แล้ว (อาจหมดอายุ)', 404);
    }

    let response: Response;
    try {
      // Sent with the shop's key: the URI is on the gateway's own API host, and
      // the browser must never be handed a URL that carries payment context.
      response = await fetch(charge.qrUrl, {
        headers: { Authorization: authorization() },
        signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
      });
    } catch {
      throw new GatewayError('gateway_unreachable', 'ดึงรูป QR จากระบบรับชำระเงินไม่ได้');
    }

    if (!response.ok) {
      throw new GatewayError('omise_qr_failed', 'ดึงรูป QR จากระบบรับชำระเงินไม่ได้');
    }

    return {
      bytes: await response.arrayBuffer(),
      contentType: response.headers.get('content-type') || 'image/png',
    };
  },

  readWebhookChargeId(body) {
    if (!isRecord(body)) return null;

    // {object:"event", key:"charge.complete", data:{object:"charge", id:"chrg_..."}}
    const data = isRecord(body.data) ? body.data : undefined;
    const id = data?.id ?? body.id;

    return typeof id === 'string' && id.startsWith('chrg_') ? id : null;
  },
};
