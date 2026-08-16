import { gzipSync } from 'node:zlib';
import { recordAudit } from './audit';
import { createAdminClient } from './supabase/admin';

/**
 * สำรองข้อมูลรายวัน
 *
 * Dumps every table this app owns into one gzipped JSON file in a **private**
 * Storage bucket, then deletes anything older than {@link KEEP_DAYS}.
 *
 * Honest about what this is and is not:
 *
 * - it is a *data* backup — rows, as the API sees them. It is not `pg_dump`:
 *   no schema, no functions, no policies, no triggers. `supabase/schema.sql`
 *   is the schema backup, and it lives in git.
 * - `auth.users` is exported as identity only (id, email, role, timestamps).
 *   Password hashes are not reachable through the admin API and are not here.
 * - restoring is a deliberate, manual job: run schema.sql on a fresh project,
 *   recreate the users, then load the rows. Nothing restores automatically,
 *   because a backup that can overwrite production by itself is a hazard.
 */

/** เก็บกี่วันย้อนหลัง ก่อนลบทิ้งเอง */
const KEEP_DAYS = 14;

/** อ่านทีละก้อน กันแถวเยอะจนหน่วยความจำไม่พอ */
const PAGE_SIZE = 1000;

export const BACKUP_BUCKET = 'backups';

/** ตารางที่แอปนี้เป็นเจ้าของ เรียงตามลำดับที่ import กลับได้โดยไม่ติด FK */
const TABLES = [
  'store_settings',
  'products',
  'product_codes',
  'coupons',
  'wallets',
  'orders',
  'order_fulfillments',
  'topups',
  'wallet_transactions',
  'product_reviews',
  'audit_logs',
] as const;

export interface BackupResult {
  path: string;
  bytes: number;
  rows: Record<string, number>;
  users: number;
  pruned: string[];
  durationMs: number;
}

type Client = ReturnType<typeof createAdminClient>;

/** อ่านทั้งตารางแบบแบ่งหน้า */
async function dumpTable(admin: Client, table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    // A table that cannot be read must not silently produce an empty backup —
    // an "empty" file that looks fine is worse than a failure that is noticed.
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;

    rows.push(...(data as Record<string, unknown>[]));
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
}

/**
 * ผู้ใช้จาก GoTrue — เก็บเท่าที่ผูกข้อมูลกลับได้
 *
 * ทุกตารางอ้าง `auth.users(id)` ถ้าไม่มีรายชื่อนี้ ข้อมูลที่กู้กลับมาจะเป็นแถวที่ไม่รู้ว่า
 * ของใคร แต่ก็เก็บแค่ id/อีเมล/สิทธิ์ ไม่ใช่ทุกอย่างในบัญชี
 */
async function dumpUsers(admin: Client) {
  const users: Record<string, unknown>[] = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw new Error(`auth.users: ${error.message}`);
    if (!data.users.length) break;

    users.push(
      ...data.users.map((user) => ({
        id: user.id,
        email: user.email,
        role: (user.app_metadata as { role?: string })?.role ?? 'customer',
        full_name: (user.user_metadata as { full_name?: string })?.full_name ?? null,
        created_at: user.created_at,
        banned_until: (user as { banned_until?: string }).banned_until ?? null,
      }))
    );

    if (data.users.length < PAGE_SIZE) break;
  }

  return users;
}

/** ลบไฟล์ที่เก่ากว่าที่ตั้งไว้ — ไม่มีใครมาลบให้ พื้นที่จะโตไปเรื่อย ๆ */
async function prune(admin: Client, now: Date): Promise<string[]> {
  const { data, error } = await admin.storage.from(BACKUP_BUCKET).list('', { limit: 1000 });
  if (error || !data) return [];

  const cutoff = now.getTime() - KEEP_DAYS * 86_400_000;
  const old = data
    .filter((file) => new Date(file.created_at ?? file.updated_at ?? now).getTime() < cutoff)
    .map((file) => file.name);

  if (!old.length) return [];

  const { error: removeError } = await admin.storage.from(BACKUP_BUCKET).remove(old);
  if (removeError) {
    console.error('[backup] prune failed', removeError.message);
    return [];
  }

  return old;
}

/**
 * สำรองข้อมูลหนึ่งรอบ
 *
 * `startedAt` ถูกส่งเข้ามาแทนที่จะเรียก `new Date()` ข้างใน เพื่อให้ชื่อไฟล์กับเวลาที่
 * บันทึกลง audit เป็นเวลาเดียวกันเป๊ะ
 */
export async function runBackup(startedAt = new Date()): Promise<BackupResult> {
  const admin = createAdminClient();
  const began = Date.now();

  const tables: Record<string, Record<string, unknown>[]> = {};
  const rows: Record<string, number> = {};

  for (const table of TABLES) {
    const data = await dumpTable(admin, table);
    tables[table] = data;
    rows[table] = data.length;
  }

  const users = await dumpUsers(admin);

  const payload = {
    version: 1,
    createdAt: startedAt.toISOString(),
    note: 'ข้อมูลเท่านั้น ไม่ใช่ pg_dump — สคีมาอยู่ที่ supabase/schema.sql ใน git',
    users,
    tables,
  };

  const body = gzipSync(Buffer.from(JSON.stringify(payload), 'utf8'));
  // ชื่อเรียงตามเวลาอยู่แล้วเมื่อเรียงตามตัวอักษร หาไฟล์ของวันไหนก็ง่าย
  const path = `${startedAt.toISOString().slice(0, 19).replace(/[:T]/g, '-')}Z.json.gz`;

  const { error } = await admin.storage.from(BACKUP_BUCKET).upload(path, body, {
    contentType: 'application/gzip',
    upsert: true,
  });

  if (error) throw new Error(`upload: ${error.message}`);

  const pruned = await prune(admin, startedAt);

  const result: BackupResult = {
    path,
    bytes: body.byteLength,
    rows,
    users: users.length,
    pruned,
    durationMs: Date.now() - began,
  };

  await recordAudit({
    action: 'backup.run',
    targetType: 'backup',
    targetId: path,
    summary: `สำรองข้อมูลสำเร็จ ${(body.byteLength / 1024).toFixed(0)} KB (${Object.values(rows).reduce((a, b) => a + b, 0)} แถว, ${users.length} บัญชี)`,
    meta: { ...result },
  });

  return result;
}
