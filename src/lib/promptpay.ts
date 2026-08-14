import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import type { PromptPayTarget } from './promptpay-id';

/**
 * PromptPay QR สำหรับหน้าเติมเงิน
 *
 * The QR only *asks* for money — nothing here credits a wallet. The customer
 * scans it, pays, and the slip they upload afterwards is what `/api/topups`
 * verifies against the bank. So this file has no security duties beyond one:
 * encoding the shop's own receiving ID, never a number a caller supplied.
 *
 * Server-side only: `qrcode` and `promptpay-qr` are far too much to ship to a
 * browser for one image. Whoever needs the ID *rule* imports `promptpay-id`.
 */

export interface PromptPayQr extends PromptPayTarget {
  /** The EMV QRCPS string a banking app reads. */
  payload: string;
  /** PNG data URL, ready for `<img src>`. */
  image: string;
  /** null = static QR, the payer types the amount in themselves. */
  amount: number | null;
}

/**
 * Renders the QR for `target`, with the amount baked in when given so the
 * banking app pre-fills it — one less number for the customer to mistype, and
 * one less mismatch for the slip check to reject later.
 *
 * Amount is rounded to satang because the payload carries exactly two decimals;
 * anything finer would be encoded rounded anyway and then fail to match the
 * figure the customer declares.
 */
export async function buildPromptPayQr(
  target: PromptPayTarget,
  amount: number | null
): Promise<PromptPayQr> {
  const rounded =
    amount !== null && Number.isFinite(amount) && amount > 0
      ? Math.round(amount * 100) / 100
      : null;

  const payload = generatePayload(target.digits, rounded ? { amount: rounded } : {});

  const image = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
    // Slightly-off-black on white keeps contrast well inside what scanners need.
    color: { dark: '#171717ff', light: '#ffffffff' },
  });

  return { ...target, payload, image, amount: rounded };
}
