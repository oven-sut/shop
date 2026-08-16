import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * GET /api/audit — อ่านบันทึกระบบ (แอดมินเท่านั้น)
 *
 * Read through the caller's own client so the RLS policy is the thing deciding,
 * not this handler alone. Nothing here can write: the table has no insert policy
 * at all, and entries only ever arrive through `lib/audit.ts` with the service key.
 */
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const params = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number(params.get('limit')) || 50, 1), MAX_LIMIT);
    const before = params.get('before');
    const action = params.get('action');
    const actorId = params.get('actorId');
    const search = params.get('q');

    const supabase = await createRouteClient();
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Keyset paging on the timestamp: cheaper than offset and stable while new
    // entries keep arriving at the top.
    if (before) query = query.lt('created_at', before);
    // `action.` matches a whole domain — `topup.` gives every top-up channel.
    if (action) query = action.endsWith('.') ? query.like('action', `${action}%`) : query.eq('action', action);
    if (actorId) query = query.eq('actor_id', actorId);
    if (search) query = query.ilike('summary', `%${search.slice(0, 100)}%`);

    const { data, error } = await query;
    if (error) return dbError(error);

    return NextResponse.json({
      success: true,
      count: data.length,
      data: data.map((row) => ({
        id: row.id,
        action: row.action,
        summary: row.summary,
        actorId: row.actor_id,
        actorEmail: row.actor_email,
        actorRole: row.actor_role,
        targetType: row.target_type,
        targetId: row.target_id,
        meta: row.meta,
        ip: row.ip,
        createdAt: row.created_at,
      })),
      // ส่งเวลาแถวสุดท้ายกลับไปเพื่อขอหน้าถัดไป
      nextBefore: data.length === limit ? data[data.length - 1].created_at : null,
    });
  } catch (error) {
    return serverError(error);
  }
}
