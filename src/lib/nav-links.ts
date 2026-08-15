import type { StoreSettings } from './settings';

/**
 * เปิด/ปิดเมนูใน navbar ทีละรายการ
 *
 * ปิดที่นี่คือซ่อนจาก navbar เท่านั้น หน้านั้น ๆ ยังเข้าตรง URL ได้อยู่ — นี่เป็น
 * ทางลัดนำทาง ไม่ใช่การจำกัดสิทธิ์ จึงไม่ต้องมี route handler ตรวจซ้ำแบบ
 * ช่องทางเติมเงิน
 */
export type NavLinkKey = 'home' | 'shop' | 'orders' | 'wallet' | 'resetHwid' | 'contact';

type NavLinkField =
  | 'navHomeEnabled'
  | 'navShopEnabled'
  | 'navOrdersEnabled'
  | 'navWalletEnabled'
  | 'navResetHwidEnabled'
  | 'navContactEnabled';

export interface NavLinkSpec {
  key: NavLinkKey;
  field: NavLinkField;
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLinkSpec[] = [
  { key: 'home', field: 'navHomeEnabled', label: 'หน้าแรก', href: '/' },
  { key: 'shop', field: 'navShopEnabled', label: 'ร้านค้า', href: '/#products-section' },
  { key: 'orders', field: 'navOrdersEnabled', label: 'บัญชีเกมที่ซื้อไว้', href: '/orders' },
  { key: 'wallet', field: 'navWalletEnabled', label: 'กระเป๋าเงิน', href: '/wallet' },
  { key: 'resetHwid', field: 'navResetHwidEnabled', label: 'Reset HWID', href: '/reset-hwid' },
  { key: 'contact', field: 'navContactEnabled', label: 'ติดต่อเรา', href: '/contact' },
];

export function isNavLinkEnabled(settings: StoreSettings, key: NavLinkKey): boolean {
  const spec = NAV_LINKS.find((entry) => entry.key === key);
  return spec ? settings[spec.field] : false;
}
