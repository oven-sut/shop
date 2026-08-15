# โครงสร้างเว็บ NEO APP

ร้านขายแอปพลิเคชัน + ระบบกระเป๋าเงิน สร้างด้วย Next.js 16 (App Router, Turbopack, React 19 + React Compiler),
Tailwind CSS 4, Base UI/shadcn, Supabase (Auth + Postgres + Storage) และ RDCW Slip Verify

---

## 1. ภาพรวม

```
เบราว์เซอร์
   │
   ├─ ทุก request ผ่าน  src/proxy.ts  (Next.js 16 เรียก "Proxy" แทนชื่อเดิม Middleware)
   │     • ต่ออายุ session cookie ของ Supabase
   │     • ยังไม่ล็อกอิน → page เด้งไป /login  |  /api/* ตอบ 401
   │     • /docs และ /openapi.json → 404 ถ้าไม่ใช่แอดมิน
   │     • /login /auth/* /terms /privacy /cookies /contact เปิดสาธารณะ
   │     • /api/topups/webhook/* เปิดสาธารณะ (เกตเวย์ไม่มีบัญชีในร้าน — body ไม่ถูกเชื่อถือ)
   │
   ├─ Pages (Server Components + Client Components)
   │     • src/app/layout.tsx อ่าน user จาก cookie แล้วส่งเข้า AuthProvider
   │     • src/app/admin/layout.tsx และ src/app/docs/layout.tsx ตรวจสิทธิ์ฝั่ง server อีกชั้น
   │
   └─ API Routes (/api/*)
         • requireApiUser() ตรวจ JWT ซ้ำในทุก handler (cookie หรือ Bearer)
         • อ่าน/เขียน Postgres ผ่าน supabase-js โดยมี RLS เป็นตัวคุมสิทธิ์
```

ข้อมูลทั้งหมดอยู่ใน Postgres ของ Supabase ไม่มี mock หรือ seed ในโค้ดแล้ว
สินค้า/คูปองต้องเพิ่มเองผ่านหน้าแอดมินหรือ SQL

สิ่งเดียวที่ยังเก็บในเบราว์เซอร์คือ **ตะกร้าสินค้า รายการโปรด และการเลือกยอมรับคุกกี้**
(`neo_cart`, `neo_wishlist`, `neo_cookie_consent`) เพราะเป็นของผู้เยี่ยมชมเอง

---

## 2. ติดตั้งครั้งแรก

1. **รัน `supabase/schema.sql` ทั้งไฟล์** ใน Supabase Dashboard → SQL Editor (รันซ้ำได้)
   จะสร้างตาราง ฟังก์ชัน RLS trigger และ bucket `product-images` ให้ทั้งหมด
2. เติมค่าใน `.env` — ดูหัวข้อ 6
3. ตั้งแอดมินคนแรก แล้วออกจากระบบและเข้าใหม่เพื่อรับ JWT ใบใหม่:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = 'you@example.com';
   ```
4. เข้า `/admin` → ตั้งค่าร้านค้า → กรอก **บัญชีรับเงินเติม** (ไม่กรอกจะเติมเงินไม่ได้)
5. เพิ่มสินค้าที่ `/admin` → จัดการสินค้า

---

## 3. โครงสร้างโฟลเดอร์

```
supabase/schema.sql            ← ตาราง + RLS + ฟังก์ชัน + storage bucket (รันเองใน SQL Editor)

src/
├─ proxy.ts                    ← ประตูหน้า: refresh session + กันคนยังไม่ล็อกอิน + ล็อก /docs
│
├─ app/
│  ├─ layout.tsx               ← Root layout (server) อ่าน session + แถบยินยอมคุกกี้
│  ├─ page.tsx                 ← หน้าร้าน
│  ├─ wallet/page.tsx          ← กระเป๋าเงิน: ยอดคงเหลือ ซองอังเปา QR พร้อมเพย์ สลิป ประวัติ
│  ├─ login/page.tsx           ← Google OAuth + email/password + สมัครสมาชิก
│  ├─ (legal)/                 ← contact, terms, privacy, cookies (เปิดสาธารณะ)
│  ├─ docs/                    ← Swagger UI (แอดมินเท่านั้น)
│  ├─ admin/
│  │  ├─ layout.tsx            ← ตรวจสิทธิ์ admin ฝั่ง server
│  │  └─ page.tsx              ← ภาพรวม/สินค้า/คำสั่งซื้อ/วิเคราะห์/ตั้งค่าร้าน
│  ├─ auth/callback/route.ts   ← Google ส่งกลับ → แลก code เป็น session cookie
│  └─ api/
│     ├─ health, products, products/[id], products/[id]/reviews
│     ├─ orders, orders/[id], coupons, stats
│     ├─ wallet                GET  ยอดเงิน + ความเคลื่อนไหว
│     ├─ topups                GET ประวัติ | POST เติมเงินด้วยสลิป
│     ├─ topups/qr             GET  QR พร้อมเพย์ของบัญชีร้าน (ใส่ยอดให้)
│     ├─ topups/truemoney      POST ไถ่ซองอังเปาทรูมันนี่ → เติมทันที
│     ├─ topups/charges        GET มีเกตเวย์ไหม | POST เปิดรายการ QR
│     │  └─ [id]               GET สถานะ + เติมถ้าจ่ายแล้ว | [id]/qr รูป QR
│     ├─ topups/webhook/[secret] POST เกตเวย์แจ้งว่าจ่ายแล้ว (เปิดสาธารณะ)
│     ├─ settings              GET อ่าน | PATCH แก้ (แอดมิน)
│     └─ uploads               POST อัปโหลดรูปสินค้า (แอดมิน)
│
├─ lib/
│  ├─ auth.ts                  ← แปลง JWT claims → User, ตัดสินสิทธิ์ (pure)
│  ├─ api-auth.ts              ← requireApiUser() รองรับ cookie และ Bearer
│  ├─ api-response.ts          ← unauthorized() / serverError()
│  ├─ mappers.ts               ← แปลงแถว Postgres (snake_case, numeric) ↔ ชนิดข้อมูลในแอป
│  ├─ settings.ts              ← StoreSettings + loadSettings()
│  ├─ promptpay-id.ts          ← กฎว่าเลขแบบไหนเป็นพร้อมเพย์ (ใช้ได้ทั้งสองฝั่ง)
│  ├─ promptpay.ts             ← สร้าง payload + รูป QR (เซิร์ฟเวอร์เท่านั้น)
│  ├─ truemoney.ts             ← ไถ่ซองอังเปา + แยก error ว่าซองถูกใช้ไปหรือยัง
│  ├─ topup-charge.ts          ← เติมเงินจาก charge ที่เกตเวย์ยืนยันแล้ว (ใช้ร่วม 2 ทาง)
│  ├─ topup-channels.ts        ← สวิตช์เปิด/ปิดช่องทางเติมเงิน (ใช้ร่วมทั้ง 3 ฝั่ง)
│  ├─ contact.ts               ← ช่องทางติดต่อ + กฎว่าค่าไหนทำเป็นลิงก์ได้
│  ├─ gateway/                 ← เกตเวย์รับชำระเงิน: types.ts, omise.ts, index.ts
│  ├─ rdcw.ts                  ← เรียก RDCW Slip Verify และ normalise ผลลัพธ์
│  └─ supabase/
│     ├─ env.ts, client.ts, server.ts, proxy.ts, session.ts
│     └─ admin.ts              ← service-role client (ใช้ตอนเติมเงินเท่านั้น)
│
├─ context/
│  ├─ AuthContext.tsx          ← ผู้ใช้ฝั่ง client (ซิงก์กับ cookie session)
│  └─ ShopContext.tsx          ← ดึงสินค้า/คำสั่งซื้อ/คูปอง/ตั้งค่า/กระเป๋าเงินจาก API
│
├─ components/
│  ├─ CookieConsent.tsx        ← แถบยินยอมคุกกี้
│  ├─ Navbar, HeroBanner, FeatureBar, ProductCard, CartDrawer, CheckoutModal, ...
│  ├─ Admin/                   ← Header, Overview, ProductList, ProductModal, OrderList, Analytics
│  └─ ui/                      ← shadcn/Base UI
│
└─ types/                      ← auth.ts, ecommerce.ts
```

---

## 4. เส้นทาง (Routes)

| Path | สิทธิ์ | คำอธิบาย |
| --- | --- | --- |
| `/` | ล็อกอิน | หน้าร้าน แคตตาล็อก ตะกร้า เช็คเอาต์ |
| `/wallet` | ล็อกอิน | ยอดเงิน เติมเงินด้วยสลิป ประวัติการเติม |
| `/login` | เปิด | Google / email + password / สมัครสมาชิก |
| `/contact` | เปิด | ช่องทางติดต่อร้าน (อ่านจาก store_settings เฉพาะคอลัมน์ contact_*) |
| `/terms` `/privacy` `/cookies` | เปิด | นโยบายและข้อกำหนด |
| `/auth/callback` | เปิด | ปลายทาง OAuth ของ Google |
| `/admin` | admin | แดชบอร์ดหลังบ้าน |
| `/docs` `/openapi.json` | admin | Swagger UI + spec (คนอื่นได้ 404) |

API ทุกเส้นต้องยืนยันตัวตน รายละเอียดดูที่ `/docs` หรือ `public/openapi.json`

---

## 5. ระบบเงินและการเติมเงิน

### ตารางหลัก

| ตาราง | เก็บอะไร | ใครเขียนได้ |
| --- | --- | --- |
| `wallets` | ยอดคงเหลือต่อผู้ใช้ | ฟังก์ชันในฐานข้อมูลเท่านั้น |
| `wallet_transactions` | บันทึกทุกการเคลื่อนไหว (+เข้า / −ออก) | ฟังก์ชันเท่านั้น |
| `topups` | สลิปที่ผ่านการตรวจแล้ว, `trans_ref` unique | ฟังก์ชันเท่านั้น |
| `orders` | คำสั่งซื้อ + snapshot ของรายการสินค้า | `place_order()` |
| `products` `coupons` `store_settings` | ข้อมูลร้าน | แอดมิน (ผ่าน RLS) |

ไม่มี RLS policy ไหนให้ client เขียน `wallets` / `topups` / `wallet_transactions` ได้เลย

### ขั้นตอนเติมเงิน (`POST /api/topups`)

```
กรอกยอด → (ถ้าตั้งพร้อมเพย์ไว้) GET /api/topups/qr?amount= → สแกนจ่าย
   ↓ QR แค่ขอเงิน ไม่เติมกระเป๋าเอง
ผู้ใช้โอนเงินเข้าช่องทางใดช่องทางหนึ่งของร้าน → อัปโหลดสลิป + กรอกยอดที่โอน
   ↓
ส่งสลิปไปตรวจกับ RDCW (https://suba.rdcw.co.th/v2/inquiry)
   ↓ ผ่านครบทุกข้อจึงเติมเงิน
   1. ยอดในสลิป = ยอดที่กรอก        (ต่างกัน 100 เท่า = RDCW_AMOUNT_UNIT ตั้งผิด บอกให้แก้)
   2. ผู้รับในสลิป = ช่องใดช่องหนึ่งใน store_settings
      (เลขบัญชี / พร้อมเพย์ / เบอร์ทรู — เทียบ 4 ตัวท้าย, ไม่มีเลขเลยจึงเทียบชื่อบัญชี)
   3. สลิปไม่เก่าเกิน topup_max_slip_age_days
   4. trans_ref ยังไม่เคยถูกใช้     (unique ทั้งตาราง)
   ↓
credit_topup() — service key เท่านั้น: ล็อกแถว wallet, insert topup, บวกยอด, บันทึก ledger
```

### ขั้นตอนเติมด้วย QR อัตโนมัติ (เกตเวย์ + webhook)

```
POST /api/topups/charges {amount}  → เช็ค min/max ก่อน แล้วเปิด charge ที่เกตเวย์
   ↓ metadata.userId = คนที่กด (webhook ไม่มี session จึงต้องฝากไว้ที่นี่)
แสดง QR ผ่าน /api/topups/charges/[id]/qr (ร้านดึงรูปมาส่งต่อ ไม่ให้เบราว์เซอร์ยิงตรง)
   ↓ ลูกค้าสแกนจ่าย
เกตเวย์ยิง POST /api/topups/webhook/<secret>     หน้าเว็บพอลลิง GET .../charges/[id]
   ↓ อ่านจาก body แค่ charge id                        ↓ ทุก 4 วินาที
   └──────────→ settleCharge(): ถาม API เกตเวย์ด้วยคีย์ร้าน ← ยอด/สถานะ/เจ้าของ
                     ↓ paid เท่านั้น
        credit_topup(trans_ref = '<gateway>:<charge_id>')
                     ↓ ใครถึงก่อนได้ไป อีกทางชน unique แล้วกลายเป็น no-op
```

สองทางนั้นทำงานเหมือนกันโดยตั้งใจ: webhook คือทางหลัก ส่วนพอลลิงคือกันเหนียวเวลา
webhook ตั้ง URL ผิดหรือส่งไม่ถึง ลูกค้าที่จ่ายแล้วจะไม่ต้องมาเปิดเรื่องกับแอดมิน

### ขั้นตอนเติมด้วยซองอังเปา (`POST /api/topups/truemoney`)

```
วางลิงก์ซอง → อ่าน hash (ไม่ผ่านรูปแบบ = ตีกลับ ไม่ยิงเน็ต)
   ↓
เช็คก่อนว่า trans_ref = truemoney:<hash> เคยถูกเติมแล้วหรือยัง (กันเผาสิทธิ์ไถ่ฟรี ๆ)
   ↓
ไถ่ซองกับทรู — หลังบรรทัดนี้เงินอยู่ในวอลเล็ตร้านแล้ว ยกเลิกไม่ได้
   ↓ จึงไม่มีการปฏิเสธยอดหลังไถ่: min/max ของร้านไม่ถูกใช้กับซอง
credit_topup(p_note = 'เติมเงินด้วยซองอังเปาทรูมันนี่') — unique(trans_ref) กันไถ่ซ้ำ
   ↓ ถ้า insert ล้มหลังไถ่สำเร็จ
log '[topup:truemoney] REDEEMED BUT NOT CREDITED' + user id/ยอด/ref ไว้ตามคืนมือ
```

### ขั้นตอนสั่งซื้อ (`POST /api/orders` → `place_order()`)

เบราว์เซอร์ส่งมาแค่ `productId` กับ `quantity` เท่านั้น ที่เหลือฐานข้อมูลคิดเองในทรานแซกชันเดียว:
ล็อกแถวสินค้า → ตรวจสต็อก → ตัดสต็อก → คิดราคาจากราคาใน DB → ใช้คูปอง → คิดค่าส่ง →
ตรวจยอดเงิน → หักกระเป๋า → สร้างคำสั่งซื้อ → บันทึก ledger

ราคาที่ส่งมาจาก client ไม่ถูกนำมาใช้เลย

---

## 6. ตัวแปรแวดล้อม (`.env`)

| ตัวแปร | ใช้ทำอะไร |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL โปรเจกต์ Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | คีย์ฝั่งเบราว์เซอร์ |
| `SUPABASE_SECRET_KEY` | service role — ใช้ตอนเติมเงินเท่านั้น ห้ามขึ้นต้น `NEXT_PUBLIC_` |
| `RDCW_CLIENT_ID` / `RDCW_CLIENT_SECRET` | บัญชี RDCW Slip Verify |
| `RDCW_AMOUNT_UNIT` | `baht` หรือ `satang` ตามที่ RDCW ส่งกลับ |
| `NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET` | ชื่อ bucket เก็บรูปสินค้า |
| `GOOGLE_CLIENT` / `GOOGLE_SECRET` | ไม่ได้ใช้ในโค้ด ต้องนำไปกรอกใน Supabase Dashboard |
| `SUPABASE_S3_*` | ไม่ได้ใช้ในโค้ด เก็บไว้เผื่อเครื่องมือภายนอก |

บัญชีรับเงินเติมและเงื่อนไขการเติม **ไม่ได้อยู่ใน .env** แต่อยู่ในตาราง `store_settings`
แก้ผ่านหน้าแอดมินได้

---

## 7. ความปลอดภัย

| ชั้น | ไฟล์ | หน้าที่ |
| --- | --- | --- |
| ประตูหน้า | `src/proxy.ts` | กันคนยังไม่ล็อกอิน, ล็อก `/docs` และ `/openapi.json` ไว้ให้แอดมิน |
| หน้าเว็บ | `admin/layout.tsx`, `docs/layout.tsx` | ตรวจ role จาก JWT ฝั่ง server ก่อน render |
| API | `lib/api-auth.ts` | `requireApiUser()` ตรวจ JWT ซ้ำในทุก handler |
| ฐานข้อมูล | `supabase/schema.sql` | RLS ทุกตาราง — ด่านสุดท้ายที่ข้ามไม่ได้ |

- สิทธิ์แอดมินอ่านจาก `app_metadata.role` ซึ่งผู้ใช้แก้เองไม่ได้ (ต่างจาก `user_metadata`)
- ทุกจุดฝั่ง server ยืนยันตัวตนด้วย `getClaims()` ซึ่งตรวจลายเซ็น JWT ไม่ใช่ `getSession()`
- `credit_topup()` ถูก `revoke execute` จาก `anon` และ `authenticated` เรียกได้เฉพาะ service key

---

## 8. คำสั่งที่ใช้บ่อย

```bash
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck
npm run lint     # ESLint
```

## 9. เอกสาร API

| อยากได้อะไร | ไปที่ |
| --- | --- |
| ทดลองยิง API ในเบราว์เซอร์ | `/docs` (แอดมินเท่านั้น) |
| ไฟล์ spec | `public/openapi.json` (OpenAPI 3.1) |
| Postman | `docs/neo-tech.postman_collection.json` → ยิง **Auth → Get access token** ก่อน |

---

## 10. สิ่งที่ยังค้างอยู่

- **API แยกสิทธิ์แค่ "ล็อกอินแล้ว/ยัง" ในบางเส้น** — การเขียนสินค้า/คูปอง/ตั้งค่า ถูกกันด้วย RLS
  และ `/api/settings` `/api/uploads` เช็ค role ใน handler แต่ `POST /api/products` อาศัย RLS อย่างเดียว
  (ลูกค้าที่ยิงเองจะได้ 403 จากฐานข้อมูล)
- **`/api/health` ถูกล็อกไว้ด้วย** ตามนโยบาย "ทุกเส้นต้อง auth" ถ้าจะต่อ uptime monitor ต้องเปิดเป็นสาธารณะ
- **`<img>` 6 จุด** ยังไม่เปลี่ยนเป็น `next/image` (ต้องตั้ง `images.remotePatterns` ให้โดเมนของ Supabase Storage ก่อน)
- **หน้านโยบายเป็นแบบร่าง** ยังมีช่อง `[ระบุชื่อผู้ประกอบการ]` / `[ระบุอีเมลติดต่อ]` ที่ต้องกรอก
  และควรให้ผู้เชี่ยวชาญกฎหมายตรวจก่อนเปิดใช้จริง
- **สินค้าเป็นแอป แต่ขั้นตอนสั่งซื้อยังเก็บที่อยู่จัดส่งและมีค่าส่ง** — ถ้าเป็นสินค้าดิจิทัลล้วน
  ควรตัดขั้นตอนที่อยู่ออกและตั้ง `shipping_fee = 0`

---

## 11. ตัวแทนขายจาก 499K Network

ร้านนี้ไม่ได้ถือสต็อกเอง แต่ซื้อต่อจากซัพพลายเออร์ ([เอกสาร](https://store.499k-network.com/docs/api))

```
แอดมิน: /admin → ซัพพลายเออร์ → เลือกสินค้า → นำเข้ามาขาย
        (products.supplier = '499k', เก็บ supplier_product_id และ supplier_cost ไว้ดูกำไร)

ลูกค้า: กดสั่งซื้อ
   1. place_order()          ตัดสต็อก + หักกระเป๋าเงิน  (ทรานแซกชันเดียวในฐานข้อมูล)
   2. POST /orders ที่ 499K  ได้ username/password ของบัญชีเกม
   3. เก็บลง order_fulfillments แล้วส่งให้ลูกค้าที่ /orders
   ถ้าขั้นที่ 2 ล้ม → refund_order() คืนเงิน คืนสต็อก และปิดคำสั่งซื้อทันที
```

ขั้นที่ 1 กับ 2 อยู่คนละระบบจึงรวมเป็นทรานแซกชันเดียวไม่ได้ ทางถอยคือคืนเงินอัตโนมัติ
และ `ref` ที่ส่งให้ซัพพลายเออร์คือ `<order_id>-<ลำดับ>` ซึ่งคงที่ ยิงซ้ำจึงไม่ถูกหักเงินซ้ำ

| ตาราง / ฟังก์ชัน | หน้าที่ |
| --- | --- |
| `products.supplier*` | ผูกสินค้าในร้านกับสินค้าฝั่งซัพพลายเออร์ |
| `order_fulfillments` | บัญชีเกมที่ส่งมอบแล้ว — อ่านได้เฉพาะเจ้าของกับแอดมิน ไม่มี policy ให้เขียน |
| `refund_order()` | คืนเงิน + คืนสต็อก เรียกได้เฉพาะ service key |

รหัส Steam Guard: `POST /api/orders/{id}/code` ขอได้ 3 รอบต่อคำสั่งซื้อ รอบละ 60 วินาที

**คีย์ปัจจุบันเป็น test key** (`499k_test_`) สั่งซื้อได้เฉพาะสินค้า sandbox/rental และไม่มีการตัดเงินจริง
เปลี่ยนเป็น `499k_live_` ใน `.env` เมื่อพร้อมขายจริง
