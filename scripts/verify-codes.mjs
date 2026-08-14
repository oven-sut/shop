/**
 * ตรวจว่าคลังรหัสทำงานจริงกับฐานข้อมูล แล้ว rollback ทิ้งทั้งหมด
 *
 *   node --env-file=.env scripts/verify-codes.mjs
 *
 * ทดสอบสิ่งที่ syntax check ของ Postgres จับไม่ได้: ทริกเกอร์ตั้งสต็อกถูกไหม
 * บล็อกจองรหัสใน place_order รันผ่านไหม และ refund_order คืนรหัสกลับเข้าคลังไหม
 * ทุกอย่างอยู่ในทรานแซกชันเดียวที่จบด้วย rollback ข้อมูลจริงจึงไม่ถูกแตะ
 */
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const check = (label, actual, expected) => {
  const ok = String(actual) === String(expected);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label} — ได้ ${actual} คาดว่า ${expected}`);
  if (!ok) process.exitCode = 1;
};

await client.connect();
await client.query('begin');

try {
  const { rows: users } = await client.query('select id from auth.users limit 1');
  if (!users.length) throw new Error('ยังไม่มีผู้ใช้ในระบบ ทดสอบไม่ได้');
  const userId = users[0].id;

  const { rows: made } = await client.query(
    `insert into public.products (name, category, price, stock, description, image)
     values ('__verify__', 'test', 100, 0, '', 'https://example.com/x.png')
     returning id`
  );
  const productId = made[0].id;

  console.log('\n1) ทริกเกอร์ตั้งสต็อกจากจำนวนรหัสที่ยังไม่ถูกขาย');
  await client.query(
    `insert into public.product_codes (product_id, code, label)
     values ($1, 'CODE-A', 'user-a'), ($1, 'CODE-B', null), ($1, 'CODE-C', null)`,
    [productId]
  );
  let stock = await client.query('select stock from public.products where id = $1', [productId]);
  check('เพิ่ม 3 รหัส แล้วสต็อก', stock.rows[0].stock, 3);

  await client.query(`delete from public.product_codes where product_id = $1 and code = 'CODE-C'`, [
    productId,
  ]);
  stock = await client.query('select stock from public.products where id = $1', [productId]);
  check('ลบ 1 รหัส แล้วสต็อก', stock.rows[0].stock, 2);

  console.log('\n2) บล็อกจองรหัสแบบเดียวกับที่อยู่ใน place_order');
  const orderId = 'ORD-VERIFY-1';
  await client.query(
    `insert into public.orders (id, user_id, customer, items, subtotal, discount, shipping_fee,
       total_amount, status, payment_method, is_paid)
     values ($1, $2, '{"name":"t"}'::jsonb, '[]'::jsonb, 100, 0, 0, 100, 'รอดำเนินการ', 'wallet', true)`,
    [orderId, userId]
  );

  const claim = await client.query(
    `with claimed as (
       update public.product_codes
       set order_id = $1, user_id = $2, claimed_at = now()
       where id in (
         select id from public.product_codes
         where product_id = $3 and claimed_at is null
         order by created_at limit 2 for update skip locked
       )
       returning id, code, label
     )
     insert into public.order_fulfillments (
       order_id, user_id, supplier, supplier_ref, game_title,
       account_username, account_password, code_requests_max, status
     )
     select $1, $2, 'manual', 'manual-' || claimed.id::text, '__verify__',
            claimed.label, claimed.code, 0, 'delivered'
     from claimed`,
    [orderId, userId, productId]
  );
  check('จองได้กี่รหัส', claim.rowCount, 2);

  stock = await client.query('select stock from public.products where id = $1', [productId]);
  check('สต็อกหลังขายหมด', stock.rows[0].stock, 0);

  const delivered = await client.query(
    `select account_username, account_password from public.order_fulfillments
     where order_id = $1 order by account_password`,
    [orderId]
  );
  check('แถวที่ส่งมอบ', delivered.rowCount, 2);
  check('รหัสใบแรกที่ลูกค้าเห็น', delivered.rows[0].account_password, 'CODE-A');
  check('ชื่อผู้ใช้ที่มากับรหัสนั้น', delivered.rows[0].account_username, 'user-a');

  console.log('\n3) refund_order คืนรหัสเข้าคลังและลบแถวที่ส่งมอบ');
  await client.query('select public.refund_order($1, $2)', [orderId, 'ทดสอบ']);

  stock = await client.query('select stock from public.products where id = $1', [productId]);
  check('สต็อกหลังคืนเงิน', stock.rows[0].stock, 2);

  const left = await client.query(
    'select count(*)::int as n from public.order_fulfillments where order_id = $1',
    [orderId]
  );
  check('แถวส่งมอบที่เหลือ', left.rows[0].n, 0);

  console.log('\n4) รหัสซ้ำในสินค้าเดียวกันต้องถูกปฏิเสธ');
  try {
    await client.query('savepoint dup');
    await client.query(
      `insert into public.product_codes (product_id, code) values ($1, 'CODE-A')`,
      [productId]
    );
    check('insert รหัสซ้ำ', 'สำเร็จ', 'ถูกปฏิเสธ');
  } catch (error) {
    await client.query('rollback to savepoint dup');
    check('insert รหัสซ้ำถูกปฏิเสธด้วย', error.code, '23505');
  }
} catch (error) {
  console.error('\nทดสอบล้ม:', error.message);
  process.exitCode = 1;
} finally {
  await client.query('rollback');
  await client.end();
  console.log('\nrollback แล้ว ข้อมูลจริงไม่ถูกแตะ');
}
