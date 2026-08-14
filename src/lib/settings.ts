import { SupabaseClient } from '@supabase/supabase-js';

export interface StoreSettings {
  storeName: string;
  isOpen: boolean;
  topupReceiverName: string;
  topupReceiverAccount: string;
  topupBankName: string;
  topupMinAmount: number;
  topupMaxAmount: number;
  topupMaxSlipAgeDays: number;
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
  topupMinAmount: 1,
  topupMaxAmount: 50000,
  topupMaxSlipAgeDays: 7,
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
    topupMinAmount: num(row.topup_min_amount, DEFAULT_SETTINGS.topupMinAmount),
    topupMaxAmount: num(row.topup_max_amount, DEFAULT_SETTINGS.topupMaxAmount),
    topupMaxSlipAgeDays: num(row.topup_max_slip_age_days, DEFAULT_SETTINGS.topupMaxSlipAgeDays),
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
  set('topupMinAmount', 'topup_min_amount', (v) => num(v, DEFAULT_SETTINGS.topupMinAmount));
  set('topupMaxAmount', 'topup_max_amount', (v) => num(v, DEFAULT_SETTINGS.topupMaxAmount));
  set('topupMaxSlipAgeDays', 'topup_max_slip_age_days', (v) =>
    Math.trunc(num(v, DEFAULT_SETTINGS.topupMaxSlipAgeDays))
  );
  set('taxRate', 'tax_rate', (v) => num(v, DEFAULT_SETTINGS.taxRate));

  return row;
}

export async function loadSettings(supabase: SupabaseClient): Promise<StoreSettings> {
  const { data } = await supabase.from('store_settings').select('*').maybeSingle();
  return toSettings(data as Row | null);
}
