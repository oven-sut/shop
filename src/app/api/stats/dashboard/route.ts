import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { BACKUP_BUCKET } from '@/lib/backup';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/stats/dashboard — ตัวเลขทั้งหมดของหน้าภาพรวม (แอดมินเท่านั้น)
 *
 * Read with the service key on purpose: this is the whole shop's picture — every
 * customer's orders, wallets and top-ups — which RLS correctly hides from the
 * caller's own client. `requireAdmin()` is therefore the only gate, so it runs
 * first and nothing below it depends on user input.
 *
 * One endpoint rather than a dozen, because the dashboard wants a single
 * consistent snapshot: totals that disagree with each other because they were
 * fetched seconds apart are worse than slightly older numbers.
 */
const LOW_STOCK_THRESHOLD = 5;
const DAY_MS = 86_400_000;

/** ตัวเลขเงินที่มาจาก Postgres เป็น string เสมอ (numeric) */
const money = (value: unknown) => Number(value ?? 0);

export async function GET() {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const admin = createAdminClient();
    const now = Date.now();

    const [orders, products, wallets, topups, ledger, codes, audit, backups, users] =
      await Promise.all([
        admin.from('orders').select('id, total_amount, status, is_paid, created_at, user_id, items'),
        admin.from('products').select('id, name, price, stock, is_unlimited, is_service'),
        admin.from('wallets').select('balance'),
        admin.from('topups').select('amount, sending_bank, created_at'),
        admin.from('wallet_transactions').select('kind, amount, created_at'),
        admin.from('product_codes').select('id, is_sold'),
        admin
          .from('audit_logs')
          .select('id, action, summary, actor_email, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
        admin.storage.from(BACKUP_BUCKET).list('', { limit: 1, sortBy: { column: 'name', order: 'desc' } }),
        // ตัวเดียวกับที่หน้าผู้ใช้งานใช้ — ทุกแถวพก total_rows ของทั้งชุดมาด้วย
        admin.rpc('admin_list_users', { p_limit: 1, p_offset: 0 }),
      ]);

    const orderRows = orders.data ?? [];
    const paid = orderRows.filter((row) => row.is_paid);

    /** ยอดขายในช่วง N วันล่าสุด */
    const revenueSince = (days: number) =>
      paid
        .filter((row) => now - new Date(row.created_at).getTime() <= days * DAY_MS)
        .reduce((sum, row) => sum + money(row.total_amount), 0);

    // ── ยอดขายราย 6 เดือน (ของจริง ไม่ใช่ตัวเลขสมมติ) ────────────────────
    const months: { month: string; sales: number; orders: number }[] = [];
    const today = new Date();

    for (let back = 5; back >= 0; back -= 1) {
      const start = new Date(today.getFullYear(), today.getMonth() - back, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - back + 1, 1);
      const inMonth = paid.filter((row) => {
        const at = new Date(row.created_at);
        return at >= start && at < end;
      });

      months.push({
        month: start.toLocaleDateString('th-TH', { month: 'short' }),
        sales: inMonth.reduce((sum, row) => sum + money(row.total_amount), 0),
        orders: inMonth.length,
      });
    }

    // ── คำสั่งซื้อแยกตามสถานะ ─────────────────────────────────────────────
    const byStatus: Record<string, number> = {};
    for (const row of orderRows) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;

    // ── เงินเติมแยกตามช่องทาง (sending_bank คือช่องที่เงินเข้ามา) ─────────
    const topupRows = topups.data ?? [];
    const byChannel: Record<string, { count: number; amount: number }> = {};
    for (const row of topupRows) {
      const key = row.sending_bank || 'ไม่ระบุ';
      byChannel[key] ??= { count: 0, amount: 0 };
      byChannel[key].count += 1;
      byChannel[key].amount += money(row.amount);
    }

    const productRows = products.data ?? [];
    const codeRows = codes.data ?? [];
    const ledgerRows = ledger.data ?? [];

    // ── ขายดี: รวมจาก items ของคำสั่งซื้อที่จ่ายแล้ว ──────────────────────
    type Seller = { id: string; name: string; sold: number; revenue: number };
    const sellers: Record<string, Seller> = {};

    for (const order of paid) {
      const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];
      for (const item of items) {
        const id = String(item.product_id ?? item.productId ?? '');
        const name = String(item.name ?? 'ไม่ทราบชื่อ');
        const quantity = Number(item.quantity ?? 0);
        const unitPrice = money(item.unit_price ?? item.unitPrice);
        const key = id || name;

        sellers[key] ??= { id, name, sold: 0, revenue: 0 };
        sellers[key].sold += quantity;
        sellers[key].revenue += quantity * unitPrice;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          today: revenueSince(1),
          week: revenueSince(7),
          month: revenueSince(30),
          total: paid.reduce((sum, row) => sum + money(row.total_amount), 0),
          months,
        },
        orders: {
          total: orderRows.length,
          paid: paid.length,
          byStatus,
          // ยังไม่จบงาน = ยังต้องมีคนไปทำอะไรสักอย่าง
          openCount: orderRows.filter(
            (row) => row.status === 'รอดำเนินการ' || row.status === 'กำลังจัดเตรียม'
          ).length,
          buyers: new Set(orderRows.map((row) => row.user_id)).size,
        },
        wallet: {
          // หนี้ค้างของร้าน: เงินที่ลูกค้าเติมไว้แต่ยังไม่ได้ใช้
          liability: (wallets.data ?? []).reduce((sum, row) => sum + money(row.balance), 0),
          accounts: (wallets.data ?? []).length,
          spent: ledgerRows
            .filter((row) => row.kind === 'purchase')
            .reduce((sum, row) => sum + Math.abs(money(row.amount)), 0),
          refunded: ledgerRows
            .filter((row) => row.kind === 'refund')
            .reduce((sum, row) => sum + money(row.amount), 0),
        },
        topups: {
          count: topupRows.length,
          amount: topupRows.reduce((sum, row) => sum + money(row.amount), 0),
          today: topupRows
            .filter((row) => now - new Date(row.created_at).getTime() <= DAY_MS)
            .reduce((sum, row) => sum + money(row.amount), 0),
          byChannel,
        },
        catalogue: {
          products: productRows.length,
          lowStock: productRows
            .filter((row) => !row.is_unlimited && Number(row.stock) <= LOW_STOCK_THRESHOLD)
            .map((row) => ({ id: row.id, name: row.name, stock: Number(row.stock) })),
          // นับจากรายการในคำสั่งซื้อที่จ่ายแล้ว ไม่ใช่คอลัมน์สรุปที่ไม่มีอยู่จริง —
          // items เป็น snapshot ตอนสั่ง จึงนับสินค้าที่ถูกลบไปแล้วได้ด้วย
          topSellers: Object.values(sellers)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5),
          codes: {
            total: codeRows.length,
            available: codeRows.filter((row) => !row.is_sold).length,
          },
        },
        users: {
          total: Number(
            (users.data as { total_rows?: number }[] | null)?.[0]?.total_rows ?? 0
          ),
        },
        activity: (audit.data ?? []).map((row) => ({
          id: row.id,
          action: row.action,
          summary: row.summary,
          actorEmail: row.actor_email,
          createdAt: row.created_at,
        })),
        backup: {
          latest: backups.data?.[0]?.name ?? null,
          latestAt: backups.data?.[0]?.created_at ?? null,
        },
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
