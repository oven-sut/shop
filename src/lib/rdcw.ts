/**
 * RDCW Slip Verify — https://slip.rdcw.co.th/docs
 *
 * Sends either the QR payload read off a Thai bank transfer slip, or the slip
 * image itself, and gets back the verified transaction as the bank recorded it.
 */
const INQUIRY_URL = 'https://suba.rdcw.co.th/v2/inquiry';

export interface SlipDetails {
  /** Bank transaction reference. Unique per transfer — this is what blocks slip reuse. */
  transRef: string;
  /** Amount in baht, already normalised for RDCW_AMOUNT_UNIT. */
  amount: number;
  sendingBank?: string;
  receivingBank?: string;
  senderName?: string;
  receiverName?: string;
  /** Anything that identifies the destination account: number, PromptPay id, … */
  receiverAccounts: string[];
  transferredAt?: string;
  raw: Record<string, unknown>;
}

export class SlipVerifyError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'SlipVerifyError';
    this.code = code;
    this.status = status;
  }
}

function credentials() {
  const clientId = process.env.RDCW_CLIENT_ID;
  const clientSecret = process.env.RDCW_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SlipVerifyError(
      'rdcw_not_configured',
      'ยังไม่ได้ตั้งค่า RDCW_CLIENT_ID / RDCW_CLIENT_SECRET ใน .env',
      500
    );
  }

  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Depth-first lookup, so a field keeps working whether it sits at the root or under `data`. */
function findValue(source: unknown, keys: string[], depth = 0): unknown {
  if (!isRecord(source) || depth > 4) return undefined;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }

  for (const value of Object.values(source)) {
    const found = findValue(value, keys, depth + 1);
    if (found !== undefined) return found;
  }

  return undefined;
}

function findString(source: unknown, keys: string[]): string | undefined {
  const value = findValue(source, keys);
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** Collects every account-ish identifier under `receiver` so any of them can be matched. */
function collectAccountIds(node: unknown, found: string[] = [], depth = 0): string[] {
  if (!isRecord(node) || depth > 4) return found;

  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && value.trim()) {
      if (/(account|value|proxy|no|number|id)$/i.test(key)) found.push(value.trim());
    } else if (isRecord(value)) {
      collectAccountIds(value, found, depth + 1);
    }
  }

  return found;
}

/** RDCW returns transDate "20240101" + transTime "12:51:57" rather than a timestamp. */
function toIsoTimestamp(source: unknown): string | undefined {
  const date = findString(source, ['transDate']);
  const time = findString(source, ['transTime']) ?? '00:00:00';

  if (date && /^\d{8}$/.test(date)) {
    const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time}+07:00`;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const direct = findString(source, ['transTimestamp', 'transactionDateTime', 'timestamp']);
  if (direct) {
    const parsed = new Date(direct);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return undefined;
}

function normalise(body: Record<string, unknown>): SlipDetails {
  const transRef = findString(body, ['transRef', 'transRefNo', 'transactionRef']);
  const rawAmount = findValue(body, ['amount', 'paidLocalAmount', 'transAmount']);
  const amount = typeof rawAmount === 'string' ? Number(rawAmount) : (rawAmount as number);

  if (!transRef) {
    throw new SlipVerifyError('slip_unreadable', 'อ่านเลขอ้างอิงจากสลิปไม่ได้ กรุณาลองใหม่');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new SlipVerifyError('slip_unreadable', 'อ่านจำนวนเงินจากสลิปไม่ได้ กรุณาลองใหม่');
  }

  const receiver = isRecord(body.data) && isRecord(body.data.receiver)
    ? body.data.receiver
    : (findValue(body, ['receiver']) as Record<string, unknown> | undefined);

  return {
    transRef,
    // The unit is a deployment setting: /api/topups cross-checks it against the
    // amount the customer declares, so a wrong setting fails loudly, never silently.
    amount: process.env.RDCW_AMOUNT_UNIT === 'satang' ? amount / 100 : amount,
    sendingBank: findString(body, ['sendingBank']),
    receivingBank: findString(body, ['receivingBank']),
    senderName: findString(isRecord(body.data) ? body.data.sender : undefined, ['displayName', 'name']),
    receiverName: findString(receiver, ['displayName', 'name']),
    receiverAccounts: collectAccountIds(receiver),
    transferredAt: toIsoTimestamp(body),
    raw: body,
  };
}

/**
 * Verifies a slip. Pass the QR payload string, or the slip image itself.
 * Throws {@link SlipVerifyError} for anything RDCW rejects.
 */
export async function verifySlip(input: { payload: string } | { file: File }): Promise<SlipDetails> {
  const authorization = `Basic ${credentials()}`;

  let request: RequestInit;
  if ('payload' in input) {
    request = {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: input.payload }),
    };
  } else {
    const form = new FormData();
    form.append('file', input.file);
    // Content-Type is left off on purpose: fetch adds the multipart boundary.
    request = { method: 'POST', headers: { Authorization: authorization }, body: form };
  }

  let response: Response;
  try {
    response = await fetch(INQUIRY_URL, request);
  } catch {
    throw new SlipVerifyError('rdcw_unreachable', 'ติดต่อระบบตรวจสลิปไม่ได้ กรุณาลองใหม่อีกครั้ง', 502);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || !isRecord(body)) {
    const code = isRecord(body) ? String(body.code ?? response.status) : String(response.status);
    const message = isRecord(body) && typeof body.message === 'string'
      ? body.message
      : 'ตรวจสอบสลิปไม่สำเร็จ';

    // 1007 = โควตาหมด, 1008 = แพ็กเกจหมดอายุ — ปัญหาฝั่งร้าน ไม่ใช่ของลูกค้า
    const isShopProblem = ['1000', '1001', '1002', '1003', '1007', '1008'].includes(code);

    throw new SlipVerifyError(
      `rdcw_${code}`,
      isShopProblem ? `ระบบตรวจสลิปใช้งานไม่ได้ (${code}: ${message})` : `สลิปไม่ถูกต้อง (${message})`,
      isShopProblem ? 502 : 400
    );
  }

  if (body.valid === false) {
    throw new SlipVerifyError('slip_invalid', 'ธนาคารไม่ยืนยันสลิปนี้ กรุณาตรวจสอบอีกครั้ง');
  }

  return normalise(body);
}
