import type { StoreSettings } from './settings';

/**
 * เปิด/ปิดช่องทางเติมเงิน
 *
 * Before this existed the only way to close a channel was to delete its config —
 * which also deleted what the customer needs to see, and could not close the slip
 * channel at all. The switches are separate from the config so an admin can stop
 * taking money one way without forgetting how it was set up.
 *
 * Kept dependency-free so the admin form, the wallet page and the route handlers
 * all read the same list. **Hiding a tab is not closing a channel** — every
 * endpoint checks these itself, because the browser is not where this is decided.
 */
export type TopupChannel = 'slip' | 'qr' | 'truemoney' | 'voucher';

/** ฟิลด์ boolean ใน StoreSettings ที่คุมแต่ละช่อง */
type ChannelField =
  | 'topupSlipEnabled'
  | 'topupQrEnabled'
  | 'topupTruemoneyEnabled'
  | 'topupVoucherEnabled';

export interface TopupChannelSpec {
  key: TopupChannel;
  field: ChannelField;
  label: string;
  /** อธิบายผลของการปิด ให้แอดมินเห็นก่อนกด */
  hint: string;
}

export const TOPUP_CHANNELS: readonly TopupChannelSpec[] = [
  {
    key: 'slip',
    field: 'topupSlipEnabled',
    label: 'โอนแล้วส่งสลิป',
    // The one channel where closing it can strand money: the customer transfers
    // first and only then uploads. Say so rather than let it be discovered.
    hint: 'ปิดแล้วลูกค้าอัปโหลดสลิปไม่ได้ — ถ้ามีคนโอนมาแล้วต้องเติมให้เองในฐานข้อมูล',
  },
  {
    key: 'qr',
    field: 'topupQrEnabled',
    label: 'QR พร้อมเพย์',
    hint: 'คุมทั้ง QR ที่ร้านวาดเอง และ QR ของเกตเวย์ที่เติมให้อัตโนมัติ',
  },
  {
    key: 'truemoney',
    field: 'topupTruemoneyEnabled',
    label: 'ทรูวอลเล็ต (ผ่านเกตเวย์)',
    hint: 'ลูกค้าจ่ายจากวอลเล็ตตัวเองแล้วยืนยัน OTP — ต้องต่อเกตเวย์ที่รองรับไว้ก่อน',
  },
  {
    key: 'voucher',
    field: 'topupVoucherEnabled',
    label: 'ซองอังเปาทรูมันนี่',
    hint: 'ต้องกรอกเบอร์ทรูวอลเล็ตของร้านด้วย และตอนนี้ทรูบล็อกการไถ่จากฝั่งเซิร์ฟเวอร์อยู่',
  },
];

export function isChannelEnabled(settings: StoreSettings, channel: TopupChannel): boolean {
  const spec = TOPUP_CHANNELS.find((entry) => entry.key === channel);
  return spec ? settings[spec.field] : false;
}

/**
 * ข้อความเดียวกันทุกที่ที่ปฏิเสธเพราะช่องถูกปิด
 *
 * Deliberately says the shop closed it, not that something broke — a customer
 * who reads "ระบบขัดข้อง" will retry all evening.
 */
export function channelClosedMessage(channel: TopupChannel): string {
  const label = TOPUP_CHANNELS.find((entry) => entry.key === channel)?.label ?? 'ช่องทางนี้';
  return `ร้านปิดการเติมเงินช่องทาง "${label}" ไว้ กรุณาเลือกช่องทางอื่น`;
}
