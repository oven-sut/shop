import type { StoreSettings } from './settings';

/**
 * ช่องทางติดต่อร้าน
 *
 * Lives in settings rather than in the page, so the shop's LINE id or phone
 * number can change without a deploy — and in one list, so the admin form, the
 * contact page and anything added later cannot disagree about what exists.
 */
export type ContactField =
  | 'contactLine'
  | 'contactEmail'
  | 'contactPhone'
  | 'contactFacebook'
  | 'contactDiscord'
  | 'contactHours'
  | 'contactNote';

export interface ContactChannelSpec {
  field: ContactField;
  label: string;
  placeholder: string;
  /** เป็นข้อความล้วน ไม่ต้องทำเป็นลิงก์ (เวลาทำการ, หมายเหตุ) */
  textOnly?: boolean;
  /** ข้อความยาว ใช้ textarea ในหน้าแอดมิน */
  multiline?: boolean;
}

export const CONTACT_CHANNELS: readonly ContactChannelSpec[] = [
  { field: 'contactLine', label: 'LINE', placeholder: '@neoapp หรือลิงก์ https://line.me/...' },
  { field: 'contactEmail', label: 'อีเมล', placeholder: 'support@example.com' },
  { field: 'contactPhone', label: 'โทรศัพท์', placeholder: '08x-xxx-xxxx' },
  { field: 'contactFacebook', label: 'Facebook', placeholder: 'ชื่อเพจ หรือลิงก์ https://facebook.com/...' },
  {
    field: 'contactDiscord',
    label: 'Discord',
    placeholder: 'ลิงก์เชิญ https://discord.gg/xxxx หรือชื่อผู้ใช้',
  },
  { field: 'contactHours', label: 'เวลาทำการ', placeholder: 'ทุกวัน 09:00 – 22:00', textOnly: true },
  {
    field: 'contactNote',
    label: 'ข้อความเพิ่มเติม',
    placeholder: 'เช่น ตอบกลับภายใน 24 ชม. / แจ้งปัญหาการสั่งซื้อทาง LINE เร็วที่สุด',
    textOnly: true,
    multiline: true,
  },
];

/** ยอมเฉพาะ http(s) — ค่าที่แอดมินพิมพ์เองก็ยังไม่ควรกลายเป็น `javascript:` ใน href */
const isWebUrl = (value: string) => /^https?:\/\//i.test(value);

/** ชื่อเพจ/ไอดีที่เอาไปต่อท้าย URL ได้อย่างปลอดภัย */
const isHandle = (value: string) => /^[A-Za-z0-9._-]+$/.test(value);

/**
 * ลิงก์ที่กดได้ของช่องนั้น — คืน null ถ้าค่าที่กรอกไม่ควรทำเป็นลิงก์
 *
 * คืน null แล้วหน้าเว็บจะแสดงเป็นข้อความให้คัดลอกแทน ดีกว่าเดา URL ผิดแล้วพาลูกค้า
 * ไปหน้าที่ไม่มีอยู่จริง
 */
export function contactHref(field: ContactField, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  switch (field) {
    case 'contactEmail':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;

    case 'contactPhone': {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 9 ? `tel:${digits}` : null;
    }

    case 'contactLine':
      if (isWebUrl(value)) return value;
      // ไอดีทางการขึ้นต้นด้วย @ ส่วนไอดีทั่วไปไม่มี — LINE ใช้ path คนละแบบ
      if (value.startsWith('@') && isHandle(value.slice(1))) {
        return `https://line.me/R/ti/p/${encodeURIComponent(value)}`;
      }
      return isHandle(value) ? `https://line.me/ti/p/~${encodeURIComponent(value)}` : null;

    case 'contactFacebook':
      if (isWebUrl(value)) return value;
      return isHandle(value) ? `https://facebook.com/${encodeURIComponent(value)}` : null;

    case 'contactDiscord':
      // ลิงก์เชิญกดได้เลย ส่วนชื่อผู้ใช้ Discord ไม่มี URL โปรไฟล์สาธารณะ
      // จึงปล่อยเป็นข้อความให้ลูกค้าคัดลอกไปค้นในแอปเอง
      return isWebUrl(value) ? value : null;

    default:
      return null;
  }
}

/** ช่องที่กรอกไว้จริง เรียงตามลำดับใน CONTACT_CHANNELS */
export function filledContacts(settings: Pick<StoreSettings, ContactField>) {
  return CONTACT_CHANNELS.filter((channel) => settings[channel.field].trim()).map((channel) => ({
    ...channel,
    value: settings[channel.field].trim(),
    href: channel.textOnly ? null : contactHref(channel.field, settings[channel.field]),
  }));
}
