/**
 * 499K Network — ซัพพลายเออร์ไอดีเกม (https://store.499k-network.com/docs/api)
 *
 * ร้านเราเป็นตัวแทนขาย: เมื่อลูกค้าจ่ายเงิน เราสั่งซื้อต่อจากที่นี่แล้วส่งบัญชี
 * ที่ได้กลับไปให้ลูกค้า คีย์เรียกได้เฉพาะฝั่งเซิร์ฟเวอร์เท่านั้น
 */

export interface SupplierProduct {
  productId: string;
  type: string;
  platform: string;
  name: string;
  image: string;
  stock: number;
  /** ราคาแนะนำสำหรับขายปลีก */
  webPrice: number;
  /** ต้นทุนของเราหลังหักเรตตัวแทน */
  cost: number;
  ratePercent: number;
  denuvo: boolean;
  description: string;
  genres: string[];
  /** เฉพาะสินค้าเช่า: จำนวนวัน → ราคา */
  durations?: Record<string, { webPrice: number; cost: number }>;
  /** เฉพาะสินค้าเช่า: ช่วงที่สั้นที่สุด ซึ่งเป็นช่วงที่ webPrice/cost ด้านบนอ้างถึง */
  defaultDurationDays?: number;
}

export interface SupplierOrder {
  orderNo: string;
  gameTitle: string;
  price: number;
  balanceAfter: number;
  account: { username: string; password: string } | null;
  codeRequests: { used: number; max: number };
  raw: Record<string, unknown>;
}

export interface SupplierCode {
  code: string;
  validForSec: number;
  expiresInSec: number;
  codeRequests: { used: number; max: number };
}

export class SupplierError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 502) {
    super(message);
    this.name = 'SupplierError';
    this.code = code;
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const num = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const str = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

/** ข้อความที่ลูกค้าอ่านแล้วรู้ว่าต้องทำอะไรต่อ แทน error code ดิบของซัพพลายเออร์ */
const FRIENDLY: Record<string, string> = {
  OUT_OF_STOCK: 'สินค้าหมดชั่วคราว กรุณาลองใหม่ภายหลัง',
  INSUFFICIENT_BALANCE: 'ยอดเครดิตร้านกับซัพพลายเออร์ไม่พอ กรุณาแจ้งผู้ดูแลระบบ',
  RATE_LIMITED: 'มีคำสั่งซื้อเข้ามาพร้อมกันมาก กรุณาลองใหม่ในอีกสักครู่',
  CODE_LIMIT_REACHED: 'ขอรหัส Steam Guard ครบจำนวนครั้งที่กำหนดแล้ว',
  UNAUTHORIZED: 'คีย์ซัพพลายเออร์ไม่ถูกต้อง กรุณาแจ้งผู้ดูแลระบบ',
  KEY_REVOKED: 'คีย์ซัพพลายเออร์ถูกยกเลิก กรุณาแจ้งผู้ดูแลระบบ',
  CLIENT_NOT_APPROVED: 'บัญชีตัวแทนยังไม่ได้รับอนุมัติจากซัพพลายเออร์',
  MIN_TOPUP_REQUIRED: 'ยอดเติมขั้นต่ำกับซัพพลายเออร์ยังไม่ถึงเกณฑ์',
  SLOT_UNAVAILABLE: 'ช่วงเวลาเช่านี้ถูกจองแล้ว',
};

function config() {
  const baseUrl = process.env.SUPPLIER_499K_BASE_URL || 'https://store.499k-network.com/api/v1';
  const apiKey = process.env.SUPPLIER_499K_API_KEY;

  if (!apiKey) {
    throw new SupplierError(
      'supplier_not_configured',
      'ยังไม่ได้ตั้งค่า SUPPLIER_499K_API_KEY ใน .env',
      500
    );
  }

  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

async function call<T = Record<string, unknown>>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const { baseUrl, apiKey } = config();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      // ราคา/สต็อกเปลี่ยนตลอด จึงห้าม cache
      cache: 'no-store',
    });
  } catch {
    throw new SupplierError('supplier_unreachable', 'ติดต่อระบบซัพพลายเออร์ไม่ได้');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || !isRecord(body) || body.success === false) {
    const error = isRecord(body) && isRecord(body.error) ? body.error : {};
    const code = str(error.code, `HTTP_${response.status}`);

    throw new SupplierError(
      code,
      FRIENDLY[code] ?? str(error.message, 'ระบบซัพพลายเออร์ตอบกลับผิดพลาด'),
      response.status === 429 ? 429 : 502
    );
  }

  return (body.data ?? {}) as T;
}

function toProduct(row: Record<string, unknown>): SupplierProduct {
  const steam = isRecord(row.steam) ? row.steam : {};
  const durationRows = isRecord(row.durations) ? row.durations : null;

  const durations = durationRows
    ? Object.fromEntries(
        Object.entries(durationRows).map(([days, value]) => [
          days,
          {
            webPrice: num(isRecord(value) ? value.web_price : 0),
            cost: num(isRecord(value) ? value.price : 0),
          },
        ])
      )
    : undefined;

  // สินค้าเช่าไม่มีราคาเดี่ยว ใช้ราคาของช่วงสั้นที่สุดเป็นราคาเริ่มต้น
  // (คีย์เป็นตัวเลขล้วน JS จึงเรียงจากน้อยไปมากให้เอง)
  const firstDuration = durations ? Object.values(durations)[0] : undefined;
  const firstDurationDays = durations ? Number(Object.keys(durations)[0]) : undefined;

  return {
    productId: str(row.product_id),
    type: str(row.type),
    platform: str(row.platform, 'steam'),
    name: str(row.name),
    image: str(row.image),
    stock: num(row.stock),
    webPrice: num(row.web_price, firstDuration?.webPrice ?? 0),
    cost: num(row.price, firstDuration?.cost ?? 0),
    ratePercent: num(row.rate_percent),
    denuvo: Boolean(row.denuvo),
    description: str(steam.description ?? steam.short_description),
    genres: Array.isArray(steam.genres) ? (steam.genres as string[]) : [],
    durations,
    defaultDurationDays: Number.isFinite(firstDurationDays) ? firstDurationDays : undefined,
  };
}

export async function fetchSupplierAccount() {
  const data = await call<Record<string, unknown>>('/me');
  const client = isRecord(data.client) ? data.client : {};

  return {
    websiteName: str(client.website_name),
    status: str(client.status),
    balance: num(data.balance),
    ratePercent: num(data.rate_percent),
    keyPrefix: str(data.key_prefix),
    isSandbox: str(client.status) === 'sandbox' || str(data.key_prefix).startsWith('499k_test'),
  };
}

export async function fetchSupplierProducts(): Promise<SupplierProduct[]> {
  const data = await call<Record<string, unknown>>('/products');
  const rows = Array.isArray(data.products) ? data.products : [];
  return rows.filter(isRecord).map(toProduct);
}

const HALF_HOUR_MS = 30 * 60 * 1000;

/**
 * ปัดเวลาเริ่มเช่าขึ้นไปหา "ครึ่งชั่วโมงถัดไป" ในรูปแบบ ISO 8601 โซน UTC
 * เช่น 2026-08-14T12:00:00Z — 499K รับเฉพาะรูปแบบนี้ ถ้าส่งเวลาที่ไม่ตรง
 * นาที 00/30 หรือมีเศษวินาที จะถูกปฏิเสธทั้งคำสั่งซื้อ
 *
 * ปัดขึ้นเสมอเพื่อไม่ให้ได้เวลาที่ผ่านไปแล้ว
 */
export function alignRentalStart(input?: string | Date): string {
  const base = input ? new Date(input) : new Date();

  if (Number.isNaN(base.getTime())) {
    throw new SupplierError('invalid_start_at', 'รูปแบบเวลาเริ่มเช่าไม่ถูกต้อง', 400);
  }

  const slot = Math.ceil(base.getTime() / HALF_HOUR_MS) * HALF_HOUR_MS;
  // toISOString ให้ .000Z มาด้วย ซึ่งซัพพลายเออร์ไม่รับ จึงตัดมิลลิวินาทีทิ้ง
  return new Date(slot).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * สั่งซื้อจากซัพพลายเออร์
 *
 * `ref` ต้องคงที่ต่อหนึ่งรายการสั่งซื้อของเรา เพราะฝั่งเขาใช้ตัดซ้ำ:
 * ยิงซ้ำด้วย ref เดิมจะได้ผลลัพธ์เดิมโดยไม่ถูกหักเงินอีกรอบ
 * (ยิงซ้ำคนละรอบครึ่งชั่วโมงจะคำนวณ start_at ได้ใหม่ แต่ ref เดิมทำให้
 * ซัพพลายเออร์คืนคำสั่งซื้อเดิม ไม่ได้จองรอบใหม่)
 */
export async function createSupplierOrder(input: {
  productId: string;
  type: string;
  ref: string;
  durationDays?: number;
  startAt?: string;
  accountId?: number;
}): Promise<SupplierOrder> {
  const body: Record<string, unknown> = {
    product_id: input.productId,
    type: input.type,
    ref: input.ref,
  };

  if (input.type === 'rental') {
    body.duration_days = input.durationDays ?? 1;
    // start_at เป็นฟิลด์บังคับของสินค้าเช่า และต้องตรงช่วงครึ่งชั่วโมงเสมอ
    // จึงคำนวณให้ตรงนี้แทนที่จะหวังให้ผู้เรียกส่งมาถูกรูปแบบเอง
    body.start_at = alignRentalStart(input.startAt);
    if (input.accountId) body.account_id = input.accountId;
  }

  const data = await call<Record<string, unknown>>('/orders', { method: 'POST', body });
  const account = isRecord(data.account) ? data.account : null;
  const codes = isRecord(data.code_requests) ? data.code_requests : {};

  return {
    orderNo: str(data.order_no),
    gameTitle: str(data.game_title),
    price: num(data.price),
    balanceAfter: num(data.balance_after),
    account: account
      ? { username: str(account.username), password: str(account.password) }
      : null,
    codeRequests: { used: num(codes.used), max: num(codes.max, 3) },
    raw: data,
  };
}

export async function requestSupplierCode(
  orderNo: string,
  reason?: string
): Promise<SupplierCode> {
  const data = await call<Record<string, unknown>>(`/orders/${orderNo}/code`, {
    method: 'POST',
    // ส่ง reason เฉพาะตอนเปิดรอบใหม่ ถ้าอยู่ในหน้าต่าง 60 วินาทีเดิมให้ส่ง {} เพื่อขอรหัสซ้ำ
    body: reason ? { reason } : {},
  });

  const window = isRecord(data.window) ? data.window : {};
  const codes = isRecord(data.code_requests) ? data.code_requests : {};

  return {
    code: str(data.code),
    validForSec: num(data.valid_for_sec),
    expiresInSec: num(window.expires_in_sec),
    codeRequests: { used: num(codes.used), max: num(codes.max, 3) },
  };
}
