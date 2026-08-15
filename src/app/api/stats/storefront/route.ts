import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Store-wide totals for the homepage stats banner. `wallets` and `orders` are
 * both locked by RLS to "your own rows", so a signed-in customer's normal
 * client only ever sees their own — the admin client bypasses that here since
 * a plain user count and an items-sold sum carry no per-customer data.
 */
export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = createAdminClient();

    const [users, paidOrders] = await Promise.all([
      supabase.from('wallets').select('user_id', { count: 'exact', head: true }),
      supabase.from('orders').select('items').eq('is_paid', true),
    ]);

    if (users.error) throw users.error;
    if (paidOrders.error) throw paidOrders.error;

    const totalItemsSold = (paidOrders.data ?? []).reduce((sum, order) => {
      const items = Array.isArray(order.items) ? (order.items as { quantity?: unknown }[]) : [];
      return sum + items.reduce((qty, item) => qty + (Number(item?.quantity) || 0), 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.count ?? 0,
        totalItemsSold,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
