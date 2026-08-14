/**
 * รีเลย์สำหรับไถ่ซองอังเปาทรูมันนี่ — รันเองบนเซิร์ฟเวอร์
 *
 * ทางเลือกแทน Cloudflare Worker (`truemoney-proxy-worker.js`) สำหรับคนที่มีเครื่อง
 * ของตัวเองอยู่แล้ว ใช้ Node เปล่า ๆ ไม่มี dependency
 *
 * ── ข้อแม้ที่สำคัญที่สุด ───────────────────────────────────────────────────
 * รีเลย์ช่วยได้ก็ต่อเมื่อ **IP ของเครื่องที่รันมันไม่โดน Cloudflare บล็อก**
 * รันไว้บนเครื่องเดียวกับร้าน = ออกเน็ตด้วย IP เดิม = โดนบล็อกเหมือนเดิม ไม่ได้อะไรเลย
 *
 * เช็คก่อนว่าเครื่องนั้นใช้ได้ไหม — รันบนเครื่องที่จะติดตั้ง:
 *
 *   curl -s -o /dev/null -w '%{http_code}\n' -X POST \
 *     -H 'Content-Type: application/json' \
 *     -d '{"mobile":"0812345678","voucher_hash":"0123456789abcdefgh"}' \
 *     https://gift.truemoney.com/campaign/vouchers/0123456789abcdefgh/redeem
 *
 *   400 หรือ 404  → ทรูตอบเอง = IP นี้ใช้ได้ ตั้งรีเลย์ตรงนี้ได้เลย
 *   403           → โดนบล็อก หาเครื่องอื่น หรือใช้ Cloudflare Worker แทน
 *
 * ── รัน ────────────────────────────────────────────────────────────────────
 *   PROXY_SECRET=<สุ่มยาว ๆ> node truemoney-proxy-server.mjs
 *
 * ค่าที่ปรับได้: PORT (ค่าเริ่มต้น 8787), HOST (127.0.0.1), TRUEMONEY_UPSTREAM
 *
 * ── ให้รันค้างไว้ ──────────────────────────────────────────────────────────
 *   pm2:     pm2 start truemoney-proxy-server.mjs --name tm-relay && pm2 save
 *   systemd: ดูตัวอย่าง unit ท้ายไฟล์
 *
 * ── ต่อเข้ากับร้าน ─────────────────────────────────────────────────────────
 *   TRUEMONEY_BASE_URL=https://relay.example.com     (หรือ http://<ip>:8787 ในวงเดียวกัน)
 *   TRUEMONEY_PROXY_SECRET=<ค่าเดียวกับ PROXY_SECRET>
 *
 * ถ้าเปิดออกอินเทอร์เน็ต ให้อยู่หลัง nginx/Caddy ที่ทำ HTTPS ให้ — secret วิ่งไปกับ
 * header ทุกครั้ง ส่งข้าม http เปล่า ๆ คือแจกให้คนกลางอ่าน
 */
import { createServer } from 'node:http';
import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const UPSTREAM = (process.env.TRUEMONEY_UPSTREAM ?? 'https://gift.truemoney.com').replace(/\/+$/, '');
const SECRET = process.env.PROXY_SECRET ?? '';

/** ส่งต่อเฉพาะเส้นเดียวที่ร้านใช้จริง ไม่ใช่ทั้งเว็บ */
const ALLOWED = /^\/campaign\/vouchers\/[A-Za-z0-9]{16,64}\/redeem$/;

/** หนึ่งคำขอค้าง = ลูกค้ารอหน้าจอค้าง จึงตัดทิ้งแทนที่จะปล่อยแขวน */
const TIMEOUT_MS = 15_000;

if (!SECRET) {
  // Fail closed: รีเลย์ที่เปิดโล่งคือเครื่องมือให้ใครก็ได้ไถ่ซองคนอื่นเข้าเบอร์ตัวเอง
  // เพราะเบอร์ปลายทางมากับตัวคำขอ ไม่ได้ฝังอยู่ในรีเลย์
  console.error('ต้องตั้ง PROXY_SECRET ก่อนถึงจะรันได้');
  process.exit(1);
}

function secretMatches(given) {
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(SECRET);
  return a.length === b.length && nodeTimingSafeEqual(a, b);
}

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      // สิ่งที่ส่งจริงคือ JSON สั้น ๆ อะไรที่ยาวกว่านี้ไม่ใช่ของเรา
      if (body.length > 4096) reject(new Error('body too large'));
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });

const server = createServer(async (request, response) => {
  /** ตอบเหมือนกันหมดทุกกรณีที่ไม่ผ่าน ไม่บอกว่าอะไรผิด */
  const notFound = () => {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  };

  const path = new URL(request.url, 'http://relay').pathname;

  if (request.method !== 'POST' || !ALLOWED.test(path)) return notFound();
  if (!secretMatches(request.headers['x-proxy-secret'])) return notFound();

  let body;
  try {
    body = await readBody(request);
  } catch {
    return notFound();
  }

  let upstream;
  try {
    upstream = await fetch(`${UPSTREAM}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    return response.end(
      JSON.stringify({ status: { code: 'PROXY_UNREACHABLE', message: String(error) } })
    );
  }

  // ส่งคำตอบของทรูกลับไปตรง ๆ ทั้งสถานะและเนื้อหา ร้านจะได้ตัดสินใจจากของจริง
  // ไม่ใช่จากสิ่งที่รีเลย์ตีความเอง
  const text = await upstream.text();
  response.writeHead(upstream.status, {
    'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
  });
  response.end(text);
});

server.listen(PORT, HOST, () => {
  console.log(`tm-relay listening on http://${HOST}:${PORT} → ${UPSTREAM}`);
});

/*
── ตัวอย่าง systemd unit ─────────────────────────────────────────────────────
/etc/systemd/system/tm-relay.service

[Unit]
Description=TrueMoney voucher relay
After=network-online.target

[Service]
ExecStart=/usr/bin/node /opt/tm-relay/truemoney-proxy-server.mjs
Environment=PROXY_SECRET=เปลี่ยนเป็นค่าจริง
Environment=HOST=127.0.0.1
Environment=PORT=8787
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target

  sudo systemctl daemon-reload && sudo systemctl enable --now tm-relay
*/
