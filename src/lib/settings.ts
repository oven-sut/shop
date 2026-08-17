import { SupabaseClient } from '@supabase/supabase-js';

export interface StoreSettings {
  storeName: string;
  isOpen: boolean;
  topupReceiverName: string;
  /** เลขบัญชีธนาคาร — เทียบผู้รับในสลิปได้ แต่ทำ QR ไม่ได้ */
  topupReceiverAccount: string;
  topupBankName: string;
  /** พร้อมเพย์ — ช่องเดียวที่เอาไปสร้าง QR ให้ลูกค้าสแกนได้ */
  topupPromptpayId: string;
  /** เบอร์ทรูวอลเล็ตของร้าน — ปลายทางที่ไถ่ซองอังเปาเข้า */
  topupTruemoneyPhone: string;
  topupMinAmount: number;
  topupMaxAmount: number;
  topupMaxSlipAgeDays: number;
  /** เปิด/ปิดช่องทางเติมเงิน — ดู lib/topup-channels.ts */
  topupSlipEnabled: boolean;
  topupQrEnabled: boolean;
  topupTruemoneyEnabled: boolean;
  topupVoucherEnabled: boolean;
  /** ปิดแล้วสินค้าจากซัพพลายเออร์หายจากหน้าร้านและสั่งซื้อไม่ได้ */
  sellAppsEnabled: boolean;
  /** ช่องทางติดต่อที่แสดงหน้า /contact — ดู lib/contact.ts */
  contactLine: string;
  contactEmail: string;
  contactPhone: string;
  contactFacebook: string;
  contactDiscord: string;
  contactHours: string;
  contactNote: string;
  taxRate: number;
  /** แถบประกาศหน้าแรก — ปิดไว้เป็นค่าเริ่มต้นจนกว่าแอดมินจะกรอกและเปิดเอง */
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  /** แบนเนอร์รูปภาพบนสุดของหน้าแรก — ว่าง = ไม่แสดง */
  heroBannerImage: string;
  heroBannerLink: string;
  /** เปิด/ปิดเมนูใน navbar ทีละรายการ — ดู lib/nav-links.ts */
  navHomeEnabled: boolean;
  navShopEnabled: boolean;
  navOrdersEnabled: boolean;
  navWalletEnabled: boolean;
  navResetHwidEnabled: boolean;
  navContactEnabled: boolean;
}

type Row = Record<string, unknown>;

const num = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'NEO APP',
  isOpen: true,
  topupReceiverName: '',
  topupReceiverAccount: '',
  topupBankName: '',
  topupPromptpayId: '',
  topupTruemoneyPhone: '',
  topupMinAmount: 1,
  topupMaxAmount: 50000,
  topupMaxSlipAgeDays: 7,
  // เปิดทุกช่องเป็นค่าเริ่มต้น — ช่องที่ยังไม่ได้ตั้งคอนฟิกจะถูกซ่อนด้วยเงื่อนไขของมันเองอยู่แล้ว
  topupSlipEnabled: true,
  topupQrEnabled: true,
  topupTruemoneyEnabled: true,
  topupVoucherEnabled: true,
  sellAppsEnabled: true,
  contactLine: '',
  contactEmail: '',
  contactPhone: '',
  contactFacebook: '',
  contactDiscord: '',
  contactHours: '',
  contactNote: '',
  taxRate: 7,
  announcementEnabled: false,
  announcementText: '',
  announcementLink: '',
  heroBannerImage: '',
  heroBannerLink: '',
  navHomeEnabled: true,
  navShopEnabled: true,
  navOrdersEnabled: true,
  navWalletEnabled: true,
  navResetHwidEnabled: true,
  navContactEnabled: true,
};

export function toSettings(row: Row | null | undefined): StoreSettings {
  if (!row) return DEFAULT_SETTINGS;

  return {
    storeName: (row.store_name as string) || DEFAULT_SETTINGS.storeName,
    isOpen: row.is_open !== false,
    topupReceiverName: (row.topup_receiver_name as string) ?? '',
    topupReceiverAccount: (row.topup_receiver_account as string) ?? '',
    topupBankName: (row.topup_bank_name as string) ?? '',
    topupPromptpayId: (row.topup_promptpay_id as string) ?? '',
    topupTruemoneyPhone: (row.topup_truemoney_phone as string) ?? '',
    topupMinAmount: num(row.topup_min_amount, DEFAULT_SETTINGS.topupMinAmount),
    topupMaxAmount: num(row.topup_max_amount, DEFAULT_SETTINGS.topupMaxAmount),
    topupMaxSlipAgeDays: num(row.topup_max_slip_age_days, DEFAULT_SETTINGS.topupMaxSlipAgeDays),
    // `!== false` เพื่อให้แถวที่ยังไม่มีคอลัมน์นี้ (undefined) นับเป็นเปิด เหมือน is_open
    topupSlipEnabled: row.topup_slip_enabled !== false,
    topupQrEnabled: row.topup_qr_enabled !== false,
    topupTruemoneyEnabled: row.topup_truemoney_enabled !== false,
    topupVoucherEnabled: row.topup_voucher_enabled !== false,
    sellAppsEnabled: row.sell_apps_enabled !== false,
    contactLine: (row.contact_line as string) ?? '',
    contactEmail: (row.contact_email as string) ?? '',
    contactPhone: (row.contact_phone as string) ?? '',
    contactFacebook: (row.contact_facebook as string) ?? '',
    contactDiscord: (row.contact_discord as string) ?? '',
    contactHours: (row.contact_hours as string) ?? '',
    contactNote: (row.contact_note as string) ?? '',
    taxRate: num(row.tax_rate, DEFAULT_SETTINGS.taxRate),
    announcementEnabled: row.announcement_enabled === true,
    announcementText: (row.announcement_text as string) ?? '',
    announcementLink: (row.announcement_link as string) ?? '',
    heroBannerImage: (row.hero_banner_image as string) ?? '',
    heroBannerLink: (row.hero_banner_link as string) ?? '',
    navHomeEnabled: row.nav_home_enabled !== false,
    navShopEnabled: row.nav_shop_enabled !== false,
    navOrdersEnabled: row.nav_orders_enabled !== false,
    navWalletEnabled: row.nav_wallet_enabled !== false,
    navResetHwidEnabled: row.nav_reset_hwid_enabled !== false,
    navContactEnabled: row.nav_contact_enabled !== false,
  };
}

/** Only the columns an admin may change, mapped back to database names. */
export function toSettingsRow(input: Record<string, unknown>): Row {
  const row: Row = {};
  const set = (key: string, column: string, cast: (value: unknown) => unknown) => {
    if (input[key] !== undefined) row[column] = cast(input[key]);
  };

  set('storeName', 'store_name', String);
  set('isOpen', 'is_open', Boolean);
  set('topupReceiverName', 'topup_receiver_name', String);
  set('topupReceiverAccount', 'topup_receiver_account', String);
  set('topupBankName', 'topup_bank_name', String);
  set('topupPromptpayId', 'topup_promptpay_id', String);
  set('topupTruemoneyPhone', 'topup_truemoney_phone', String);
  set('topupMinAmount', 'topup_min_amount', (v) => num(v, DEFAULT_SETTINGS.topupMinAmount));
  set('topupMaxAmount', 'topup_max_amount', (v) => num(v, DEFAULT_SETTINGS.topupMaxAmount));
  set('topupMaxSlipAgeDays', 'topup_max_slip_age_days', (v) =>
    Math.trunc(num(v, DEFAULT_SETTINGS.topupMaxSlipAgeDays))
  );
  set('topupSlipEnabled', 'topup_slip_enabled', Boolean);
  set('topupQrEnabled', 'topup_qr_enabled', Boolean);
  set('topupTruemoneyEnabled', 'topup_truemoney_enabled', Boolean);
  set('topupVoucherEnabled', 'topup_voucher_enabled', Boolean);
  set('sellAppsEnabled', 'sell_apps_enabled', Boolean);
  set('contactLine', 'contact_line', String);
  set('contactEmail', 'contact_email', String);
  set('contactPhone', 'contact_phone', String);
  set('contactFacebook', 'contact_facebook', String);
  set('contactDiscord', 'contact_discord', String);
  set('contactHours', 'contact_hours', String);
  set('contactNote', 'contact_note', String);
  set('taxRate', 'tax_rate', (v) => num(v, DEFAULT_SETTINGS.taxRate));
  set('announcementEnabled', 'announcement_enabled', Boolean);
  set('announcementText', 'announcement_text', String);
  set('announcementLink', 'announcement_link', String);
  set('heroBannerImage', 'hero_banner_image', String);
  set('heroBannerLink', 'hero_banner_link', String);
  set('navHomeEnabled', 'nav_home_enabled', Boolean);
  set('navShopEnabled', 'nav_shop_enabled', Boolean);
  set('navOrdersEnabled', 'nav_orders_enabled', Boolean);
  set('navWalletEnabled', 'nav_wallet_enabled', Boolean);
  set('navResetHwidEnabled', 'nav_reset_hwid_enabled', Boolean);
  set('navContactEnabled', 'nav_contact_enabled', Boolean);

  return row;
}

export async function loadSettings(supabase: SupabaseClient): Promise<StoreSettings> {
  const { data } = await supabase.from('store_settings').select('*').maybeSingle();
  return toSettings(data as Row | null);
}
