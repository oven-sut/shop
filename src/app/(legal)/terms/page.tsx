import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน',
  description:
    'ข้อกำหนดการใช้งาน NEO APP — เงื่อนไขการสั่งซื้อ การเติมเงินเข้ากระเป๋า การส่งมอบสินค้าดิจิทัล และการคืนเงิน',
  alternates: { canonical: '/terms' },
};

const UPDATED = '14 สิงหาคม 2569';

export default function TermsPage() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
      <header className="space-y-1 pb-4 border-b border-neutral-100">
        <h1 className="text-2xl font-extrabold text-neutral-900">ข้อกำหนดการใช้งาน</h1>
        <p className="text-xs text-neutral-400">ปรับปรุงล่าสุด {UPDATED}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">1. การยอมรับข้อกำหนด</h2>
        <p>
          การสมัครสมาชิกหรือใช้งาน NEO APP ถือว่าคุณยอมรับข้อกำหนดฉบับนี้
          หากไม่ยอมรับกรุณาหยุดใช้งานเว็บไซต์
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">2. บัญชีผู้ใช้</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ต้องให้ข้อมูลที่เป็นความจริง และดูแลรหัสผ่านของตนเอง</li>
          <li>หนึ่งคนควรมีบัญชีเดียว การกระทำใด ๆ ผ่านบัญชีถือเป็นการกระทำของเจ้าของบัญชี</li>
          <li>เราสงวนสิทธิ์ระงับบัญชีที่ใช้ในทางทุจริต เช่น ใช้สลิปปลอมหรือสลิปของผู้อื่น</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">3. การเติมเงินเข้ากระเป๋า</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            เติมเงินโดยโอนเข้าบัญชีที่ร้านประกาศไว้ แล้วอัปโหลดสลิป
            ระบบจะตรวจสอบสลิปกับธนาคารผ่านผู้ให้บริการภายนอกก่อนเพิ่มยอดเงินให้
          </li>
          <li>สลิปหนึ่งใบใช้ได้ครั้งเดียว และต้องเป็นการโอนเข้าบัญชีของร้านเท่านั้น</li>
          <li>ยอดเงินในกระเป๋าใช้ชำระค่าสินค้าภายในเว็บไซต์นี้ ไม่สามารถถอนเป็นเงินสดได้</li>
          <li>
            หากเติมเงินแล้วยอดไม่เข้า หรือระบบตรวจสลิปผิดพลาด กรุณาติดต่อผู้ดูแลระบบพร้อมหลักฐานการโอน
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">4. การสั่งซื้อและราคา</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ราคาที่ใช้คิดเงินคือราคาที่บันทึกอยู่ในระบบ ณ เวลาที่กดสั่งซื้อ</li>
          <li>ระบบจะหักยอดจากกระเป๋าเงินทันทีเมื่อสั่งซื้อสำเร็จ หากยอดไม่พอจะสั่งซื้อไม่ได้</li>
          <li>เราอาจยกเลิกคำสั่งซื้อที่เกิดจากความผิดพลาดของราคาหรือสต็อก และคืนยอดเข้ากระเป๋าเงิน</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">5. สินค้าดิจิทัลและการคืนเงิน</h2>
        <p>
          สินค้าบนเว็บไซต์เป็นแอปพลิเคชันและบริการดิจิทัลที่ส่งมอบทันทีหลังชำระเงิน
          จึงขอสงวนสิทธิ์ไม่รับคืนเงินเมื่อส่งมอบแล้ว เว้นแต่กรณีที่สินค้าใช้งานไม่ได้จากความผิดพลาดของร้าน
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">6. ข้อห้าม</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ห้ามใช้สลิปปลอม แก้ไขสลิป หรือใช้สลิปของผู้อื่นเพื่อเติมเงิน</li>
          <li>ห้ามพยายามเข้าถึงบัญชีหรือข้อมูลของผู้อื่น และห้ามรบกวนการทำงานของระบบ</li>
          <li>ห้ามนำสินค้าที่ซื้อไปจำหน่ายต่อหรือเผยแพร่โดยไม่ได้รับอนุญาต</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">7. การจำกัดความรับผิด</h2>
        <p>
          เราให้บริการตามสภาพที่เป็นอยู่ และไม่รับผิดต่อความเสียหายทางอ้อมที่เกิดจากการใช้งานเว็บไซต์
          เว้นแต่ในกรณีที่กฎหมายกำหนดไว้เป็นอย่างอื่น
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-neutral-900">8. การแก้ไขข้อกำหนด</h2>
        <p>
          เราอาจแก้ไขข้อกำหนดนี้และจะประกาศฉบับล่าสุดไว้ที่หน้านี้พร้อมวันที่ปรับปรุง
          การใช้งานต่อหลังการแก้ไขถือว่ายอมรับฉบับใหม่
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-neutral-100">
        <h2 className="text-base font-bold text-neutral-900">9. ติดต่อ</h2>
        <p className="text-neutral-500">
          ผู้ให้บริการ: <span className="font-semibold text-neutral-700">[ระบุชื่อผู้ประกอบการ]</span>
          {' · '}อีเมล: <span className="font-semibold text-neutral-700">[ระบุอีเมลติดต่อ]</span>
        </p>
        <p className="text-xs text-neutral-600 border-l-2 border-neutral-900 pl-3 py-1">
          เอกสารนี้เป็นแบบร่างสำหรับใช้งานทั่วไป ก่อนเปิดให้บริการจริงควรกรอกข้อมูลผู้ประกอบการให้ครบ
          และให้ผู้เชี่ยวชาญด้านกฎหมายตรวจสอบให้สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล และกฎหมายที่เกี่ยวข้อง
        </p>
      </section>
    </div>
  );
}
