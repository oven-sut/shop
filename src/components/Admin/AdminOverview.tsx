'use client';

import React from 'react';
import { useShop } from '../../context/ShopContext';
import { DollarSign, ShoppingBag, Package, AlertTriangle, ArrowUpRight, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AdminOverviewProps {
  onNavigateToProducts: () => void;
  onNavigateToOrders: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNavigateToProducts,
  onNavigateToOrders
}) => {
  const { products, orders, updateOrderStatus } = useShop();

  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.isPaid ? ord.totalAmount : 0), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  const pendingOrders = orders.filter((o) => o.status === 'รอดำเนินการ' || o.status === 'กำลังจัดเตรียม');

  // Chart data simulation based on real order values
  const monthlySales = [
    { month: 'ม.ค.', sales: 45000 },
    { month: 'ก.พ.', sales: 52000 },
    { month: 'มี.ค.', sales: 61000 },
    { month: 'เม.ย.', sales: 58000 },
    { month: 'พ.ค.', sales: 74000 },
    { month: 'มิ.ย.', sales: 89000 },
    { month: 'ก.ค.', sales: 95000 },
    { month: 'ส.ค.', sales: totalRevenue || 112000 }
  ];

  const maxSales = Math.max(...monthlySales.map((m) => m.sales));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Overview Stats Cards using shadcn UI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">ยอดขายรวมสุทธิ</span>
            <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-neutral-900">
              ฿{totalRevenue.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-neutral-900 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% จากเดือนที่แล้ว</span>
            </div>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">คำสั่งซื้อทั้งหมด</span>
            <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-neutral-900">
              {totalOrdersCount} รายการ
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-neutral-900 font-semibold mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingOrders.length} รายการรอดำเนินการ</span>
            </div>
          </div>
        </Card>

        {/* Total Products */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">รายการสินค้าในร้าน</span>
            <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-neutral-900">
              {totalProductsCount} รายการ
            </h3>
            <span className="text-[11px] text-neutral-500 mt-1 block">พร้อมวางจำหน่ายหน้าร้าน</span>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card className="bg-white border-neutral-200 p-5 rounded-md relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">สินค้าสต็อกต่ำ (&le; 5)</span>
            <div className="w-10 h-10 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-neutral-900">
              {lowStockProducts.length} รายการ
            </h3>
            <Button
              variant="link"
              onClick={onNavigateToProducts}
              className="text-[11px] text-neutral-900 p-0 h-auto font-semibold mt-1 flex items-center gap-0.5"
            >
              <span>ดูรายการเพื่อเติมสต็อก</span>
              <ArrowUpRight className="w-3 h-3" />
            </Button>
          </div>
        </Card>

      </div>

      {/* Sales Trend Bar Chart */}
      <Card className="bg-white border-neutral-200 p-6 rounded-md space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">แนวโน้มยอดขายรายเดือน (Sales Growth)</h3>
            <p className="text-xs text-neutral-500">ภาพรวมสถิติรายได้การจำหน่ายสินค้าไอที</p>
          </div>
          <Badge variant="outline" className="text-xs text-neutral-900 font-semibold bg-neutral-100 px-3 py-1 rounded-full border-neutral-300">
            ปี 2026
          </Badge>
        </div>

        <div className="h-48 flex items-end justify-between gap-2 pt-6">
          {monthlySales.map((item, idx) => {
            const heightPct = Math.round((item.sales / maxSales) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity">
                  ฿{item.sales.toLocaleString()}
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full bg-neutral-300 group-hover:bg-neutral-900 transition-colors"
                />

                <span className="text-[11px] text-neutral-500 font-medium">{item.month}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Orders Section using shadcn Table */}
      <Card className="bg-white border-neutral-200 p-6 rounded-md space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">คำสั่งซื้อล่าสุด (Recent Orders)</h3>
            <p className="text-xs text-neutral-500">รายการสั่งซื้อที่ลูกค้ารายการล่าสุดกดสั่งซื้อเข้ามา</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToOrders}
            className="text-xs text-neutral-900 hover:text-neutral-700 font-semibold flex items-center gap-1 bg-neutral-50 border-neutral-200"
          >
            <span>ดูทั้งหมด ({orders.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-neutral-200">
          <Table className="w-full text-left text-xs text-neutral-700">
            <TableHeader className="bg-neutral-50 text-neutral-500 uppercase font-semibold">
              <TableRow className="border-b border-neutral-200 hover:bg-transparent">
                <TableHead className="p-3 text-neutral-600">หมายเลขคำสั่งซื้อ</TableHead>
                <TableHead className="p-3 text-neutral-600">ชื่อลูกค้า</TableHead>
                <TableHead className="p-3 text-neutral-600">วันที่/เวลา</TableHead>
                <TableHead className="p-3 text-neutral-600">ยอดชำระ</TableHead>
                <TableHead className="p-3 text-neutral-600">วิธีชำระ</TableHead>
                <TableHead className="p-3 text-neutral-600">สถานะ</TableHead>
                <TableHead className="p-3 text-right text-neutral-600">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100">
              {orders.slice(0, 5).map((ord) => (
                <TableRow key={ord.id} className="hover:bg-neutral-50 border-b border-neutral-100">
                  <TableCell className="p-3 font-mono font-bold text-neutral-900">#{ord.id}</TableCell>
                  <TableCell className="p-3 font-semibold text-neutral-900">{ord.customer.name}</TableCell>
                  <TableCell className="p-3 text-neutral-500">{ord.createdAt}</TableCell>
                  <TableCell className="p-3 font-bold text-neutral-900">฿{ord.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="p-3 uppercase text-[10px] font-mono text-neutral-500">{ord.paymentMethod}</TableCell>
                  <TableCell className="p-3">
                    <Badge
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border-0 ${
                        ord.status === 'สำเร็จ'
                          ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                          : ord.status === 'จัดส่งแล้ว'
                          ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                          : ord.status === 'กำลังจัดเตรียม'
                          ? 'bg-neutral-50 text-neutral-700 border border-neutral-400'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {ord.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    {ord.status !== 'สำเร็จ' && ord.status !== 'จัดส่งแล้ว' && (
                      <Button
                        size="xs"
                        onClick={() => updateOrderStatus(ord.id, 'จัดส่งแล้ว', `TH${Math.floor(10000000 + Math.random() * 90000000)}TH`)}
                        className="bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-[10px] border-0"
                      >
                        เปลี่ยนเป็นจัดส่งแล้ว
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
};
