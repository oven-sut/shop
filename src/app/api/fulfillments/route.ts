import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

/** บัญชีเกมที่ผู้ใช้ซื้อไปแล้ว — RLS จำกัดให้เห็นเฉพาะของตัวเอง */
export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('order_fulfillments')
      .select(
        'id, order_id, game_title, account_username, account_password, code_requests_used, code_requests_max, status, error_message, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      data: data.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        gameTitle: row.game_title ?? '',
        username: row.account_username ?? '',
        password: row.account_password ?? '',
        codeRequests: {
          used: row.code_requests_used ?? 0,
          max: row.code_requests_max ?? 3,
        },
        status: row.status,
        errorMessage: row.error_message ?? undefined,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
