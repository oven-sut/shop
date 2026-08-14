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
  taxRate: number;
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
  taxRate: 7,
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
    taxRate: num(row.tax_rate, DEFAULT_SETTINGS.taxRate),
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
  set('taxRate', 'tax_rate', (v) => num(v, DEFAULT_SETTINGS.taxRate));

  return row;
}

export async function loadSettings(supabase: SupabaseClient): Promise<StoreSettings> {
  const { data } = await supabase.from('store_settings').select('*').maybeSingle();
  return toSettings(data as Row | null);
}
