-- ============================================================================
-- NEO APP — schema เต็มของระบบ
-- รันทั้งไฟล์นี้ครั้งเดียวใน Supabase Dashboard → SQL Editor
-- รันซ้ำได้ (idempotent)
-- ============================================================================

create extension if not exists pgcrypto;

-- ─── helper: ตรวจสิทธิ์แอดมินจาก JWT ────────────────────────────────────────
-- role อยู่ใน app_metadata ซึ่งผู้ใช้แก้เองไม่ได้ (ต่างจาก user_metadata)
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- ตั้งค่าร้าน (แถวเดียว) — แก้ได้จากหน้าแอดมิน → ตั้งค่าร้านค้า
-- บัญชีปลายทางที่รับเงินเติมอยู่ตรงนี้ ไม่ได้อยู่ใน .env
-- ============================================================================
create table if not exists public.store_settings (
  -- id เป็น boolean ที่บังคับให้เป็น true จึงมีได้แถวเดียวตลอด
  id boolean primary key default true check (id),
  store_name text not null default 'NEO APP',
  is_open boolean not null default true,

  -- บัญชีที่ลูกค้าโอนเข้ามาเติมเงิน ต้องกรอกอย่างน้อยหนึ่งช่อง
  -- ไม่งั้นระบบเติมเงินจะปฏิเสธทุกสลิป (กันคนเอาสลิปที่โอนให้คนอื่นมาเติม)
  --
  -- แยกเป็นช่อง ๆ เพราะทำหน้าที่ไม่เหมือนกัน: เลขบัญชีธนาคารใช้เทียบผู้รับในสลิปได้
  -- แต่ทำ QR ไม่ได้, พร้อมเพย์ทำได้ทั้งสองอย่าง, เบอร์ทรูวอลเล็ตใช้ไถ่ซองอังเปา
  topup_receiver_name text not null default '',
  topup_receiver_account text not null default '',
  topup_bank_name text not null default '',
  topup_min_amount numeric(12, 2) not null default 1 check (topup_min_amount > 0),
  topup_max_amount numeric(12, 2) not null default 50000 check (topup_max_amount > 0),
  topup_max_slip_age_days integer not null default 7 check (topup_max_slip_age_days > 0),

  tax_rate numeric(5, 2) not null default 7 check (tax_rate >= 0 and tax_rate <= 100),

  updated_at timestamptz not null default now()
);

-- เคยมีค่าจัดส่งตอนที่ยังคิดว่าขายสินค้าจริง ตอนนี้ขายของดิจิทัลล้วนจึงไม่ใช้แล้ว
alter table public.store_settings drop column if exists free_shipping_min;
alter table public.store_settings drop column if exists shipping_fee;

-- พร้อมเพย์กับทรูวอลเล็ตเพิ่มมาทีหลัง ตอนแรกมีแค่ topup_receiver_account ช่องเดียว
-- ที่ปนกันทั้งเลขบัญชีและพร้อมเพย์
--
-- ย้ายค่าเดิมให้เฉพาะจังหวะที่เพิ่งเพิ่มคอลัมน์ ไม่ใช่ทุกครั้งที่รันไฟล์นี้ — ไม่งั้น
-- แอดมินที่ลบพร้อมเพย์ออกเองจะเห็นมันกลับมาทุกรอบที่ apply สคีมา
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'store_settings'
      and column_name = 'topup_promptpay_id'
  ) then
    alter table public.store_settings add column topup_promptpay_id text not null default '';

    -- เลขที่ตั้งไว้เป็นพร้อมเพย์อยู่แล้ว (เบอร์ 10 หลัก / บัตรประชาชน 13 / e-Wallet 15)
    -- ก็ย้ายมาช่องใหม่ให้เลย ไม่ต้องให้แอดมินมากรอกซ้ำ
    update public.store_settings
    set topup_promptpay_id = topup_receiver_account
    where length(regexp_replace(topup_receiver_account, '\D', '', 'g')) in (13, 15)
       or regexp_replace(topup_receiver_account, '\D', '', 'g') ~ '^0\d{9}$';
  end if;
end $$;

alter table public.store_settings add column if not exists topup_truemoney_phone text not null default '';

-- สวิตช์เปิด/ปิดช่องทางเติมเงิน แยกจากคอนฟิกของช่องนั้น
-- เดิมปิดช่องได้ด้วยการลบคอนฟิกทิ้งอย่างเดียว ซึ่งลบข้อมูลที่ลูกค้าต้องเห็นไปด้วย
-- และไม่มีทางปิดช่องสลิปได้เลย · default true = ของเดิมทำงานเหมือนเดิมหลัง migrate
-- ช่องทางติดต่อร้าน แสดงที่หน้า /contact ซึ่งเปิดสาธารณะ
-- หน้านั้นอ่านผ่าน service key และ select เฉพาะคอลัมน์ชุดนี้ เพราะ RLS ของตารางนี้
-- ให้เฉพาะคนที่ล็อกอินอ่านได้ และแถวเดียวกันมีเลขบัญชีร้านอยู่ด้วย
alter table public.store_settings add column if not exists contact_line text not null default '';
alter table public.store_settings add column if not exists contact_email text not null default '';
alter table public.store_settings add column if not exists contact_phone text not null default '';
alter table public.store_settings add column if not exists contact_facebook text not null default '';
alter table public.store_settings add column if not exists contact_discord text not null default '';
alter table public.store_settings add column if not exists contact_hours text not null default '';
alter table public.store_settings add column if not exists contact_note text not null default '';

alter table public.store_settings add column if not exists topup_slip_enabled boolean not null default true;
alter table public.store_settings add column if not exists topup_qr_enabled boolean not null default true;
alter table public.store_settings add column if not exists topup_truemoney_enabled boolean not null default true;
alter table public.store_settings add column if not exists topup_voucher_enabled boolean not null default true;

-- แถบประกาศบนหน้าแรก — ปิดเป็นค่าเริ่มต้นเพราะยังไม่มีข้อความให้แสดง
alter table public.store_settings add column if not exists announcement_enabled boolean not null default false;
alter table public.store_settings add column if not exists announcement_text text not null default '';
alter table public.store_settings add column if not exists announcement_link text not null default '';

-- แบนเนอร์รูปภาพบนสุดของหน้าแรก — ว่าง = ยังไม่แสดง
alter table public.store_settings add column if not exists hero_banner_image text not null default '';
alter table public.store_settings add column if not exists hero_banner_link text not null default '';

-- เปิด/ปิดเมนูใน navbar ทีละรายการ — ดู lib/nav-links.ts, เปิดทุกอันเป็นค่าเริ่มต้น
alter table public.store_settings add column if not exists nav_home_enabled boolean not null default true;
alter table public.store_settings add column if not exists nav_shop_enabled boolean not null default true;
alter table public.store_settings add column if not exists nav_orders_enabled boolean not null default true;
alter table public.store_settings add column if not exists nav_wallet_enabled boolean not null default true;
alter table public.store_settings add column if not exists nav_reset_hwid_enabled boolean not null default true;
alter table public.store_settings add column if not exists nav_contact_enabled boolean not null default true;

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists store_settings_touch_updated_at on public.store_settings;
create trigger store_settings_touch_updated_at
  before update on public.store_settings
  for each row execute function private.touch_updated_at();

-- ============================================================================
-- สินค้า
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  original_price numeric(12, 2) check (original_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text not null default '',
  specs jsonb not null default '{}'::jsonb,
  image text not null default '',
  gallery text[] not null default '{}',
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  badge text check (badge in ('HOT', 'NEW', 'SALE', 'LIMITED')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);
-- หน้าแรกดึงเฉพาะสินค้าแนะนำ — partial index เล็กกว่าและเร็วกว่า index เต็ม
create index if not exists products_featured_idx on public.products (created_at desc) where is_featured;

-- บริการ (เช่น รับทำเว็บไซต์) ไม่ใช่ของนับสต็อกได้จริง — ไม่โชว์ในแคตาล็อกหน้าแรก
-- และไม่นับ stock ของแถวนี้รวมเข้ากับ "จำนวนสินค้าที่เหลือ" ของทั้งร้าน
alter table public.products add column if not exists is_service boolean not null default false;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function private.touch_updated_at();

-- ============================================================================
-- รีวิวสินค้า
-- ============================================================================
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null default '',
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (length(trim(comment)) > 0),
  created_at timestamptz not null default now(),
  -- หนึ่งบัญชีรีวิวสินค้าหนึ่งชิ้นได้ครั้งเดียว (เขียนซ้ำ = แก้ของเดิม)
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id, created_at desc);
create index if not exists product_reviews_user_id_idx on public.product_reviews (user_id);

-- คะแนนเฉลี่ย/จำนวนรีวิวเก็บซ้ำไว้บน products เพื่อไม่ต้อง join ตอนโชว์รายการ
create or replace function private.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating = coalesce(round(stats.avg_rating, 1), 0),
      reviews_count = coalesce(stats.total, 0)
  from (
    select avg(rating)::numeric as avg_rating, count(*) as total
    from public.product_reviews
    where product_id = v_product_id
  ) as stats
  where p.id = v_product_id;

  return null;
end;
$$;

drop trigger if exists product_reviews_refresh_rating on public.product_reviews;
create trigger product_reviews_refresh_rating
  after insert or update or delete on public.product_reviews
  for each row execute function private.refresh_product_rating();

-- ============================================================================
-- คูปองส่วนลด
-- ============================================================================
create table if not exists public.coupons (
  code text primary key check (code = upper(trim(code)) and length(code) > 0),
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  min_spend numeric(12, 2) not null default 0 check (min_spend >= 0),
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons drop column if exists free_shipping;

-- ============================================================================
-- กระเป๋าเงิน
-- ============================================================================
create table if not exists public.wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- บันทึกทุกการเคลื่อนไหวของเงิน เพื่อให้ตรวจย้อนหลังได้ว่ายอดมาจากไหน
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('topup', 'purchase', 'refund', 'adjustment')),
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null check (balance_after >= 0),
  reference text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx
  on public.wallet_transactions (user_id, created_at desc);

-- ============================================================================
-- รายการเติมเงิน (สลิปที่ผ่านการตรวจกับ RDCW แล้ว)
-- ============================================================================
create table if not exists public.topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  -- กันสลิปเดิมถูกใช้ซ้ำ: unique ทั้งตาราง ไม่ใช่แค่ต่อผู้ใช้
  trans_ref text not null unique,
  sending_bank text,
  receiving_bank text,
  sender_name text,
  receiver_name text,
  transferred_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists topups_user_idx on public.topups (user_id, created_at desc);

-- ============================================================================
-- คำสั่งซื้อ
-- ============================================================================
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  customer jsonb not null,
  items jsonb not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  status text not null default 'รอดำเนินการ'
    check (status in ('รอดำเนินการ', 'กำลังจัดเตรียม', 'จัดส่งแล้ว', 'สำเร็จ', 'ยกเลิก')),
  payment_method text not null default 'wallet'
    check (payment_method in ('wallet', 'promptpay', 'credit_card', 'bank_transfer', 'cod')),
  is_paid boolean not null default false,
  tracking_number text,
  coupon_code text references public.coupons (code) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_coupon_code_idx on public.orders (coupon_code);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function private.touch_updated_at();

-- ============================================================================
-- สร้างกระเป๋าเงินให้ผู้ใช้ใหม่อัตโนมัติ
-- ============================================================================
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ผู้ใช้ที่สมัครไว้ก่อนหน้านี้
insert into public.wallets (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ============================================================================
-- เติมเงิน — เรียกได้จากฝั่งเซิร์ฟเวอร์ด้วย secret key เท่านั้น
-- เงินที่เข้ามาถูกยืนยันกับเจ้าของเงินจริงมาแล้วก่อนเรียกฟังก์ชันนี้:
-- สลิปตรวจกับธนาคารใน /api/topups, ซองอังเปาไถ่กับทรูใน /api/topups/truemoney
-- ============================================================================
-- เดิมไม่มี p_note (ข้อความ ledger ฟิกซ์ว่า "เติมเงินด้วยสลิปโอน" อยู่ในตัวฟังก์ชัน)
-- ต้อง drop ตัวเก่าทิ้งก่อน ไม่ใช่ create or replace เฉย ๆ เพราะจำนวนพารามิเตอร์
-- ที่ต่างกันจะกลายเป็นสองฟังก์ชันซ้อนกัน แล้ว rpc ที่ส่งมา 9 ตัวจะ ambiguous
drop function if exists public.credit_topup(
  uuid, numeric, text, text, text, text, text, timestamptz, jsonb
);

create or replace function public.credit_topup(
  p_user_id uuid,
  p_amount numeric,
  p_trans_ref text,
  p_sending_bank text default null,
  p_receiving_bank text default null,
  p_sender_name text default null,
  p_receiver_name text default null,
  p_transferred_at timestamptz default null,
  p_raw jsonb default '{}'::jsonb,
  p_note text default null
)
returns public.wallets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet public.wallets;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  insert into public.wallets (user_id) values (p_user_id) on conflict (user_id) do nothing;

  -- ล็อกแถวไว้ก่อน กันการเติมพร้อมกันสองรอบแล้วยอดเพี้ยน
  select * into v_wallet from public.wallets where user_id = p_user_id for update;

  -- unique(trans_ref) จะโยน 23505 ถ้าสลิปนี้เคยใช้แล้ว
  insert into public.topups (
    user_id, amount, trans_ref, sending_bank, receiving_bank,
    sender_name, receiver_name, transferred_at, raw
  ) values (
    p_user_id, p_amount, p_trans_ref, p_sending_bank, p_receiving_bank,
    p_sender_name, p_receiver_name, p_transferred_at, p_raw
  );

  update public.wallets
  set balance = balance + p_amount, updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  insert into public.wallet_transactions (user_id, kind, amount, balance_after, reference, note)
  values (
    p_user_id, 'topup', p_amount, v_wallet.balance, p_trans_ref,
    coalesce(nullif(p_note, ''), 'เติมเงินด้วยสลิปโอน')
  );

  return v_wallet;
end;
$$;

revoke execute on function public.credit_topup(
  uuid, numeric, text, text, text, text, text, timestamptz, jsonb, text
) from public, anon, authenticated;

-- ============================================================================
-- สั่งซื้อ — คิดราคาจากฐานข้อมูล ตัดสต็อกและตัดเงินในทรานแซกชันเดียว
-- ราคาที่ส่งมาจากเบราว์เซอร์ไม่ถูกใช้เลย
-- ============================================================================
create or replace function public.place_order(
  p_customer jsonb,
  p_items jsonb,
  p_coupon_code text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(12, 2) := 0;
  v_discount numeric(12, 2) := 0;
  v_shipping numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_coupon public.coupons;
  v_balance numeric(12, 2);
  v_order public.orders;
  v_order_id text;
  v_settings public.store_settings;
  v_claimed integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_settings from public.store_settings where id;

  if not coalesce(v_settings.is_open, true) then
    raise exception 'store_closed' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);

    if v_quantity <= 0 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    -- ล็อกสินค้าไว้จนจบทรานแซกชัน กันขายเกินสต็อกตอนมีคนสั่งพร้อมกัน
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'product_not_found:%', v_item ->> 'product_id' using errcode = '22023';
    end if;

    if v_product.stock < v_quantity then
      raise exception 'out_of_stock:%', v_product.name using errcode = '22023';
    end if;

    update public.products
    set stock = stock - v_quantity
    where id = v_product.id;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);

    v_items := v_items || jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'image', v_product.image,
      'unit_price', v_product.price,
      'quantity', v_quantity,
      'selected_color', v_item ->> 'selected_color'
    );
  end loop;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon
    from public.coupons
    where code = upper(trim(p_coupon_code)) and is_active;

    if found and v_subtotal >= v_coupon.min_spend then
      v_discount := round(v_subtotal * v_coupon.discount_percent / 100, 2);
    else
      v_coupon := null;
    end if;
  end if;

  -- สินค้าเป็นดิจิทัล ส่งมอบทันที จึงไม่มีค่าจัดส่ง (v_shipping คงเป็น 0 เสมอ)

  v_total := v_subtotal - v_discount + v_shipping;

  insert into public.wallets (user_id) values (v_user) on conflict (user_id) do nothing;
  select balance into v_balance from public.wallets where user_id = v_user for update;

  if v_balance < v_total then
    raise exception 'insufficient_balance:%:%', v_balance, v_total using errcode = '22023';
  end if;

  update public.wallets
  set balance = balance - v_total, updated_at = now()
  where user_id = v_user
  returning balance into v_balance;

  -- ใช้ gen_random_uuid() ซึ่งเป็นของ Postgres core ไม่ใช่ gen_random_bytes() ของ pgcrypto
  -- เพราะฟังก์ชันนี้ตั้ง search_path = '' และ Supabase ติดตั้ง extension ไว้ที่ schema extensions
  v_order_id := 'ORD-' || to_char(now(), 'YYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));

  insert into public.orders (
    id, user_id, customer, items, subtotal, discount, shipping_fee,
    total_amount, status, payment_method, is_paid, coupon_code
  ) values (
    v_order_id, v_user, p_customer, v_items, v_subtotal, v_discount, v_shipping,
    v_total, 'รอดำเนินการ', 'wallet', true, v_coupon.code
  )
  returning * into v_order;

  insert into public.wallet_transactions (user_id, kind, amount, balance_after, reference, note)
  values (v_user, 'purchase', -v_total, v_balance, v_order_id, 'ชำระค่าสินค้า');

  -- ── ส่งมอบรหัสจากคลังของร้าน ──────────────────────────────────────────
  -- สินค้าที่ขายจากคลังรหัส (public.product_codes) จองรหัสในทรานแซกชันเดียว
  -- กับที่ตัดเงิน ลูกค้าจึงไม่มีทางจ่ายแล้วไม่ได้รหัส และรหัสใบเดียวขายซ้ำไม่ได้
  --
  -- ต้องอยู่หลัง insert orders เพราะ product_codes.order_id อ้างถึงแถวนั้น
  for v_item in select * from jsonb_array_elements(v_items) loop
    v_quantity := (v_item ->> 'quantity')::integer;

    -- สินค้าที่ไม่เคยมีรหัสในคลังเลย = ขายแบบอื่น (ซัพพลายเออร์ หรือไม่ต้องส่งมอบ)
    if exists (
      select 1 from public.product_codes
      where product_id = (v_item ->> 'product_id')::uuid
    ) then
      with claimed as (
        update public.product_codes
        set order_id = v_order_id, user_id = v_user, claimed_at = now()
        where id in (
          select id
          from public.product_codes
          where product_id = (v_item ->> 'product_id')::uuid
            and claimed_at is null
          -- เก่าก่อน กันรหัสค้างคลังจนหมดอายุ
          order by created_at
          limit v_quantity
          for update skip locked
        )
        returning id, code, label
      )
      insert into public.order_fulfillments (
        order_id, user_id, supplier, supplier_ref, game_title,
        account_username, account_password, code_requests_max, status
      )
      select
        v_order_id, v_user, 'manual', 'manual-' || claimed.id::text,
        v_item ->> 'name', claimed.label, claimed.code, 0, 'delivered'
      from claimed;

      get diagnostics v_claimed = row_count;

      -- ได้ไม่ครบ = สต็อกกับคลังรหัสไม่ตรงกัน ยกเลิกทั้งคำสั่งซื้อดีกว่าส่งของขาด
      if v_claimed < v_quantity then
        raise exception 'out_of_stock:%', v_item ->> 'name' using errcode = '22023';
      end if;
    end if;
  end loop;

  return v_order;
end;
$$;

revoke execute on function public.place_order(jsonb, jsonb, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, text) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.product_reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.topups enable row level security;
alter table public.orders enable row level security;

-- ตั้งค่าร้าน: ลูกค้าต้องอ่านได้ (ต้องรู้ว่าโอนเข้าบัญชีไหน) แก้ได้เฉพาะแอดมิน
drop policy if exists store_settings_select on public.store_settings;
create policy store_settings_select on public.store_settings
  for select to authenticated using (true);

drop policy if exists store_settings_admin_update on public.store_settings;
create policy store_settings_admin_update on public.store_settings
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- สินค้า: ใครที่ล็อกอินก็ดูได้ แก้ได้เฉพาะแอดมิน
drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select to authenticated using (true);

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products
  for insert to authenticated with check ((select private.is_admin()));

drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products
  for delete to authenticated using ((select private.is_admin()));

-- รีวิว: อ่านได้ทุกคนที่ล็อกอิน เขียน/แก้/ลบได้เฉพาะของตัวเอง (แอดมินลบได้ด้วย)
drop policy if exists product_reviews_select on public.product_reviews;
create policy product_reviews_select on public.product_reviews
  for select to authenticated using (true);

drop policy if exists product_reviews_insert_own on public.product_reviews;
create policy product_reviews_insert_own on public.product_reviews
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists product_reviews_update_own on public.product_reviews;
create policy product_reviews_update_own on public.product_reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists product_reviews_delete_own on public.product_reviews;
create policy product_reviews_delete_own on public.product_reviews
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- คูปอง: ลูกค้าเห็นเฉพาะที่เปิดใช้งาน แอดมินเห็นและแก้ได้ทั้งหมด
drop policy if exists coupons_select on public.coupons;
create policy coupons_select on public.coupons
  for select to authenticated using (is_active or (select private.is_admin()));

drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- กระเป๋าเงิน/ประวัติ/การเติมเงิน: อ่านได้เฉพาะของตัวเอง เขียนได้เฉพาะผ่านฟังก์ชัน
-- (ไม่มี policy insert/update/delete = ฝั่ง client เขียนไม่ได้เลย)
drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own on public.wallet_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists topups_select_own on public.topups;
create policy topups_select_own on public.topups
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- คำสั่งซื้อ: ลูกค้าเห็นของตัวเอง แอดมินเห็นทั้งหมดและเป็นคนเดียวที่แก้สถานะได้
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ============================================================================
-- Grants — RLS ด้านบนเป็นตัวคุมว่าแถวไหนเห็น/แก้ได้
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, update on public.store_settings to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_reviews to authenticated;
grant select, insert, update, delete on public.coupons to authenticated;
grant select on public.wallets to authenticated;
grant select on public.wallet_transactions to authenticated;
grant select on public.topups to authenticated;
grant select, update on public.orders to authenticated;

-- ============================================================================
-- Storage — รูปสินค้า
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select private.is_admin()));

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

-- ============================================================================
-- ตัวแทนขายจากซัพพลายเออร์ (499K Network)
-- สินค้าที่นำเข้ามาจะผูกกับรหัสสินค้าฝั่งซัพพลายเออร์ไว้
-- ============================================================================
alter table public.products add column if not exists supplier text;
alter table public.products add column if not exists supplier_product_id text;
alter table public.products add column if not exists supplier_type text;
alter table public.products add column if not exists supplier_cost numeric(12, 2);
-- เฉพาะสินค้าเช่า (supplier_type = 'rental'): ช่วงเช่าที่ราคาขายอ้างถึง
-- ต้องส่งกลับไปตอนสั่งซื้อ ไม่งั้นซัพพลายเออร์จะให้มาแค่ 1 วันตามค่าเริ่มต้น
alter table public.products add column if not exists supplier_duration_days integer;

-- นำเข้าสินค้าเดิมซ้ำได้โดยไม่เกิดรายการซ้ำ
--
-- ต้องเป็น unique index เต็ม ไม่ใช่ partial (where supplier is not null) เพราะ
-- ON CONFLICT (supplier, supplier_product_id) อนุมาน partial index ไม่ได้ (42P10)
-- สินค้าที่ไม่ได้มาจากซัพพลายเออร์มี supplier เป็น NULL ซึ่ง Postgres ถือว่าไม่ชนกันเอง
drop index if exists public.products_supplier_uidx;
create unique index if not exists products_supplier_uidx
  on public.products (supplier, supplier_product_id);

-- บัญชีเกมที่ส่งมอบให้ลูกค้าแล้ว หนึ่งแถวต่อหนึ่งรายการในคำสั่งซื้อ
create table if not exists public.order_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  supplier text not null default '499k',
  -- ref ที่ส่งให้ซัพพลายเออร์ ใช้ตัดซ้ำเวลายิงใหม่
  supplier_ref text not null unique,
  supplier_order_no text,
  game_title text,
  account_username text,
  account_password text,
  code_requests_used integer not null default 0,
  code_requests_max integer not null default 3,
  status text not null default 'delivered' check (status in ('delivered', 'failed')),
  error_message text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_fulfillments_order_idx on public.order_fulfillments (order_id);
create index if not exists order_fulfillments_user_idx on public.order_fulfillments (user_id, created_at desc);

-- รีเซ็ต HWID ของบัญชีที่ร้านลงเอง (supplier = 'manual') — ลูกค้ากดเองได้ทันที
-- ไม่จำกัดจำนวนครั้ง แต่เสียค่าบริการต่อครั้งผ่าน reset_hwid() ด้านล่าง
alter table public.order_fulfillments add column if not exists hwid_reset_count integer not null default 0;
alter table public.order_fulfillments add column if not exists hwid_reset_last_at timestamptz;

-- ============================================================================
-- รีเซ็ต HWID — ลูกค้ากรอก License Key (username ของบัญชีที่ซื้อ) หักเงินในกระเป๋า
-- กับบันทึกการรีเซ็ตในทรานแซกชันเดียว กันเงินหักแล้วแต่ไม่บันทึก หรือรีเซ็ตฟรี
-- ============================================================================
create or replace function public.reset_hwid(p_license_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_fee numeric(12, 2) := 50;
  v_fulfillment public.order_fulfillments;
  v_balance numeric(12, 2);
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_license_key is null or length(trim(p_license_key)) = 0 then
    raise exception 'invalid_license_key' using errcode = '22023';
  end if;

  -- ล็อกแถวไว้ก่อน กันกดรัว ๆ พร้อมกันสองรอบแล้วรีเซ็ตซ้ำ
  select * into v_fulfillment
  from public.order_fulfillments
  where user_id = v_user
    and supplier = 'manual'
    and status = 'delivered'
    and account_username = trim(p_license_key)
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'license_not_found' using errcode = '22023';
  end if;

  insert into public.wallets (user_id) values (v_user) on conflict (user_id) do nothing;
  select balance into v_balance from public.wallets where user_id = v_user for update;

  if v_balance < v_fee then
    raise exception 'insufficient_balance:%:%', v_balance, v_fee using errcode = '22023';
  end if;

  update public.wallets
  set balance = balance - v_fee, updated_at = now()
  where user_id = v_user
  returning balance into v_balance;

  insert into public.wallet_transactions (user_id, kind, amount, balance_after, reference, note)
  values (v_user, 'purchase', -v_fee, v_balance, v_fulfillment.order_id, 'รีเซ็ต HWID');

  update public.order_fulfillments
  set hwid_reset_count = hwid_reset_count + 1, hwid_reset_last_at = now()
  where id = v_fulfillment.id
  returning * into v_fulfillment;

  return jsonb_build_object(
    'balance', v_balance,
    'gameTitle', v_fulfillment.game_title,
    'hwidResetCount', v_fulfillment.hwid_reset_count,
    'hwidResetLastAt', v_fulfillment.hwid_reset_last_at
  );
end;
$$;

revoke execute on function public.reset_hwid(text) from public, anon;
grant execute on function public.reset_hwid(text) to authenticated;

alter table public.order_fulfillments enable row level security;

-- บัญชีเกมเป็นข้อมูลอ่อนไหว: เจ้าของคำสั่งซื้อและแอดมินเท่านั้นที่อ่านได้
-- และไม่มี policy ให้เขียนเลย (เขียนผ่าน service key ตอนส่งมอบ)
drop policy if exists order_fulfillments_select_own on public.order_fulfillments;
create policy order_fulfillments_select_own on public.order_fulfillments
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

grant select on public.order_fulfillments to authenticated;

-- ============================================================================
-- คลังรหัสของร้าน — สำหรับสินค้าที่ร้านลงรหัส/ไอดีเองโดยไม่ผ่านซัพพลายเออร์
--
-- หนึ่งแถวคือของหนึ่งชิ้นที่ขายได้หนึ่งครั้ง `claimed_at` เป็นตัวบอกว่าถูกขายไปแล้ว
-- แทนที่จะลบทิ้ง เพราะต้องสืบย้อนได้ว่ารหัสใบไหนไปอยู่กับคำสั่งซื้อไหน
-- ============================================================================
create table if not exists public.product_codes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- ตัวรหัสจริงที่ลูกค้าได้รับ (คีย์เกม, รหัสผ่าน, หรืออะไรก็ตามที่ร้านขาย)
  code text not null,
  -- ป้ายกำกับที่แสดงคู่กัน เช่นชื่อผู้ใช้ของไอดีนั้น เว้นว่างได้
  label text,
  -- บันทึกภายในของแอดมิน ลูกค้าไม่เห็น
  note text,
  order_id text references public.orders (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- รหัสซ้ำในสินค้าเดียวกันคือความผิดพลาดเสมอ — เท่ากับขายของชิ้นเดิมสองรอบ
create unique index if not exists product_codes_unique_idx
  on public.product_codes (product_id, code);

-- คิวของที่ยังขายได้ ใช้ตอนจองรหัสใน place_order
create index if not exists product_codes_available_idx
  on public.product_codes (product_id, created_at)
  where claimed_at is null;

create index if not exists product_codes_order_idx on public.product_codes (order_id);

/*
 * สต็อกของสินค้าที่ขายจากคลังรหัส = จำนวนรหัสที่ยังไม่ถูกขาย
 *
 * ให้ทริกเกอร์คำนวณให้เสมอ ไม่ปล่อยให้แอดมินกรอกเอง เพราะสองตัวเลขนี้แยกกัน
 * เมื่อไหร่ ก็ขายเกินของที่มีจริงเมื่อนั้น (place_order ยังกันซ้ำอีกชั้น
 * ด้วยการนับรหัสที่จองได้จริงก่อนยอมให้จบคำสั่งซื้อ)
 */
create or replace function private.sync_code_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid;
begin
  -- แยกด้วย if ไม่ใช่ coalesce(new.…, old.…): ใน trigger ของ DELETE ตัวแปร new
  -- ไม่ถูกกำหนดค่า แค่เอ่ยถึงฟิลด์ของมันก็ error แล้ว ไม่ได้คืน null มาให้
  if tg_op = 'DELETE' then
    v_product := old.product_id;
  else
    v_product := new.product_id;
  end if;

  update public.products
  set stock = (
    select count(*)
    from public.product_codes
    where product_id = v_product and claimed_at is null
  )
  where id = v_product;

  return null;
end;
$$;

drop trigger if exists product_codes_sync_stock on public.product_codes;
create trigger product_codes_sync_stock
  after insert or update or delete on public.product_codes
  for each row execute function private.sync_code_stock();

alter table public.product_codes enable row level security;

-- รหัสที่ยังไม่ถูกขายคือสินค้าคงคลัง ลูกค้าไม่ต้องเห็นเลยแม้แต่แถวเดียว
-- ของที่ซื้อไปแล้วอ่านได้จาก order_fulfillments ซึ่งมี policy ของตัวเอง
drop policy if exists product_codes_admin_all on public.product_codes;
create policy product_codes_admin_all on public.product_codes
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select, insert, update, delete on public.product_codes to authenticated;

-- ============================================================================
-- คืนเงินเมื่อส่งมอบไม่สำเร็จ
-- ตัดเงินกับสั่งซื้อกับซัพพลายเออร์อยู่คนละระบบ จึงต้องมีทางถอยเมื่อขั้นที่สองล้ม
-- ============================================================================
create or replace function public.refund_order(p_order_id text, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_balance numeric(12, 2);
  v_item jsonb;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'order_not_found' using errcode = '22023';
  end if;

  if v_order.status = 'ยกเลิก' then
    return v_order; -- คืนไปแล้ว ไม่คืนซ้ำ
  end if;

  -- คืนสต็อกที่ตัดไปตอนสั่งซื้อ
  for v_item in select * from jsonb_array_elements(v_order.items) loop
    update public.products
    set stock = stock + coalesce((v_item ->> 'quantity')::integer, 0)
    where id = (v_item ->> 'product_id')::uuid;
  end loop;

  -- คืนรหัสเข้าคลังให้ขายใหม่ได้ ต้องอยู่หลังลูปคืนสต็อกด้านบน เพราะทริกเกอร์
  -- sync_code_stock จะคำนวณสต็อกของสินค้าที่ขายด้วยรหัสใหม่ทั้งหมด ทับตัวเลข
  -- ที่บวกไปข้างบน — ไม่งั้นสินค้าที่ขายด้วยรหัสจะถูกคืนสต็อกซ้ำสองเด้ง
  update public.product_codes
  set order_id = null, user_id = null, claimed_at = null
  where order_id = p_order_id;

  -- บัญชีที่ส่งมอบไปแล้วต้องหายจากประวัติของลูกค้าด้วย ไม่งั้นยังเห็นรหัสที่
  -- ถูกคืนเข้าคลังไปขายต่อให้คนอื่นแล้ว
  delete from public.order_fulfillments
  where order_id = p_order_id and supplier = 'manual';

  update public.wallets
  set balance = balance + v_order.total_amount, updated_at = now()
  where user_id = v_order.user_id
  returning balance into v_balance;

  insert into public.wallet_transactions (user_id, kind, amount, balance_after, reference, note)
  values (
    v_order.user_id, 'refund', v_order.total_amount, v_balance, v_order.id,
    coalesce(p_reason, 'คืนเงินอัตโนมัติ: ส่งมอบสินค้าไม่สำเร็จ')
  );

  update public.orders
  set status = 'ยกเลิก', is_paid = false
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.refund_order(text, text) from public, anon, authenticated;
