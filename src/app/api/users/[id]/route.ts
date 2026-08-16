import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { badRequest, forbidden, serverError } from '@/lib/api-response';
import { roleFromAppMetadata } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/** Supabase expects a duration, not a date. Long enough to mean "until lifted". */
const BAN_FOREVER = '876000h'; // 100 ปี

const notFound = () =>
  NextResponse.json(
    { success: false, error: 'not_found', message: 'ไม่พบบัญชีผู้ใช้นี้' },
    { status: 404 }
  );

/**
 * Changes a user's role, suspension or display name.
 *
 * An admin may not aim any of this at their own account. Demoting or banning
 * yourself locks the last hand out of the back office — and unlike every other
 * mistake on this page, that one cannot be undone from inside the app.
 *
 * Both changes land in the JWT, not in a table this app reads per request, so
 * they take effect for the target when their access token is next refreshed
 * (within the hour), or immediately on their next sign-in.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const role = body.role === 'admin' || body.role === 'customer' ? body.role : null;
    const banned = typeof body.banned === 'boolean' ? body.banned : null;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : null;

    if (role === null && banned === null && name === null) {
      return badRequest('ต้องระบุอย่างน้อยหนึ่งอย่าง: role, banned หรือ name');
    }

    if (id === user.id && (role !== null || banned !== null)) {
      return forbidden('เปลี่ยนสิทธิ์หรือระงับบัญชีของตัวเองไม่ได้');
    }

    const admin = createAdminClient();

    // GoTrue merges the keys given here into the existing metadata, so naming
    // `role` alone leaves the rest of app_metadata (provider, providers) alone.
    const attributes: Parameters<typeof admin.auth.admin.updateUserById>[1] = {};
    if (role !== null) attributes.app_metadata = { role };
    if (banned !== null) attributes.ban_duration = banned ? BAN_FOREVER : 'none';
    if (name !== null) attributes.user_metadata = { full_name: name };

    const { data, error } = await admin.auth.admin.updateUserById(id, attributes);

    if (error) {
      if (error.status === 404) return notFound();
      console.error('[api:users:patch]', error.message);
      return badRequest('แก้ไขบัญชีไม่สำเร็จ', 'update_failed');
    }

    const updated = data.user;
    const isBanned = Boolean(
      updated.banned_until && new Date(updated.banned_until).getTime() > Date.now()
    );

    const changes = [
      role !== null ? (role === 'admin' ? 'ตั้งเป็นผู้ดูแลระบบ' : 'ปรับเป็นลูกค้าทั่วไป') : null,
      banned !== null ? (banned ? 'ระงับการใช้งาน' : 'ปลดระงับ') : null,
      name !== null ? 'เปลี่ยนชื่อที่แสดง' : null,
    ].filter(Boolean);

    return NextResponse.json({
      success: true,
      message: `${changes.join(' · ')} — ${updated.email ?? id} เรียบร้อยแล้ว`,
      data: {
        id: updated.id,
        role: roleFromAppMetadata(updated.app_metadata),
        isBanned,
        bannedUntil: updated.banned_until,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Deletes an account for good.
 *
 * Every table that points at `auth.users` cascades, so the orders, wallet,
 * ledger, top-ups and delivered accounts of this customer go with it. That is
 * the point when someone asks to have their data removed, and the wrong tool
 * for a customer who is merely misbehaving — suspend those with PATCH instead.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;

    if (id === user.id) {
      return forbidden('ลบบัญชีของตัวเองไม่ได้');
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.deleteUser(id);

    if (error) {
      if (error.status === 404) return notFound();
      console.error('[api:users:delete]', error.message);
      return badRequest('ลบบัญชีไม่สำเร็จ', 'delete_failed');
    }

    return NextResponse.json({
      success: true,
      message: `ลบบัญชี ${data.user?.email ?? id} พร้อมประวัติทั้งหมดแล้ว`,
    });
  } catch (error) {
    return serverError(error);
  }
}
