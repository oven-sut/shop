import type { NextRequest } from 'next/server';
import type { User } from '../types/auth';
import { createAdminClient } from './supabase/admin';

/**
 * บันทึกระบบ — ใครทำอะไรกับอะไร
 *
 * Written with the service key because no client may write here: a log the
 * logged party can edit is not a log. Reading is admin-only, enforced by RLS.
 *
 * **Recording never breaks the thing it records.** Every failure is swallowed
 * after being printed to the server log — an order must not fail because the
 * audit insert did. That is a deliberate trade: the operation is what the
 * customer is waiting for, and a missing line is recoverable from the data
 * itself, while a failed order is not.
 */

/** `<โดเมน>.<การกระทำ>` — คงรูปแบบไว้เพื่อให้กรองในหน้าแอดมินได้ */
export type AuditAction =
  | 'settings.update'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.codes.add'
  | 'order.status'
  | 'order.refund'
  | 'coupon.create'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.wallet.adjust'
  | 'topup.slip'
  | 'topup.voucher'
  | 'topup.gateway'
  | 'supplier.buy'
  | 'supplier.report'
  | 'backup.run'
  | 'backup.prune';

export interface AuditEntry {
  action: AuditAction;
  /** สรุปเป็นภาษาคน โผล่ในหน้าแอดมินตรง ๆ */
  summary: string;
  /** ผู้ลงมือ — เว้นไว้ได้ถ้าไม่ใช่คน เช่น webhook ของเกตเวย์หรือ cron */
  actor?: User | null;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  /** ใส่เพื่อเก็บ IP/User-Agent ของคำขอนั้น */
  request?: NextRequest;
}

/** ตัดค่ายาว ๆ ทิ้งก่อนเก็บ — log ไม่ใช่ที่เก็บ payload */
const clip = (value: string | undefined, max: number) =>
  value && value.length > max ? `${value.slice(0, max)}…` : value;

/**
 * ที่อยู่ผู้เรียกเท่าที่พร็อกซีบอกมา
 *
 * `x-forwarded-for` แต่งเองได้ ค่าที่ได้จึงเป็นแค่เบาะแส ไม่ใช่หลักฐาน — เก็บไว้ช่วย
 * ไล่เหตุการณ์ ไม่ได้เอาไปตัดสินสิทธิ์อะไร
 */
function callerIp(request?: NextRequest): string | undefined {
  if (!request) return undefined;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return clip(forwarded.split(',')[0].trim(), 60);

  return clip(request.headers.get('x-real-ip') ?? undefined, 60);
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();

    const { error } = await admin.from('audit_logs').insert({
      actor_id: entry.actor?.id ?? null,
      actor_email: entry.actor?.email ?? null,
      actor_role: entry.actor?.role ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ? clip(entry.targetId, 200) : null,
      summary: clip(entry.summary, 500),
      meta: entry.meta ?? {},
      ip: callerIp(entry.request) ?? null,
      user_agent: clip(entry.request?.headers.get('user-agent') ?? undefined, 300) ?? null,
    });

    if (error) console.error('[audit] insert failed', entry.action, error.message);
  } catch (error) {
    console.error('[audit] insert threw', entry.action, error);
  }
}

/**
 * เทียบค่าก่อน/หลัง เก็บเฉพาะฟิลด์ที่เปลี่ยนจริง
 *
 * เก็บทั้งก้อนทุกครั้งจะทำให้หน้า log อ่านไม่ออกว่าอะไรเปลี่ยน และตารางบวมด้วยค่าที่
 * เหมือนเดิม — ที่อยากรู้ตอนไล่ปัญหาคือ "อะไรเปลี่ยนจากอะไรเป็นอะไร"
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const key of Object.keys(after)) {
    const from = before[key];
    const to = after[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }

  return changes;
}
