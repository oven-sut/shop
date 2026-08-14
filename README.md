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

ตรวจว่าทั้งหมดยังทำงานถูกได้ด้วย `node --env-file=.env scripts/verify-codes.mjs` — มันสร้าง
สินค้ากับรหัสจริงในฐานข้อมูล ไล่ทดสอบทริกเกอร์ การจอง และการคืนเงิน แล้ว rollback ทิ้งทั้งหมด

## รันสคีมาเข้า Supabase

```bash
# ใส่ DATABASE_URL ใน .env แล้วเรียก (รหัสผ่านจะได้ไม่ค้างใน shell history)
node --env-file=.env scripts/apply-schema.mjs
```

ทั้งไฟล์ถูกครอบด้วยทรานแซกชันเดียว ล้มตรงไหนคือฐานข้อมูลไม่ถูกแก้เลย และไฟล์เขียนแบบ
รันซ้ำได้ จึงรันกี่ครั้งก็ปลอดภัย

**host ต้องเป็น pooler ไม่ใช่ `db.<ref>.supabase.co`** — โฮสต์ตรงมีแต่ระเบียน AAAA (IPv6
ล้วน) เครื่องที่ไม่มีเน็ต IPv6 จะขึ้น `ENOTFOUND` ทั้งที่ชื่อโฮสต์ถูกแล้ว ให้ใช้ session pooler
ซึ่งมี IPv4 แทน สังเกตว่า username เปลี่ยนเป็น `postgres.<ref>` ด้วย:

```
postgresql://postgres.<ref>:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

ต้องเป็นพอร์ต **5432** (session) ไม่ใช่ 6543 (transaction) เพราะ transaction mode รัน DDL
ยาว ๆ ในทรานแซกชันเดียวไม่ได้ ส่วน `<region>` ดูได้จาก `SUPABASE_S3_REGION` ใน `.env`

## ช่องทางรับเงินเติม

ตั้งได้พร้อมกันทุกช่องที่หน้าแอดมิน → ตั้งค่าร้านค้า กรอกช่องไหนก็เปิดช่องนั้น
ไม่กรอกเลยแม้แต่ช่องเดียว = เติมเงินไม่ได้ทั้งระบบ (กันคนเอาสลิปที่โอนให้คนอื่นมาเติม)

| ช่อง | คอลัมน์ใน `store_settings` | ทำอะไรได้ |
| --- | --- | --- |
| เลขบัญชีธนาคาร | `topup_receiver_account` | รับโอน + เทียบผู้รับในสลิป — สร้าง QR ไม่ได้ |
| พร้อมเพย์ | `topup_promptpay_id` | ทั้งเทียบสลิปและสร้าง QR ให้สแกน |
| ทรูวอลเล็ต | `topup_truemoney_phone` | รับซองอังเปา (เติมทันที) + เทียบสลิป |

ตอนตรวจสลิป ผู้รับในสลิปตรงกับ**ช่องใดช่องหนึ่ง**ก็ผ่าน — ลูกค้าที่สแกน QR กับลูกค้าที่โอน
เข้าเลขบัญชีถือสลิปของร้านเดียวกัน และตัวสลิปไม่ได้บอกว่าแอดมินกรอกเลขนั้นไว้ช่องไหน
(เทียบด้วยเลข 4 ตัวท้าย เพราะธนาคารปิดเลขบัญชีปลายทางเป็น `xxx-x-x1234-x`)

เดิมมีช่องเดียว (`topup_receiver_account`) ที่ปนทั้งเลขบัญชีและพร้อมเพย์ — ตอน apply สคีมา
รอบแรกหลังอัปเดต ค่าเดิมที่เป็นพร้อมเพย์อยู่แล้วจะถูกย้ายเข้า `topup_promptpay_id` ให้เอง
ครั้งเดียว ไม่ใช่ทุกครั้งที่รัน ไม่งั้นพร้อมเพย์ที่แอดมินลบออกเองจะกลับมาทุกรอบ

## ซองอังเปาทรูมันนี่ (เติมทันที)

`POST /api/topups/truemoney` รับลิงก์ซอง (`gift.truemoney.com/campaign/?v=...`) ไปไถ่เข้า
เบอร์ทรูวอลเล็ตของร้าน แล้วเติมยอดที่ได้เข้ากระเป๋าลูกค้าทันที ไม่ต้องแนบสลิป
ซองใบเดิมใช้ซ้ำไม่ได้เพราะเก็บเป็น `trans_ref = truemoney:<hash>` ในตาราง `topups` เดียวกับสลิป
ซึ่ง unique อยู่แล้ว

**จุดที่ต่างจากสลิปโดยสิ้นเชิง: เงินย้ายก่อนแล้วค่อยตอบ** ไถ่แล้วคืนไม่ได้ ดังนั้น

- ยอดจากซอง**ไม่ถูกบังคับด้วย min/max** ของร้าน — ปฏิเสธหลังไถ่ = ยึดเงินลูกค้า
- อ่านยอดจาก `my_ticket.amount_baht` (ส่วนที่การไถ่ครั้งนี้ได้จริง) ไม่ใช่ยอดรวมของซอง
  ที่อาจถูกหลายคนแบ่งกัน
- error ทุกตัวถูกแยกว่า "ซองยังอยู่" หรือ "ซองถูกใช้แล้ว" — ถ้าไถ่สำเร็จแต่เขียน DB ไม่ผ่าน
  จะ log `[topup:truemoney] REDEEMED BUT NOT CREDITED` พร้อม user id/ยอด/ref ไว้ตามคืนมือ

```env
# ปกติไม่ต้องตั้ง — ใส่เมื่อ endpoint ย้าย หรือต้องยิงผ่านพร็อกซี
TRUEMONEY_BASE_URL=https://gift.truemoney.com
```

endpoint นี้เป็นตัวที่แอปทรูใช้เอง ไม่ใช่ API สาธารณะ และ `gift.truemoney.com` อยู่หลัง
Cloudflare ซึ่ง**บล็อกบางเครือข่ายทิ้งเป็นหน้า HTML 403** (เปลี่ยน User-Agent ก็ไม่ช่วย)
กรณีนั้นถูกแยกออกมาเป็น `truemoney_blocked` และบอกลูกค้าว่าซองยังไม่ถูกใช้ เพราะคำขอ
ไม่ได้ไปถึงระบบทรูเลย ถ้าเซิร์ฟเวอร์ที่ deploy โดนบล็อก ให้ตั้ง `TRUEMONEY_BASE_URL`
ชี้ไปพร็อกซีที่ทรูยอมรับ

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

## 3 วิธีเติมเงินที่หน้ากระเป๋าเงิน

หน้ากระเป๋าเงินแยกเป็น 3 แท็บ ต่างกันที่ว่า **อะไรเป็นหลักฐานว่าเงินเข้าแล้ว**

| แท็บ | หลักฐาน | เข้าเมื่อไหร่ |
| --- | --- | --- |
| สลิปโอนเงิน | สลิปที่ตรวจกับธนาคารผ่าน `src/lib/slip` | หลังผู้ให้บริการยืนยันสลิป |
| QR | เกตเวย์รับชำระเงินแจ้งกลับมา (webhook) | อัตโนมัติ ไม่ต้องมีสลิป |
| ทรูวอลเล็ต | คำตอบของทรูตอนไถ่ซองอังเปา | ทันทีที่ลิงก์ถูกและไถ่ผ่าน |

แท็บ QR มีสองโหมด ขึ้นกับว่าตั้งคีย์เกตเวย์ไว้หรือยัง: **ตั้งไว้** = QR ที่จ่ายแล้วเงินเข้าเอง
(หัวข้อถัดไป) **ยังไม่ตั้ง** = QR พร้อมเพย์ที่ร้านวาดเอง ซึ่งยังต้องอัปสลิปที่แท็บแรก
เพราะไม่มีใครแจ้งกลับมาว่าเงินเข้า หน้าเว็บถามที่ `GET /api/topups/charges` ก่อนวาดแท็บ
เพื่อไม่สัญญาสิ่งที่ทำไม่ได้

## QR ที่เติมเงินให้เอง (เกตเวย์ + webhook)

ตั้งคีย์เกตเวย์แล้ว แท็บ QR จะเปลี่ยนเป็น: `POST /api/topups/charges` เปิดรายการชำระเงิน
→ ลูกค้าสแกนจ่าย → เกตเวย์ยิง webhook กลับมา → เติมเข้ากระเป๋าอัตโนมัติ ไม่ต้องมีสลิปเลย

```env
OMISE_SECRET_KEY=skey_...          # ตั้งอันนี้ = เปิดโหมดอัตโนมัติ
PAYMENT_GATEWAY=omise              # ไม่ใส่ = ใช้เจ้าแรกที่ตั้งคีย์ครบ
OMISE_BASE_URL=https://api.omise.co  # ไม่ต้องใส่ ยกเว้นจะยิงผ่านพร็อกซี/ตัวจำลอง
TOPUP_WEBHOOK_SECRET=<สุ่มยาว ๆ>    # ต่อท้าย URL ของ webhook
```

ตั้ง webhook ที่แดชบอร์ดของเกตเวย์เป็น
`https://<โดเมนร้าน>/api/topups/webhook/<TOPUP_WEBHOOK_SECRET>`

**กฎข้อเดียวที่ทั้งระบบยืนอยู่บนมัน: webhook เป็นแค่ "สัญญาณเตือน" ไม่ใช่หลักฐาน**
ใครก็ยิง JSON มาบอกว่าจ่ายแล้วได้ ตัว handler จึงอ่านจาก body แค่ *charge id* ตัวเดียว
แล้วไปถามยอด/สถานะ/เจ้าของกับ API ของเกตเวย์เองด้วย secret key ของร้าน — body ปลอม
จึงทำได้อย่างมากคือสั่งให้ร้านไปเช็ค charge จริงซ้ำ ส่วน secret ใน URL มีไว้กันคนแปลกหน้า
ยิงถี่ ๆ ให้ร้านเปลืองการเรียกเกตเวย์ ไม่ใช่ตัวที่ทำให้ปลอดภัย

`/api/topups/webhook` เป็น path เดียวใน `/api/*` ที่เปิดให้ไม่ต้องล็อกอิน (ดู `PUBLIC_PATHS`
ใน `src/proxy.ts`) เพราะเกตเวย์ไม่มีบัญชีในร้าน

รายละเอียดที่เหลือ:

- **เจ้าของรายการอยู่ใน `metadata.userId`** ของ charge ไม่ใช่ session — webhook ที่ไม่มี
  session จึงยังรู้ว่าจะเติมเข้าใคร และคนอื่นเปิดดู charge ของเราไม่ได้ (404)
- **หน้าเว็บพอลลิง `GET /api/topups/charges/[id]` ทุก 4 วิ แล้วเติมเงินได้เหมือนกัน**
  ตั้งใจให้ซ้ำกับ webhook: ถ้า webhook ตั้ง URL ผิดหรือเกตเวย์ล่ม ลูกค้าที่จ่ายแล้วต้องไม่
  ต้องมาเปิดเรื่องกับแอดมิน — ใครถึงก่อนได้ไป อีกทางกลายเป็น no-op เพราะ
  `unique(trans_ref)` ที่ `<gateway>:<charge_id>`
- **รูป QR ส่งผ่านร้าน** (`/api/topups/charges/[id]/qr`) ไม่ให้เบราว์เซอร์ยิงตรงไปโฮสต์
  ของเกตเวย์ และ URL ที่เกตเวย์ส่งมาถูกเช็คก่อนใช้ว่าเป็น https หรือโฮสต์เดียวกับ
  `OMISE_BASE_URL` เท่านั้น เพราะเราแนบคีย์ร้านไปกับการดึงรูปนั้น
- **min/max ถูกบังคับตอนเปิดรายการ** ต่างจากซองอังเปา เพราะยอดถูกล็อกก่อนลูกค้าจ่าย
- เติมเจ้าใหม่ได้โดยเขียนไฟล์ที่ทำตาม interface `PaymentGateway` แล้วใส่ใน `ALL`
  ที่ `src/lib/gateway/index.ts` — ต่างจากตัวตรวจสลิป ตรงนี้ไม่มีการไล่เจ้าถัดไป
  เพราะ charge อยู่ที่เกตเวย์เดียวและมีแค่เจ้านั้นที่ตอบได้ว่าจ่ายแล้วหรือยัง

## QR พร้อมเพย์ที่ร้านวาดเอง (ต้องมีสลิป)

`GET /api/topups/qr?amount=500` คืน payload มาตรฐาน EMV QRCPS กับรูป PNG (data URL)
ให้หน้า **กระเป๋าเงิน** เอาไปแสดง ลูกค้าสแกนจ่าย แล้วอัปโหลดสลิปต่อที่แท็บสลิป
— QR แบบนี้แค่ *ขอ* เงิน ไม่มีใครแจ้งกลับมาว่าเข้าแล้ว ตัวที่เติมเข้ากระเป๋าจริงจึงยังเป็น
การตรวจสลิปกับธนาคาร ไม่ต้องตั้งค่า env เพิ่ม ไม่ต้องต่อผู้ให้บริการเจ้าไหน

เลขที่เอาไปทำ QR มาจาก `store_settings.topup_promptpay_id` เท่านั้น (ถ้าว่างจะลองอ่าน
`topup_receiver_account` เผื่อแอดมินยังกรอกพร้อมเพย์ไว้ช่องเก่า) ไม่รับจาก query
เพราะไม่งั้นใครก็แจก QR ที่เงินเข้าบัญชีตัวเองในนามร้านได้ และยอดต้องอยู่ในช่วง
min/max เดียวกับที่ตอนตรวจสลิปใช้ — ออก QR ยอดที่เดี๋ยวจะถูกปฏิเสธ คือเก็บเงินลูกค้าก่อน
แล้วค่อยบอกว่าใช้ไม่ได้

**พร้อมเพย์รับได้ 3 แบบเท่านั้น** — เบอร์มือถือ 10 หลัก, เลขบัตรประชาชน/ผู้เสียภาษี 13 หลัก,
e-Wallet 15 หลัก (`readPromptPayTarget()` ที่ `src/lib/promptpay-id.ts`) เลขบัญชีธนาคารเฉย ๆ
ทำ QR ไม่ได้ ต้องเช็คเองเพราะ `promptpay-qr` ไม่เคยปฏิเสธ: มันเติม 0 ข้างหน้าให้ครบ 13 หลัก
แล้วคืน QR ที่สแกนได้แต่ไม่มีปลายทาง หน้าแอดมินจึงบอกใต้ช่องกรอกเลยว่าเลขที่ใส่อยู่
ทำ QR ได้หรือไม่ และหน้ากระเป๋าเงินจะซ่อนปุ่มสร้าง QR ไปเลยถ้าทำไม่ได้

ตัวเข้ารหัส (`promptpay-qr` + `qrcode`) อยู่ใน `src/lib/promptpay.ts` ซึ่งเรียกจากฝั่ง
เซิร์ฟเวอร์เท่านั้น ส่วนกฎว่าเลขแบบไหนใช้ได้แยกไว้ที่ `promptpay-id.ts` ให้ฝั่งเบราว์เซอร์
import ได้โดยไม่ลากสองไลบรารีนั้นไปด้วย

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
