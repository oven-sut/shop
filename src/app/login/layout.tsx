import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph, pageMetadata } from '@/lib/seo';

/**
 * The login page is a client component, which cannot export metadata itself —
 * hence this layout.
 *
 * ชื่อหน้าจึงไม่ได้เขียนว่า "เข้าสู่ระบบ" เฉย ๆ: ทุกหน้าที่เหลือเด้งมาที่นี่เมื่อยังไม่มี
 * session แปลว่านี่คือหน้าเดียวที่ Google เห็นจริง และเป็นปลายทางของลิงก์ที่ถูกแชร์
 * ทุกลิงก์ ผลค้นหาที่เขียนแค่ว่า "เข้าสู่ระบบ" ไม่บอกใครเลยว่าร้านขายอะไร
 */
export const metadata: Metadata = pageMetadata({
  title: 'เข้าสู่ระบบเพื่อซื้อแอปและไอดีเกม',
  description:
    'เข้าสู่ระบบหรือสมัครสมาชิก NEO APP ฟรี เพื่อซื้อแอปพรีเมียม ไอดีเกม และบริการดิจิทัล ' +
    'เติมเงินด้วยสลิปที่ระบบตรวจกับธนาคารอัตโนมัติ จ่ายแล้วรับสินค้าทันทีตลอด 24 ชั่วโมง',
  path: '/login',
});

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        data={graph(breadcrumbSchema([
          { name: 'หน้าแรก', path: '/' },
          { name: 'เข้าสู่ระบบ', path: '/login' },
        ]))}
      />
      {children}
    </>
  );
}
