/**
 * รัน supabase/schema.sql เข้าฐานข้อมูลโดยตรง
 *
 *   node scripts/apply-schema.mjs "postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres"
 *
 * หรือกำหนด DATABASE_URL ไว้ใน environment แล้วเรียกโดยไม่ต้องใส่อาร์กิวเมนต์
 *
 * ไฟล์ schema เขียนแบบรันซ้ำได้ (create ... if not exists / create or replace)
 * จึงรันกี่ครั้งก็ปลอดภัย ทั้งไฟล์ถูกครอบด้วยทรานแซกชันเดียว ล้มตรงไหนคือไม่เปลี่ยนอะไรเลย
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, '..', 'supabase', 'schema.sql');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    'ต้องระบุ connection string\n' +
      '  node scripts/apply-schema.mjs "postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres"'
  );
  process.exit(1);
}

const sql = readFileSync(schemaPath, 'utf8');
const client = new pg.Client({
  connectionString,
  // Supabase บังคับ TLS แต่ใช้ใบรับรองของตัวเอง
  ssl: { rejectUnauthorized: false },
});

const started = Date.now();

try {
  await client.connect();
  console.log('เชื่อมต่อฐานข้อมูลแล้ว กำลังรัน schema...');

  await client.query('begin');
  await client.query(sql);
  await client.query('commit');

  console.log(`รัน schema สำเร็จใน ${((Date.now() - started) / 1000).toFixed(1)} วินาที\n`);

  const { rows: tables } = await client.query(`
    select table_name, (select count(*) from pg_policies p where p.tablename = t.table_name) as policies
    from information_schema.tables t
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  console.log('ตารางใน public:');
  for (const row of tables) {
    console.log(`  ${row.table_name.padEnd(22)} ${row.policies} policies`);
  }

  const { rows: functions } = await client.query(`
    select routine_name from information_schema.routines
    where routine_schema = 'public' and routine_name in ('place_order', 'credit_topup', 'refund_order')
    order by routine_name
  `);
  console.log('\nฟังก์ชัน:', functions.map((row) => row.routine_name).join(', ') || 'ไม่พบ');

  const { rows: buckets } = await client.query(`select id, public from storage.buckets`);
  console.log('Storage buckets:', buckets.map((row) => row.id).join(', ') || 'ไม่มี');
} catch (error) {
  await client.query('rollback').catch(() => {});
  console.error('\nรัน schema ไม่สำเร็จ — ฐานข้อมูลไม่ถูกแก้ไข');
  console.error(`  ${error.message}`);
  if (error.position) console.error(`  ตำแหน่งอักขระที่ ${error.position}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
