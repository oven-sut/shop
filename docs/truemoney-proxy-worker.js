/**
 * รีเลย์สำหรับไถ่ซองอังเปาทรูมันนี่ — Cloudflare Worker
 *
 * ทำไมต้องมี: gift.truemoney.com อยู่หลัง bot protection ของ Cloudflare ซึ่งให้คะแนน
 * "ผู้เรียก" ไม่ใช่ตัวคำขอ เซิร์ฟเวอร์ร้าน (โดยเฉพาะ IP ของ VPS/คลาวด์) จึงมักได้หน้า
 * HTML 403 กลับมาแทน JSON ไม่ว่าจะแต่ง header อย่างไร ยิงผ่าน Worker คือออกจาก
 * เครือข่ายของ Cloudflare เอง ปัญหานี้จึงหมดไป
 *
 * ── วิธี deploy ────────────────────────────────────────────────────────────
 *   1. https://dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. วางไฟล์นี้ทั้งไฟล์แทนโค้ดตัวอย่าง แล้ว Deploy
 *   3. Settings → Variables → เพิ่ม secret ชื่อ PROXY_SECRET (สุ่มยาว ๆ)
 *   4. ใส่ใน .env ของร้าน:
 *        TRUEMONEY_BASE_URL=https://<ชื่อ-worker>.<subdomain>.workers.dev
 *        TRUEMONEY_PROXY_SECRET=<ค่าเดียวกับ PROXY_SECRET>
 *
 * ── กันเปิดทิ้งไว้ ─────────────────────────────────────────────────────────
 * ถ้าไม่ตั้ง PROXY_SECRET ตัวนี้จะปฏิเสธทุกคำขอ ตั้งใจให้ fail closed เพราะรีเลย์ที่
 * เปิดโล่งคือเครื่องมือให้ใครก็ได้ไถ่ซองของคนอื่นเข้าเบอร์ตัวเอง — ตัว Worker ไม่รู้จัก
 * เบอร์ปลายทางของร้าน มันแค่ส่งต่อสิ่งที่ร้านส่งมา
 */
const UPSTREAM = 'https://gift.truemoney.com';

/** ส่งต่อเฉพาะเส้นเดียวที่ร้านใช้จริง ไม่ใช่ทั้งเว็บ */
const ALLOWED = /^\/campaign\/vouchers\/[A-Za-z0-9]{16,64}\/redeem$/;

/** ตอบเหมือนกันหมดทุกกรณีที่ไม่ผ่าน ไม่บอกว่าอะไรผิด */
const notFound = () => new Response('Not found', { status: 404 });

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'POST' || !ALLOWED.test(url.pathname)) return notFound();
    if (!env.PROXY_SECRET) return notFound();

    const given = request.headers.get('X-Proxy-Secret') ?? '';
    if (!timingSafeEqual(given, env.PROXY_SECRET)) return notFound();

    let upstream;
    try {
      upstream = await fetch(`${UPSTREAM}${url.pathname}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: await request.text(),
      });
    } catch (error) {
      return Response.json(
        { status: { code: 'PROXY_UNREACHABLE', message: String(error) } },
        { status: 502 }
      );
    }

    // ส่งคำตอบของทรูกลับไปตรง ๆ ทั้งสถานะและเนื้อหา ร้านจะได้ตัดสินใจจากของจริง
    // ไม่ใช่จากสิ่งที่รีเลย์ตีความเอง
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  },
};

export default worker;

/** เทียบโดยไม่ให้เวลาที่ใช้บอกใบ้ว่าตรงไปกี่ตัว */
function timingSafeEqual(given, expected) {
  if (given.length !== expected.length) return false;

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= given.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}
