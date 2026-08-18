import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

/**
 * เปิดให้บอตเข้าได้ (ไม่ได้ห้ามใน robots.txt) แต่สั่ง noindex ไว้
 *
 * สลับกันไม่ได้: ถ้าห้ามใน robots.txt บอตจะอ่านไม่เห็นคำสั่ง noindex แล้ว URL
 * อาจไปโผล่ในผลค้นหาแบบไม่มีคำอธิบาย ซึ่งแย่กว่าไม่โผล่เลย
 */
export const metadata: Metadata = pageMetadata({
  title: 'ลืมรหัสผ่าน',
  description: 'ขอลิงก์ตั้งรหัสผ่านใหม่สำหรับบัญชี NEO APP ทางอีเมล',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
