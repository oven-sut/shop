import { easyslipProvider } from './easyslip';
import { rdcwProvider } from './rdcw';
import { slipokProvider } from './slipok';
import { thunderProvider } from './thunder';
import { SlipDetails, SlipInput, SlipProvider, SlipVerifyError } from './types';

export type { SlipDetails, SlipInput, SlipProvider } from './types';
export { SlipVerifyError } from './types';

const ALL: SlipProvider[] = [rdcwProvider, slipokProvider, thunderProvider, easyslipProvider];

/**
 * ลำดับที่จะลอง อ่านจาก SLIP_PROVIDERS เช่น `SLIP_PROVIDERS=slipok,rdcw`
 * ถ้าไม่ตั้งไว้จะใช้ทุกเจ้าที่กรอกคีย์ครบ เรียงตามลำดับใน ALL
 *
 * เจ้าที่ยังไม่ได้กรอกคีย์จะถูกข้ามเงียบ ๆ ตั้งแต่ต้น ไม่เสียเวลายิงเน็ต
 */
export function activeProviders(): SlipProvider[] {
  const configured = ALL.filter((provider) => provider.isConfigured());
  const order = (process.env.SLIP_PROVIDERS ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (!order.length) return configured;

  const byName = new Map(configured.map((provider) => [provider.name, provider]));
  return order.flatMap((name) => {
    const provider = byName.get(name);
    return provider ? [provider] : [];
  });
}

/**
 * ตรวจสลิป โดยไล่ผู้ให้บริการทีละเจ้าจนกว่าจะมีเจ้าไหนตอบได้
 *
 * กติกาการข้ามไปเจ้าถัดไป อยู่ที่ `SlipVerifyError.retryable`:
 *
 * - โควตาหมด / คีย์ผิด / เจ้านั้นล่ม / อ่านรูปไม่ออก → ลองเจ้าถัดไป
 * - ธนาคารตอบว่าสลิปใบนี้ไม่ถูกต้อง → หยุดทันที
 *
 * ข้อที่สองสำคัญ: ถ้าปล่อยให้ไล่ต่อ จะเผาโควตาเจ้าอื่นทิ้งเปล่า ๆ
 * ทั้งที่ทุกเจ้าถามธนาคารกลางเดียวกันและจะได้คำตอบเดิม
 *
 * ถ้าทุกเจ้าล้มหมด จะโยน error ของเจ้าสุดท้าย พร้อมแนบว่าลองเจ้าไหนไปบ้าง
 * เพื่อให้แอดมินเห็นทันทีว่าต้องไปเติมโควตาเจ้าไหน
 */
export async function verifySlip(input: SlipInput): Promise<SlipDetails> {
  const providers = activeProviders();

  if (!providers.length) {
    throw new SlipVerifyError(
      'slip_not_configured',
      'ยังไม่ได้ตั้งค่าผู้ให้บริการตรวจสลิปสักเจ้าใน .env (RDCW_*, SLIPOK_*, THUNDER_*, EASYSLIP_*)',
      500
    );
  }

  const failures: string[] = [];

  for (const [index, provider] of providers.entries()) {
    const isLast = index === providers.length - 1;

    try {
      return await provider.verify(input);
    } catch (error) {
      if (!(error instanceof SlipVerifyError)) throw error;

      // ธนาคารตัดสินแล้ว — ไม่ต้องถามเจ้าอื่นให้เปลืองโควตา
      if (!error.retryable) throw error;

      failures.push(`${provider.name}: ${error.code}`);

      if (isLast) {
        throw new SlipVerifyError(
          error.code,
          `${error.message} (ลองแล้ว ${failures.length} เจ้า — ${failures.join(', ')})`,
          error.status,
          { retryable: true }
        );
      }
    }
  }

  // ไปไม่ถึงตรงนี้: ลูปข้างบน return หรือ throw เสมอ
  throw new SlipVerifyError('slip_verify_failed', 'ตรวจสอบสลิปไม่สำเร็จ', 502);
}
