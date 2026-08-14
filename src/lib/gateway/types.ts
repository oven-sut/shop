/**
 * ชั้นเกตเวย์รับชำระเงิน — QR ที่ "เข้าเลย" ไม่ต้องอัปสลิป
 *
 * The PromptPay QR the shop draws itself (see `lib/promptpay.ts`) can only ask
 * for money: nothing ever tells the shop that it arrived, which is why that
 * flow needs a slip. A gateway closes that gap — it issues the QR, watches the
 * money land, and calls back — so a top-up can be credited with no slip at all.
 *
 * One rule holds this together: **a webhook is a nudge, never evidence.** Anyone
 * can post a JSON body claiming a charge was paid. So the body is only read for
 * a charge id, and the amount and status always come from a fresh call to the
 * gateway's own API, authenticated with the shop's secret key.
 */

export type ChargeStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface GatewayCharge {
  /** id ฝั่งเกตเวย์ — ใช้เป็น trans_ref กันเติมซ้ำ */
  id: string;
  /** บาท (แปลงจากสตางค์ให้แล้ว ถ้าเกตเวย์นั้นคิดเป็นสตางค์) */
  amount: number;
  status: ChargeStatus;
  /**
   * เจ้าของรายการ อ่านจาก metadata ที่ฝากไว้ตอนสร้าง — ตัวนี้บอกว่าจะเติมเข้าใคร
   * ไม่ใช่คนที่ยิงมาถาม
   */
  userId?: string;
  expiresAt?: string;
  /** URL รูป QR ฝั่งเกตเวย์ — เบราว์เซอร์ไม่ได้ยิงตรง เราดึงมาส่งต่อเอง */
  qrUrl?: string;
  raw: Record<string, unknown>;
}

export interface PaymentGateway {
  /** ชื่อสั้น ๆ ที่ใช้อ้างใน PAYMENT_GATEWAY และเป็น prefix ของ trans_ref */
  readonly name: string;
  /** ตั้งคีย์ครบหรือยัง — ถ้ายัง หน้ากระเป๋าเงินจะถอยไปใช้ QR + สลิปแบบเดิม */
  isConfigured(): boolean;
  createCharge(input: { amount: number; userId: string }): Promise<GatewayCharge>;
  /** ถามสถานะจาก API ของเกตเวย์ — แหล่งความจริงเดียวที่ใช้ตัดสินใจเติมเงิน */
  fetchCharge(id: string): Promise<GatewayCharge>;
  /** ดึงรูป QR มาให้เราส่งต่อ พร้อม content-type ที่เกตเวย์บอก */
  fetchQrImage(charge: GatewayCharge): Promise<{ bytes: ArrayBuffer; contentType: string }>;
  /** อ่าน charge id จาก body ของ webhook — สถานะใน body ถูกทิ้งทั้งหมด */
  readWebhookChargeId(body: unknown): string | null;
}

export class GatewayError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 502) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.status = status;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** หนึ่งคำขอค้างอยู่ = ลูกค้ารอหน้าจอค้าง จึงตัดทิ้งแทนที่จะปล่อยแขวน */
export const GATEWAY_TIMEOUT_MS = 15_000;
