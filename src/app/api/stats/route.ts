import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

const LOW_STOCK_THRESHOLD = 5;

/**
 * Dashboard totals. Every query runs under RLS, so a customer calling this only
 * ever sees numbers derived from their own orders.
 */
export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createRouteClient();

    const [orders, products, lowStock] = await Promise.all([
      supabase.from('orders').select('total_amount, is_paid, created_at'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .lte('stock', LOW_STOCK_THRESHOLD),
    ]);

    if (orders.error) {
      return NextResponse.json({ success: false, error: orders.error.message }, { status: 400 });
    }

    const rows = orders.data ?? [];
    const totalRevenue = rows
      .filter((row) => row.is_paid)
      .reduce((sum, row) => sum + Number(row.total_amount), 0);

    // Last 6 months of paid revenue, oldest first.
    const months: { month: string; sales: number }[] = [];
    const now = new Date();

    for (let back = 5; back >= 0; back--) {
      const start = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - back + 1, 1);

      const sales = rows
        .filter((row) => {
          if (!row.is_paid) return false;
          const at = new Date(row.created_at);
          return at >= start && at < end;
        })
        .reduce((sum, row) => sum + Number(row.total_amount), 0);

      months.push({
        month: start.toLocaleDateString('th-TH', { month: 'short' }),
        sales,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: rows.length,
        totalProducts: products.count ?? 0,
        lowStockCount: lowStock.count ?? 0,
        monthlySalesTrend: months,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
