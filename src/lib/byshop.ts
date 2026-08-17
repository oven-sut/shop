import { SupplierError } from './supplier';

/**
 * BYShop — ซัพพลายเออร์แอปพรีเมียม (https://byshop.me → เชื่อม API)
 *
 * ต่อจากตัวอย่าง PHP ที่เขาให้มา สรุปสัญญาได้เท่านี้:
 *
 * | เส้น | เมธอด | ต้องส่ง | ได้อะไร |
 * | --- | --- | --- | --- |
 * | `/api/product` | GET | — (ไม่ต้องมีคีย์) | รายการสินค้า + สต็อก |
 * | `/api/buy` | POST | `keyapi`, `id`, `username_customer` | บัญชีที่ซื้อได้ |
 * | `/api/history` | POST | `keyapi` (+`orderid` หรือ `username_customer`) | ประวัติ + email/password |
 * | `/api/report_fix` | POST | `keyapi`, `orderid`, `report_id` | แจ้งปัญหาออเดอร์ |
 *
 * ทุกเส้นรับ `application/x-www-form-urlencoded` และ **ตอบ HTTP 200 เสมอ** แม้ตอนพลาด
 * — ความผิดพลาดอยู่ใน `{"status":"error","message":"..."}` ของ body ไม่ใช่ใน status code
 * จึงต้องอ่าน body ทุกครั้ง ห้ามเชื่อ `response.ok`
 *
 * ⚠️ ตัวอย่างที่ได้มา 3 ไฟล์ไม่มีของเส้นซื้อ สัญญาของ `/api/buy` จึงค่อย ๆ ยืนยันจากคำตอบจริง:
 * ต้นทางตรวจทีละฟิลด์แล้วบอกว่าขาดอะไร ("keyapi ไม่ถูกต้อง" → "กรุณาใส่ username_customer")
 * ตอนนี้ยืนยันแล้วว่าต้องมี `keyapi` กับ `username_customer` ส่วนชื่อฟิลด์สินค้ายังใช้ `id`
 * ตามที่ `/api/product` ใช้ — ถ้ายิงแล้วยังได้ "กรุณาใส่ …" อีก ชื่อในข้อความนั้นคือคำตอบ
 *
 * ระหว่างที่ยังไม่ครบ การซื้อจึงยังไม่ต่อเข้าระบบส่งของอัตโนมัติ มีแต่ปุ่มให้แอดมินกดเอง
 */

const DEFAULT_BASE_URL = 'https://api_app_premium.byshop.me/api';

/** หนึ่งคำขอค้าง = ลูกค้ารอของ จึงตัดทิ้งแทนที่จะปล่อยแขวน */
const TIMEOUT_MS = 20_000;

export interface ByshopProduct {
  id: string;
  name: string;
  /** บาท — ต้นทางส่งมาเป็นสตริง "7.00" */
  price: number;
  stock: number;
  /** ข้อความสถานะจากต้นทาง เช่น "สินค้าหมด" */
  status: string;
  category: string;
  image: string;
  /** HTML ดิบจากต้นทาง — ถ้าจะแสดงต้องล้างก่อน อย่าใส่ dangerouslySetInnerHTML ตรง ๆ */
  infoHtml: string;
}

export interface ByshopPurchase {
  orderId: string;
  name: string;
  email: string;
  password: string;
  price: number;
  /** ยูสเซอร์ลูกค้าที่ผูกกับรายการนี้ฝั่ง BYShop */
  customerUsername: string;
  purchasedAt: string;
  raw: Record<string, unknown>;
}

/** ตัวเลือก "แจ้งปัญหา" ตามที่ report.php ของเขาใช้ */
export const BYSHOP_REPORT_REASONS: readonly { id: number; label: string }[] = [
  { id: 1, label: 'รหัสผิดเข้าสู่ระบบไม่ได้' },
  { id: 2, label: 'จอหาย / PIN ผิด' },
  { id: 3, label: 'Netflix โดนมั่วจอ' },
  { id: 4, label: 'OTP เกินเวลา' },
  { id: 5, label: 'แก้จอเต็มอัตโนมัติ (Netflix)' },
  { id: 6, label: 'จอเต็มรับชมไม่ได้ (แอปอื่น ๆ)' },
  { id: 7, label: 'Youtube Premium หลุด' },
  { id: 8, label: 'Youtube Premium ครอบครัวถูกปิดการใช้งาน' },
  { id: 9, label: 'Spotify Premium หลุด' },
];

/** ความหมายของ `status_fix` ที่ /api/history คืนมา */
export const BYSHOP_FIX_STATUS: Record<number, string> = {
  2: 'รอแก้ไข...',
  3: 'แก้ไขสำเร็จ',
  4: 'หมดอายุแล้ว',
  5: 'ติดต่อแอดมิน',
  6: 'กดเข้าร่วม Youtube Family ให้สำเร็จ',
  7: 'ยืนยันตัวตนที่ Gmail',
  8: 'เข้าร่วม Youtube Family สำเร็จแล้ว',
  9: 'อัปเดต (รหัสใหม่)',
  10: 'OTP เกินเวลา (ติดต่อแอดมิน)',
  11: 'คืนยอดเงินในระบบสำเร็จ (ตามจำนวนวันที่เหลือ)',
  12: 'กดรับสิทธิ์ Youtube Premium ใหม่',
  13: 'แพ็กเกจ: จอแชร์',
  14: 'อัปเดต (PIN ใหม่)',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const baseUrl = () => (process.env.SUPPLIER_BYSHOP_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

/** ตัวเลขจากต้นทางมาเป็นสตริงทั้งหมด */
const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

export function isByshopConfigured(): boolean {
  return Boolean(process.env.SUPPLIER_BYSHOP_KEYAPI);
}

function requireKey(): string {
  const key = process.env.SUPPLIER_BYSHOP_KEYAPI;
  if (!key) {
    throw new SupplierError(
      'byshop_not_configured',
      'ยังไม่ได้ตั้ง SUPPLIER_BYSHOP_KEYAPI ใน .env',
      503
    );
  }
  return key;
}

/**
 * ยิงคำขอหนึ่งครั้งแล้วคืน body ที่แปลงแล้ว
 *
 * ต้นทางตอบ 200 พร้อม `{status:"error"}` เวลาพลาด จึงตรวจ body ไม่ใช่ status
 * และ `checkStatus` ปิดได้สำหรับเส้นที่คืน array ตรง ๆ (product/history)
 */
async function call(path: string, form?: Record<string, string>): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: form ? 'POST' : 'GET',
      headers: form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      body: form ? new URLSearchParams(form).toString() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new SupplierError('byshop_unreachable', 'ติดต่อ BYShop ไม่ได้ กรุณาลองใหม่');
  }

  const raw = await response.text();

  // เขาส่ง HTML หน้า error ของ server กลับมาได้เหมือนกัน (เช่นยิงผิดเส้น)
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new SupplierError(
      'byshop_bad_response',
      `BYShop ตอบกลับเป็นข้อมูลที่อ่านไม่ได้ (HTTP ${response.status})`
    );
  }

  // รูปแบบพลาดของเขา: {"status":"error","message":"..."}
  if (isRecord(body) && body.status === 'error') {
    const message = text(body.message) || 'BYShop ปฏิเสธคำขอ';
    // ปัญหาคีย์/โควตาเป็นเรื่องฝั่งร้าน ไม่ใช่ของลูกค้า จึงแยกรหัสไว้
    const isShopProblem = /keyapi|ยอดเงิน|เครดิต|สิทธิ/.test(message);
    throw new SupplierError(
      isShopProblem ? 'byshop_shop_problem' : 'byshop_rejected',
      `BYShop: ${message}`,
      isShopProblem ? 503 : 400
    );
  }

  return body;
}

/** รายการสินค้าทั้งหมด — เส้นนี้ไม่ต้องใช้คีย์ */
export async function listByshopProducts(): Promise<ByshopProduct[]> {
  const body = await call('/product');
  if (!Array.isArray(body)) return [];

  return body.filter(isRecord).map((row) => ({
    id: text(row.id),
    name: text(row.name),
    price: num(row.price),
    stock: num(row.stock),
    status: text(row.status),
    category: text(row.category),
    image: text(row.img),
    infoHtml: text(row.product_info),
  }));
}

/**
 * ประวัติการซื้อจาก BYShop
 *
 * ใส่ `orderId` เพื่อดูรายการเดียว หรือ `customerUsername` เพื่อดูของลูกค้าคนหนึ่ง
 * ไม่ใส่เลย = ทั้งหมดของร้านเรา
 */
export async function fetchByshopHistory(
  filter: { orderId?: string; customerUsername?: string } = {}
): Promise<ByshopPurchase[]> {
  const form: Record<string, string> = { keyapi: requireKey() };
  if (filter.orderId) form.orderid = filter.orderId;
  if (filter.customerUsername) form.username_customer = filter.customerUsername;

  const body = await call('/history', form);
  if (!Array.isArray(body)) return [];

  return body.filter(isRecord).map((row) => ({
    orderId: text(row.id),
    name: text(row.name),
    email: text(row.email),
    password: text(row.password),
    price: num(row.price),
    customerUsername: text(row.username_customer),
    purchasedAt: text(row.time),
    raw: row,
  }));
}

/**
 * สั่งซื้อหนึ่งรายการ
 *
 * ⚠️ ชื่อฟิลด์นอกจาก `keyapi` ยังไม่ได้ยืนยัน — ดูหัวไฟล์ ตัวนี้จึงถูกเรียกจากปุ่มที่แอดมิน
 * กดเองเท่านั้น ยังไม่ผูกกับการส่งของอัตโนมัติ และคืน body ดิบกลับไปทั้งก้อนเพื่อให้เห็น
 * ว่าของจริงหน้าตาเป็นอย่างไรก่อนจะเขียนตัวแปลผล
 */
export async function buyByshopProduct(input: {
  productId: string;
  customerUsername: string;
}): Promise<Record<string, unknown>> {
  const customerUsername = input.customerUsername.trim();

  // ต้นทางตอบ "กรุณาใส่ username_customer" ถ้าไม่ส่ง — กันไว้ตรงนี้ก่อนเสียเที่ยว
  if (!customerUsername) {
    throw new SupplierError(
      'byshop_missing_customer',
      'ต้องระบุยูสเซอร์ลูกค้า (username_customer) ที่จะผูกกับรายการนี้ฝั่ง BYShop',
      400
    );
  }

  const body = await call('/buy', {
    keyapi: requireKey(),
    id: input.productId,
    username_customer: customerUsername,
  });

  return isRecord(body) ? body : { result: body };
}

/**
 * HTML จาก `product_info` → ข้อความล้วน
 *
 * ต้นทางส่ง HTML ดิบมา ส่วน `products.description` ของเราถูกแสดงเป็นข้อความ ถ้าเก็บ
 * ทั้งก้อนไว้ลูกค้าจะเห็นแท็กเต็มไปหมด และถ้าไปเรนเดอร์เป็น HTML ก็คือเปิดช่อง XSS
 * ให้ต้นทาง — จึงถอดแท็กทิ้งตั้งแต่ตอนนำเข้า
 */
export function byshopInfoToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h\d|li|div)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);
}

/** แจ้งปัญหาออเดอร์ — `reportId` ต้องเป็นหนึ่งใน BYSHOP_REPORT_REASONS */
export async function reportByshopIssue(input: {
  orderId: string;
  reportId: number;
}): Promise<Record<string, unknown>> {
  const body = await call('/report_fix', {
    keyapi: requireKey(),
    orderid: input.orderId,
    report_id: String(input.reportId),
  });

  return isRecord(body) ? body : { result: body };
}
