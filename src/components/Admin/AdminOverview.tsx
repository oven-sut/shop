'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  DatabaseBackup,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useShop } from '../../context/ShopContext';

/**
 * แดชบอร์ดภาพรวม — ตัวเลขทั้งหมดมาจาก `/api/stats/dashboard`
 *
 * Everything here is measured, not estimated. The previous version drew a
 * hard-coded sales curve and a "+18.4% จากเดือนที่แล้ว" that no data supported;
 * a dashboard that invents numbers is worse than one that shows none, because
 * decisions get made from it.
 */

interface Dashboard {
  revenue: {
    today: number;
    week: number;
    month: number;
    total: number;
    months: { month: string; sales: number; orders: number }[];
  };
  orders: {
    total: number;
    paid: number;
    byStatus: Record<string, number>;
    openCount: number;
    buyers: number;
  };
  wallet: { liability: number; accounts: number; spent: number; refunded: number };
  topups: { count: number; amount: number; today: number; byChannel: Record<string, { count: number; amount: number }> };
  catalogue: {
    products: number;
    lowStock: { id: string; name: string; stock: number }[];
    topSellers: { id: string; name: string; sold: number; revenue: number }[];
    codes: { total: number; available: number };
  };
  users: { total: number };
  activity: { id: string; action: string; summary: string; actorEmail: string | null; createdAt: string }[];
  backup: { latest: string | null; latestAt: string | null };
}

interface AdminOverviewProps {
  onNavigateToProducts: () => void;
  onNavigateToOrders: () => void;
}

const money = (value: number) => `฿${value.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNavigateToProducts,
  onNavigateToOrders,
}) => {
  const { showToast } = useShop();

  const [data, setData] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const load = async () => {
    const response = await fetch('/api/stats/dashboard');
    const body = await response.json().catch(() => ({}));
    if (body.success) setData(body.data as Dashboard);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const runBackup = async () => {
    setIsBackingUp(true);
    const response = await fetch('/api/backups', { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    setIsBackingUp(false);

    showToast(body.message || (body.success ? 'สำรองข้อมูลแล้ว' : 'สำรองข้อมูลไม่สำเร็จ'), body.success ? 'success' : 'warning');
    if (body.success) load();
  };

  if (isLoading) {
    return (
      <SkeletonRegion label="กำลังโหลดภาพรวม" className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-md" />
      </SkeletonRegion>
    );
  }

  if (!data) {
    return (
      <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600">
        โหลดข้อมูลภาพรวมไม่สำเร็จ — ลองรีเฟรชหน้าอีกครั้ง
      </p>
    );
  }

  const maxSales = Math.max(...data.revenue.months.map((month) => month.sales), 1);
  const channels = Object.entries(data.topups.byChannel).sort((a, b) => b[1].amount - a[1].amount);
  const statuses = Object.entries(data.orders.byStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* เงินเข้าจริง แยกตามช่วงเวลา */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Card className="bg-neutral-900 text-white border-neutral-900 p-4 sm:p-5 rounded-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">ยอดขายวันนี้</span>
            <DollarSign className="w-5 h-5 text-neutral-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mt-3">{money(data.revenue.today)}</h3>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            7 วัน {money(data.revenue.week)} · 30 วัน {money(data.revenue.month)}
          </span>
        </Card>

        <Card className="bg-white border-neutral-200 p-4 sm:p-5 rounded-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">ยอดขายรวมสุทธิ</span>
            <TrendingUp className="w-5 h-5 text-neutral-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
            {money(data.revenue.total)}
          </h3>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            จาก {data.orders.paid} คำสั่งซื้อที่จ่ายแล้ว
          </span>
        </Card>

        <Card className="bg-white border-neutral-200 p-4 sm:p-5 rounded-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">คำสั่งซื้อทั้งหมด</span>
            <ShoppingBag className="w-5 h-5 text-neutral-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
            {data.orders.total} รายการ
          </h3>
          <Button
            variant="link"
            onClick={onNavigateToOrders}
            className="text-[11px] text-neutral-900 p-0 h-auto font-semibold mt-1 flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5" />
            {data.orders.openCount} รายการยังไม่จบงาน
          </Button>
        </Card>

        {/* หนี้ค้าง ไม่ใช่รายได้ — เงินก้อนนี้เป็นของลูกค้าจนกว่าจะถูกใช้ */}
        <Card className="bg-white border-neutral-200 p-4 sm:p-5 rounded-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">เงินคงเหลือในกระเป๋าลูกค้า</span>
            <Wallet className="w-5 h-5 text-neutral-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
            {money(data.wallet.liability)}
          </h3>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {data.wallet.accounts} กระเป๋า · เป็นภาระที่ร้านต้องส่งของให้
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ยอดขาย 6 เดือนจากข้อมูลจริง */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm lg:col-span-2">
          <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-neutral-900 text-sm">ยอดขาย 6 เดือนล่าสุด</h3>
            <span className="text-[11px] text-neutral-400">นับเฉพาะคำสั่งซื้อที่จ่ายแล้ว</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-48 mt-5">
            {data.revenue.months.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <span className="text-[10px] text-neutral-500 truncate w-full text-center">
                  {month.sales > 0 ? money(month.sales) : ''}
                </span>
                <div
                  className="w-full bg-neutral-900 rounded-t-sm transition-all"
                  style={{ height: `${Math.max((month.sales / maxSales) * 100, 2)}%` }}
                  title={`${month.orders} คำสั่งซื้อ`}
                />
                <span className="text-[11px] text-neutral-500">{month.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* คำสั่งซื้อแยกตามสถานะ */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm">
          <h3 className="font-bold text-neutral-900 text-sm border-b border-neutral-100 pb-3">
            สถานะคำสั่งซื้อ
          </h3>
          {statuses.length === 0 ? (
            <p className="text-xs text-neutral-400 py-8 text-center">ยังไม่มีคำสั่งซื้อ</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {statuses.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600">{status}</span>
                  <span className="font-semibold text-neutral-900">{count}</span>
                </li>
              ))}
              <li className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                <span className="text-neutral-500">ลูกค้าที่เคยสั่งซื้อ</span>
                <span className="font-semibold text-neutral-900">{data.orders.buyers} คน</span>
              </li>
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ขายดี */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm">
          <h3 className="font-bold text-neutral-900 text-sm border-b border-neutral-100 pb-3">
            ขายดี 5 อันดับ
          </h3>
          {data.catalogue.topSellers.length === 0 ? (
            <p className="text-xs text-neutral-400 py-8 text-center">ยังไม่มียอดขาย</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {data.catalogue.topSellers.map((product, index) => (
                <li key={product.id || product.name} className="flex items-center gap-3 text-xs">
                  <span className="text-neutral-400 w-3">{index + 1}</span>
                  <span className="flex-1 min-w-0 truncate text-neutral-900">{product.name}</span>
                  <span className="text-neutral-500 shrink-0">{product.sold} ชิ้น</span>
                  <span className="font-semibold text-neutral-900 shrink-0 w-20 text-right">
                    {money(product.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* เติมเงินแยกช่องทาง */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm">
          <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-neutral-900 text-sm">เงินเติมเข้า</h3>
            <span className="text-[11px] text-neutral-400">วันนี้ {money(data.topups.today)}</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 mt-3">{money(data.topups.amount)}</p>
          <span className="text-[11px] text-neutral-500">{data.topups.count} รายการทั้งหมด</span>

          {channels.length > 0 && (
            <ul className="mt-3 space-y-2 pt-3 border-t border-neutral-100">
              {channels.map(([channel, info]) => (
                <li key={channel} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-neutral-600 truncate">{channel}</span>
                  <span className="text-neutral-900 font-semibold shrink-0">
                    {money(info.amount)}{' '}
                    <span className="text-neutral-400 font-normal">({info.count})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* คลังและสต็อก */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm">
          <h3 className="font-bold text-neutral-900 text-sm border-b border-neutral-100 pb-3">
            คลังสินค้า
          </h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-neutral-500">สินค้าในร้าน</dt>
              <dd className="font-semibold text-neutral-900">{data.catalogue.products} รายการ</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">รหัสในคลัง (ยังไม่ขาย)</dt>
              <dd className="font-semibold text-neutral-900">
                {data.catalogue.codes.available} / {data.catalogue.codes.total}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">ผู้ใช้ทั้งหมด</dt>
              <dd className="font-semibold text-neutral-900 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                {data.users.total} คน
              </dd>
            </div>
          </dl>

          {data.catalogue.lowStock.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                <AlertTriangle className="w-3.5 h-3.5" />
                สต็อกต่ำ {data.catalogue.lowStock.length} รายการ
              </div>
              <ul className="mt-2 space-y-1">
                {data.catalogue.lowStock.slice(0, 4).map((product) => (
                  <li key={product.id} className="flex justify-between text-[11px] gap-2">
                    <span className="text-neutral-600 truncate">{product.name}</span>
                    <span className="text-neutral-900 font-semibold shrink-0">
                      เหลือ {product.stock}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant="link"
                onClick={onNavigateToProducts}
                className="text-[11px] text-neutral-900 p-0 h-auto font-semibold mt-2 flex items-center gap-0.5"
              >
                <span>ไปเติมสต็อก</span>
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ความเคลื่อนไหวล่าสุดจากบันทึกระบบ */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm lg:col-span-2">
          <h3 className="font-bold text-neutral-900 text-sm border-b border-neutral-100 pb-3">
            ความเคลื่อนไหวล่าสุดในระบบ
          </h3>
          {data.activity.length === 0 ? (
            <p className="text-xs text-neutral-400 py-8 text-center">ยังไม่มีบันทึก</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {data.activity.map((event) => (
                <li key={event.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="text-neutral-900 block truncate">{event.summary}</span>
                    <span className="text-[11px] text-neutral-400">
                      {event.action} · {event.actorEmail ?? 'ระบบ'}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    {when(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* สำรองข้อมูล */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <DatabaseBackup className="w-4 h-4 text-neutral-900" />
            <h3 className="font-bold text-neutral-900 text-sm">สำรองข้อมูล</h3>
          </div>

          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500 shrink-0">ล่าสุด</dt>
              <dd className="font-semibold text-neutral-900 text-right truncate">
                {when(data.backup.latestAt)}
              </dd>
            </div>
            {data.backup.latest && (
              <div className="text-[11px] text-neutral-400 font-mono break-all">
                {data.backup.latest}
              </div>
            )}
          </dl>

          {!data.backup.latest && (
            <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
              ยังไม่มีไฟล์สำรอง — ตั้งตัวจับเวลาให้ยิง <code>/api/cron/backup/&lt;secret&gt;</code>{' '}
              วันละครั้ง (ดู README)
            </p>
          )}

          <Button
            type="button"
            onClick={runBackup}
            disabled={isBackingUp}
            className="w-full h-9 mt-3 bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-semibold rounded-md border-0 disabled:opacity-40"
          >
            {isBackingUp && <Spinner className="mr-2" />}
            {isBackingUp ? 'กำลังสำรอง...' : 'สำรองเดี๋ยวนี้'}
          </Button>
        </Card>
      </div>
    </div>
  );
};
