import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'นโยบายความเป็นส่วนตัว',
  description:
    'NEO APP เก็บข้อมูลอะไรของคุณบ้าง เอาไปใช้ทำอะไร เก็บไว้นานแค่ไหน ' +
    'และคุณขอแก้ไขหรือลบได้อย่างไร',
  path: '/privacy',
});

const UPDATED = '14 สิงหาคม 2569';

export default function PrivacyPage() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
      <JsonLd
        data={graph(breadcrumbSchema([
          { name: 'หน้าแรก', path: '/' },
          { name: 'นโยบายความเป็นส่วนตัว', path: '/privacy' },
        ]))}
      />

      <header className="space-y-1 pb-4 border-b border-neutral-100">
        <h1 className="text-2xl font-extrabold text-neutral-900">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-xs text-neutral-400">ปรับปรุงล่าสุด {UPDATED}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">1. ข้อมูลที่เราเก็บ</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-neutral-200 rounded-xl overflow-hidden">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left p-2.5 font-semibold">ข้อมูล</th>
                <th className="text-left p-2.5 font-semibold">เก็บเมื่อไร</th>
                <th className="text-left p-2.5 font-semibold">ใช้ทำอะไร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <td className="p-2.5">อีเมล ชื่อ รูปโปรไฟล์</td>
                <td className="p-2.5">ตอนสมัครสมาชิกหรือเข้าสู่ระบบด้วย Google</td>
                <td className="p-2.5">ยืนยันตัวตนและแสดงบัญชีของคุณ</td>
              </tr>
              <tr>
                <td className="p-2.5">ยอดเงินและประวัติการเคลื่อนไหว</td>
                <td className="p-2.5">เมื่อเติมเงินหรือสั่งซื้อ</td>
                <td className="p-2.5">คิดเงินให้ถูกต้องและให้คุณตรวจสอบย้อนหลังได้</td>
              </tr>
              <tr>
                <td className="p-2.5">ข้อมูลบนสลิปโอนเงิน</td>
                <td className="p-2.5">เมื่อคุณอัปโหลดสลิปเพื่อเติมเงิน</td>
                <td className="p-2.5">ตรวจสอบว่าโอนจริง ป้องกันสลิปปลอมและการใช้สลิปซ้ำ</td>
              </tr>
              <tr>
                <td className="p-2.5">ชื่อ ที่อยู่ เบอร์โทรผู้รับ</td>
                <td className="p-2.5">เมื่อคุณกรอกตอนสั่งซื้อ</td>
                <td className="p-2.5">ออกคำสั่งซื้อและติดต่อกลับ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">2. ผู้ให้บริการภายนอก</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Supabase</strong> — ระบบบัญชีผู้ใช้ ฐานข้อมูล และที่เก็บไฟล์
          </li>
          <li>
            <strong>Google</strong> — เฉพาะกรณีที่คุณเลือกเข้าสู่ระบบด้วยบัญชี Google
          </li>
          <li>
            <strong>RDCW (Slip Verify)</strong> — ตรวจสอบสลิปโอนเงินกับธนาคาร
            โดยส่งข้อมูลบนสลิปที่คุณอัปโหลดไปตรวจสอบ
          </li>
          <li>
            <strong>499K Network</strong> — ซัพพลายเออร์สินค้า
            เราส่งเฉพาะรหัสสินค้าและหมายเลขอ้างอิงคำสั่งซื้อ ไม่ได้ส่งข้อมูลส่วนตัวของคุณ
          </li>
          <li>
            <strong>Google Analytics</strong> — สถิติการใช้งานเว็บไซต์แบบไม่ระบุตัวตน
            จะเริ่มเก็บข้อมูลก็ต่อเมื่อคุณกดยอมรับคุกกี้เพื่อการวิเคราะห์เท่านั้น
          </li>
        </ul>
        <p className="text-neutral-500">
          เราไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลที่สาม
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">3. ระยะเวลาเก็บข้อมูล</h2>
        <p>
          ข้อมูลบัญชีเก็บไว้ตลอดเวลาที่คุณยังใช้งานอยู่
          ส่วนรายการเติมเงินและคำสั่งซื้อเก็บไว้เท่าที่จำเป็นสำหรับการตรวจสอบทางบัญชีและตามที่กฎหมายกำหนด
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">4. ความปลอดภัย</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>รหัสผ่านถูกจัดเก็บแบบเข้ารหัสโดยระบบยืนยันตัวตนของ Supabase เราไม่เห็นรหัสผ่านของคุณ</li>
          <li>สิทธิ์การเข้าถึงข้อมูลถูกบังคับที่ระดับฐานข้อมูล (Row Level Security)</li>
          <li>การเชื่อมต่อทั้งหมดเข้ารหัสด้วย HTTPS</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">5. สิทธิของคุณ</h2>
        <p>
          คุณมีสิทธิขอเข้าถึง ขอสำเนา ขอแก้ไข ขอลบ หรือคัดค้านการประมวลผลข้อมูลส่วนบุคคลของคุณ
          รวมถึงเพิกถอนความยินยอมได้ตลอดเวลา โดยติดต่อผู้ให้บริการตามช่องทางด้านล่าง
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-neutral-100">
        <h2 className="text-base font-bold text-neutral-900">6. ติดต่อ</h2>
        <p className="text-neutral-500">
          ผู้ควบคุมข้อมูล: <span className="font-semibold text-neutral-700">[ระบุชื่อผู้ประกอบการ]</span>
          {' · '}อีเมล: <span className="font-semibold text-neutral-700">[ระบุอีเมลติดต่อ]</span>
        </p>
        <p className="text-xs text-neutral-600 border-l-2 border-neutral-900 pl-3 py-1">
          เอกสารนี้เป็นแบบร่าง ก่อนเปิดให้บริการจริงควรกรอกข้อมูลผู้ประกอบการให้ครบ
          และให้ผู้เชี่ยวชาญด้านกฎหมายตรวจสอบให้สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </p>
      </section>
    </div>
  );
}
