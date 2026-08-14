This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## เอกสารโปรเจกต์

| เรื่อง | ไฟล์ / URL |
| --- | --- |
| โครงสร้างเว็บ ระบบล็อกอิน และการป้องกัน | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Swagger UI (ต้องล็อกอินก่อน) | http://localhost:3000/docs |
| OpenAPI 3.1 spec | [`public/openapi.json`](public/openapi.json) |
| Postman collection | [`docs/neo-tech.postman_collection.json`](docs/neo-tech.postman_collection.json) |

ทุกหน้าและทุก API ต้องเข้าสู่ระบบก่อน ยกเว้น `/login` และ `/auth/*`

## โดเมนที่ใช้ตอน login กลับ

```env
NEXT_PUBLIC_SITE_URL=https://www.neo.owenx.shop   # โปรดักชันเท่านั้น — ตอน dev ไม่ต้องตั้ง
```

ถ้าไม่ตั้ง ระบบจะใช้โดเมนของคำขอที่วิ่งเข้ามา ซึ่งถูกสำหรับ `next dev` และ preview
แต่พออยู่หลัง proxy เบราว์เซอร์อยู่โดเมนจริงส่วนแอปตอบอยู่โฮสต์ภายใน สองฝั่งจะไม่ตรงกัน

**ต้องตั้งใน Supabase ด้วย** ไม่งั้นแก้ที่โค้ดอย่างเดียวไม่พอ — Supabase จะปฏิเสธ
`redirectTo` ที่ไม่อยู่ในลิสต์แล้วเด้งไป Site URL แทนแบบเงียบ ๆ ซึ่งเป็นสาเหตุที่
login เสร็จแล้วไปโผล่ที่ `localhost:3000` ที่ Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://www.neo.owenx.shop`
- **Redirect URLs**: `https://www.neo.owenx.shop/auth/callback` และ
  `http://localhost:3000/auth/callback` (เผื่อ dev)

ฝั่ง Google Cloud Console ไม่ต้องแก้ เพราะ redirect URI ของ OAuth ชี้ไปที่
`https://<project>.supabase.co/auth/v1/callback` ไม่ได้ชี้มาที่โดเมนร้าน

## ชั้นความปลอดภัย

ตัวคุมสิทธิ์จริงคือ RLS ในฐานข้อมูล ส่วนโค้ดฝั่ง route เป็นด่านที่สอง ตั้งใจให้ซ้ำกัน
เพราะสองด่านพังคนละแบบ — RLS ปฏิเสธ update จะหน้าตาเหมือน "ไม่มีแถวนี้" และ route
ที่ถูกเปลี่ยนไปใช้ service key เมื่อไหร่จะเหลือด่านเดียวโดยไม่มีใครรู้

| เรื่อง | อยู่ที่ |
| --- | --- |
| ตรวจ JWT ทุก request (cookie หรือ `Authorization: Bearer`) | `src/lib/api-auth.ts` |
| `requireAdmin()` สำหรับ route ที่แอดมินเท่านั้น | `src/lib/api-auth.ts` |
| ไม่คืนข้อความ error ดิบให้ client — log ไว้ฝั่งเซิร์ฟเวอร์แล้วคืนรหัสอ้างอิงแทน | `src/lib/api-response.ts` |
| จำกัดอัตราเรียกของ endpoint ที่เสียเงิน/โควตาจริง | `src/lib/rate-limit.ts` |
| Security headers (CSP, HSTS, X-Frame-Options, ฯลฯ) | `next.config.ts` |
| RLS policy + `revoke execute` ของฟังก์ชัน security definer | `supabase/schema.sql` |

**ข้อจำกัดที่ต้องรู้** — ตัวนับ rate limit เก็บในหน่วยความจำของโปรเซส รีเซ็ตทุกครั้งที่
deploy และถ้ารันหลาย instance แต่ละตัวจะนับแยกกัน มันมีไว้กันบัญชีเดียวยิงรัวจนโควตา
ผู้ให้บริการหมด ไม่ใช่เกราะกัน DDoS ถ้าย้ายไปรันหลาย instance ให้ย้ายตัวนับไปไว้ที่
Postgres หรือ Redis โดยแก้แค่ `hit()` ที่เดียว จุดเรียกใช้ไม่ต้องแก้

## SEO และรูปตอนแชร์ลิงก์

ทั้งร้านอยู่หลัง login ยกเว้น `/login` กับหน้านโยบาย — sitemap จึงมีแค่ 4 URL นั้น
ใส่หน้าอื่นไปก็ได้แค่ redirect ไป `/login` แล้วขึ้นเป็น error ใน Search Console

| ไฟล์ | ได้อะไร |
| --- | --- |
| `src/app/sitemap.ts` | `/sitemap.xml` |
| `src/app/robots.ts` | `/robots.txt` — กัน crawler ออกจาก `/api`, `/admin`, `/docs` |
| `src/app/opengraph-image.tsx` | รูปการ์ด 1200×630 ตอนแปะลิงก์ใน LINE/Facebook/X/Discord |
| `src/app/icon.png`, `src/app/apple-icon.png` | favicon และไอคอนบน iOS |

สี่เส้นทางแรกต้องอยู่ใน `PUBLIC_PATHS` ของ `src/proxy.ts` ด้วย ไม่งั้น crawler กับ
ตัวสร้าง preview ที่ยังไม่มี session จะโดนเด้งไปหน้า login แล้วการ์ดขึ้นเป็นหน้าว่าง

## คลังรหัส — ขายไอดี/คีย์ที่ร้านลงเอง

สินค้าที่ไม่ได้สั่งต่อจากซัพพลายเออร์ ขายจาก `public.product_codes` ได้ หนึ่งแถวคือของ
หนึ่งชิ้นที่ขายได้หนึ่งครั้ง เติมรหัสที่หน้าแอดมิน → แก้ไขสินค้า → คลังรหัสสำหรับขาย
วางได้ทีละหลายบรรทัด บรรทัดละหนึ่งชิ้น รูปแบบ `ชื่อผู้ใช้|รหัสผ่าน` หรือใส่รหัสอย่างเดียว

**สต็อกไม่ต้องกรอกเอง** — ทริกเกอร์ `product_codes_sync_stock` ตั้ง `products.stock`
ให้เท่ากับจำนวนรหัสที่ยังไม่ถูกขายทุกครั้งที่คลังเปลี่ยน ช่องสต็อกในหน้าแอดมินจึงถูกล็อก
เมื่อสินค้าชิ้นนั้นมีรหัสอยู่ ปล่อยให้กรอกทับได้เมื่อไหร่ สองตัวเลขนี้ก็ขัดกันเมื่อนั้น

**การจองรหัสอยู่ใน `place_order`** ทรานแซกชันเดียวกับที่ตัดเงินและตัดสต็อก ลูกค้าจึงไม่มี
ทางจ่ายแล้วไม่ได้รหัส และรหัสใบเดียวขายซ้ำไม่ได้ (`for update skip locked` + unique index)
ถ้าจองได้ไม่ครบจำนวนที่สั่ง จะยกเลิกทั้งคำสั่งซื้อแทนที่จะส่งของขาด

รหัสที่ขายแล้วเข้า `order_fulfillments` ด้วย `supplier = 'manual'` ลูกค้าจึงเห็นที่หน้า
**ประวัติการซื้อ** ที่เดียวกับไอดีจากซัพพลายเออร์ ต่างกันที่การ์ดแบบ manual ไม่มีปุ่มขอรหัส
Steam Guard เพราะไม่มีซัพพลายเออร์ให้ขอ ส่วน `refund_order` จะคืนรหัสเข้าคลังและลบแถว
ที่ส่งมอบทิ้ง ไม่งั้นลูกค้าจะยังเห็นรหัสที่ถูกเอาไปขายต่อให้คนอื่นแล้ว

> รันสคีมาใหม่หลังดึงโค้ดนี้: `node scripts/apply-schema.mjs "<connection string>"`
> ไฟล์รันซ้ำได้ แต่รอบนี้แก้ `place_order` ด้วย ถ้าไม่รัน การซื้อสินค้าที่ใส่รหัสไว้จะไม่ส่งมอบ

## ระบบตรวจสลิป (สำรองหลายเจ้า)

`/api/topups` ตรวจสลิปผ่าน `src/lib/slip` ซึ่งไล่ผู้ให้บริการทีละเจ้าจนกว่าจะมีเจ้าไหนตอบได้
ตั้งคีย์ของเจ้าไหนไว้ เจ้านั้นก็เข้าคิวเอง เจ้าที่ไม่ได้ตั้งคีย์จะถูกข้ามโดยไม่ยิงเน็ต

```env
# ลำดับที่จะลอง (ไม่ใส่ = ใช้ทุกเจ้าที่ตั้งคีย์ไว้)
SLIP_PROVIDERS=rdcw,slipok,thunder,easyslip

RDCW_CLIENT_ID=        # https://slip.rdcw.co.th
RDCW_CLIENT_SECRET=
RDCW_AMOUNT_UNIT=baht  # baht | satang

SLIPOK_BRANCH_ID=      # https://slipok.com
SLIPOK_API_KEY=

THUNDER_API_KEY=       # https://document.thunder.in.th/th/v2/

EASYSLIP_TOKEN=        # https://document.easyslip.com
```

ทุกเจ้ามี `*_BASE_URL` และ `*_AMOUNT_UNIT` ให้ override ได้ เผื่อผู้ให้บริการย้าย endpoint
หรือคืนยอดเป็นสตางค์

**กติกาการสลับเจ้า** — อยู่ที่ `SlipVerifyError.retryable`:

| สถานการณ์ | ทำอะไรต่อ |
| --- | --- |
| โควตาหมด / คีย์ผิด / โดน rate limit / เจ้านั้นล่ม (5xx) | ลองเจ้าถัดไป |
| อ่าน QR หรือยอดจากรูปไม่ออก | ลองเจ้าถัดไป (ตัวอ่านแต่ละเจ้าไม่เท่ากัน) |
| ธนาคารตอบว่าสลิปใบนี้ไม่ถูกต้อง | **หยุดทันที** |

ข้อสุดท้ายตั้งใจให้หยุด เพราะทุกเจ้าถามธนาคารกลางเดียวกัน ไล่ต่อไปก็ได้คำตอบเดิม
แต่เสียโควตาเจ้าอื่นฟรี ๆ ถ้าล้มครบทุกเจ้า ข้อความ error จะบอกว่าลองเจ้าไหนไปบ้าง
และติดรหัสอะไร เพื่อให้รู้ทันทีว่าต้องไปเติมโควตาเจ้าไหน

จะเพิ่มเจ้าใหม่ก็เขียนไฟล์ที่ทำตาม interface `SlipProvider` แล้วใส่ใน `ALL`
ที่ `src/lib/slip/index.ts` — ถ้าเจ้านั้นใช้ `Bearer` + `/verify/bank` แบบเดียวกับ
Thunder/EasySlip ใช้ `createBearerProvider()` ได้เลย ไม่ต้องเขียนใหม่

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
