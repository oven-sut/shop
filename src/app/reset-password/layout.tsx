import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

/** ปลายทางของลิงก์ในอีเมล — มีโทเคนอยู่ใน URL จึงต้องไม่ถูกจัดทำดัชนีเด็ดขาด */
export const metadata: Metadata = pageMetadata({
  title: 'ตั้งรหัสผ่านใหม่',
  description: 'ตั้งรหัสผ่านใหม่สำหรับบัญชี NEO APP',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
