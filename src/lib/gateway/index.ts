import { omiseGateway } from './omise';
import { PaymentGateway } from './types';

export type { ChargeStatus, GatewayCharge, PaymentGateway } from './types';
export { GatewayError } from './types';

const ALL: PaymentGateway[] = [omiseGateway];

/**
 * เกตเวย์ที่ใช้อยู่ หรือ null ถ้ายังไม่ได้ตั้งคีย์เจ้าไหนเลย
 *
 * Unlike slip verification there is no falling through to the next provider: a
 * charge lives at one gateway and only that gateway can say whether it was paid.
 * `PAYMENT_GATEWAY` picks one when more than one is configured.
 *
 * null is a supported state, not an error — the wallet page then offers the
 * shop's own PromptPay QR with a slip upload instead of instant credit.
 */
export function activeGateway(): PaymentGateway | null {
  const configured = ALL.filter((gateway) => gateway.isConfigured());
  const wanted = (process.env.PAYMENT_GATEWAY ?? '').trim().toLowerCase();

  if (wanted) return configured.find((gateway) => gateway.name === wanted) ?? null;

  return configured[0] ?? null;
}
