/**
 * What counts as a PromptPay ID.
 *
 * Kept apart from `promptpay.ts` on purpose: this rule is needed on both sides —
 * the admin form and the wallet page ask it too, to say up front whether a QR is
 * possible instead of offering a button that can only fail — while the encoder
 * next door pulls in `promptpay-qr` and `qrcode`, which have no business in a
 * browser bundle.
 */

/** The three ID shapes the Bank of Thailand's standard allows. */
export type PromptPayIdKind = 'phone' | 'national-id' | 'ewallet';

export interface PromptPayTarget {
  /** Digits only — the separators an admin typed are dropped. */
  digits: string;
  kind: PromptPayIdKind;
}

/**
 * `promptpay-qr` never refuses a target: it strips non-digits and pads whatever
 * is left into a 13-digit field, so a plain savings-account number — which is
 * *not* a PromptPay ID — still yields a scannable QR that pays no one. The
 * length check has to happen here, before that padding hides the mistake.
 */
export function readPromptPayTarget(raw: string): PromptPayTarget | null {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) return { digits, kind: 'phone' };
  if (digits.length === 13) return { digits, kind: 'national-id' };
  if (digits.length === 15) return { digits, kind: 'ewallet' };

  return null;
}

export const PROMPTPAY_KIND_LABEL: Record<PromptPayIdKind, string> = {
  phone: 'เบอร์พร้อมเพย์',
  'national-id': 'เลขบัตรประชาชน/เลขผู้เสียภาษี',
  ewallet: 'บัญชี e-Wallet',
};

/** Shown wherever an admin can type the receiving account. */
export const PROMPTPAY_SHAPE_HINT =
  'พร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก เลขบัตรประชาชน/ผู้เสียภาษี 13 หลัก หรือ e-Wallet 15 หลัก';
