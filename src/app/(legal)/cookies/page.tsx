import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'นโยบายคุกกี้ - NEO APP' };

const UPDATED = '14 สิงหาคม 2569';

const COOKIES = [
  {
    name: 'sb-<project-ref>-auth-token',
    type: 'จำเป็น',
    purpose: 'เก็บ session การเข้าสู่ระบบ (JWT) เพื่อให้เว็บรู้ว่าคุณเป็นใคร',
    life: 'จนกว่าจะออกจากระบบหรือหมดอายุ',
  },
  {
    name: 'neo_cookie_consent',
    type: 'จำเป็น',
    purpose: 'จำว่าคุณเลือกยอมรับคุกกี้แบบไหน จะได้ไม่ถามซ้ำ',
    life: 'จนกว่าจะล้างข้อมูลเบราว์เซอร์',
  },
  {
    name: 'neo_cart / neo_wishlist',
    type: 'จำเป็น',
    purpose: 'เก็บตะกร้าสินค้าและรายการโปรดไว้ในเครื่องของคุณเอง',
    life: 'จนกว่าจะล้างข้อมูลเบราว์เซอร์',
  },
];

export default function CookiesPage() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700">
      <header className="space-y-1 pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-extrabold text-slate-900">นโยบายคุกกี้</h1>
        <p className="text-xs text-slate-400">ปรับปรุงล่าสุด {UPDATED}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">1. คุกกี้คืออะไร</h2>
        <p>
          คุกกี้คือไฟล์ข้อมูลขนาดเล็กที่เว็บไซต์ฝากไว้ในเบราว์เซอร์ของคุณ
          เว็บนี้ใช้ทั้งคุกกี้และพื้นที่เก็บข้อมูลในเบราว์เซอร์ (localStorage) ในลักษณะเดียวกัน
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. รายการที่เราใช้</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-2.5 font-semibold">ชื่อ</th>
                <th className="text-left p-2.5 font-semibold">ประเภท</th>
                <th className="text-left p-2.5 font-semibold">ใช้ทำอะไร</th>
                <th className="text-left p-2.5 font-semibold">อยู่นานแค่ไหน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COOKIES.map((cookie) => (
                <tr key={cookie.name}>
                  <td className="p-2.5 font-mono text-[11px] text-slate-800">{cookie.name}</td>
                  <td className="p-2.5">{cookie.type}</td>
                  <td className="p-2.5">{cookie.purpose}</td>
                  <td className="p-2.5 text-slate-500">{cookie.life}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-500 text-xs">
          ปัจจุบันเรายังไม่ได้ติดตั้งคุกกี้เพื่อการวิเคราะห์หรือโฆษณา
          หากมีการเพิ่มในอนาคตจะเก็บเฉพาะเมื่อคุณกดยอมรับ และจะอัปเดตตารางนี้
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">3. คุกกี้ที่ปิดไม่ได้</h2>
        <p>
          คุกกี้ประเภท &quot;จำเป็น&quot; ทำให้ระบบเข้าสู่ระบบ ตะกร้าสินค้า และการเติมเงินทำงานได้
          หากปิดจะใช้งานเว็บไซต์ไม่ได้ จึงไม่ได้ให้เลือกปิดในแถบยินยอม
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">4. เปลี่ยนใจภายหลัง</h2>
        <p>
          ล้างคุกกี้และข้อมูลเว็บไซต์นี้ในเบราว์เซอร์ของคุณ แถบขอความยินยอมจะกลับมาแสดงอีกครั้ง
          และคุณเลือกใหม่ได้ การปฏิเสธคุกกี้ที่ไม่จำเป็นไม่กระทบการสั่งซื้อ
        </p>
      </section>
    </div>
  );
}
