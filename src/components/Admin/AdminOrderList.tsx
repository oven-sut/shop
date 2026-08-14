'use client';

import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Order, OrderStatus } from '../../types/ecommerce';
import { Search, X, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminOrderList: React.FC = () => {
  const { orders, isLoading, updateOrderStatus } = useShop();

  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  const [search, setSearch] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (ord.customer.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTrackingSubmit = (orderId: string) => {
    const tracking = trackingInputs[orderId];
    if (!tracking) return;
    updateOrderStatus(orderId, 'จัดส่งแล้ว', tracking);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-md shadow-sm">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="ค้นหาด้วยหมายเลขสั่งซื้อ ชื่อ หรืออีเมลลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-50 border-neutral-200 rounded-md py-2 pl-9 pr-4 text-xs text-neutral-900 placeholder-neutral-400"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ทั้งหมด', 'รอดำเนินการ', 'กำลังจัดเตรียม', 'จัดส่งแล้ว', 'สำเร็จ', 'ยกเลิก'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-xs text-neutral-700">
            <TableHeader className="bg-neutral-50 text-neutral-600 uppercase font-semibold">
              <TableRow className="border-b border-neutral-200 hover:bg-transparent">
                <TableHead className="p-3.5 text-neutral-600">หมายเลขสั่งซื้อ</TableHead>
                <TableHead className="p-3.5 text-neutral-600">ลูกค้า</TableHead>
                <TableHead className="p-3.5 text-neutral-600">รายการที่สั่ง</TableHead>
                <TableHead className="p-3.5 text-neutral-600">ยอดสุทธิ</TableHead>
                <TableHead className="p-3.5 text-neutral-600">การชำระเงิน</TableHead>
                <TableHead className="p-3.5 text-neutral-600">สถานะ</TableHead>
                <TableHead className="p-3.5 text-neutral-600">เลข พัสดุ (Tracking)</TableHead>
                <TableHead className="p-3.5 text-right text-neutral-600">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index} className="border-b border-neutral-100">
                    {Array.from({ length: 8 }, (_, cell) => (
                      <TableCell key={cell} className="p-3.5">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-neutral-400">
                    ไม่พบข้อมูลคำสั่งซื้อที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id} className="hover:bg-neutral-50 border-b border-neutral-100">
                    <TableCell className="p-3.5 font-mono font-bold text-neutral-900">
                      #{ord.id}
                      <span className="block text-[10px] text-neutral-400 font-sans">{ord.createdAt}</span>
                    </TableCell>

                    <TableCell className="p-3.5">
                      <span className="font-bold text-neutral-900 block">{ord.customer.name}</span>
                      <span className="text-[10px] text-neutral-500 truncate max-w-[180px] block">
                        {ord.customer.email}
                      </span>
                    </TableCell>

                    <TableCell className="p-3.5">
                      <span className="font-semibold text-neutral-800">
                        {ord.items.length} รายการ ({ord.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น)
                      </span>
                      <span className="block text-[10px] text-neutral-400 truncate max-w-[160px]">
                        {ord.items.map((i) => i.name).join(', ')}
                      </span>
                    </TableCell>

                    <TableCell className="p-3.5 font-bold text-neutral-900">
                      ฿{ord.totalAmount.toLocaleString()}
                    </TableCell>

                    <TableCell className="p-3.5">
                      <span className="uppercase text-[10px] font-mono text-neutral-600 block">{ord.paymentMethod}</span>
                      <span className={`text-[10px] font-bold ${ord.isPaid ? 'text-neutral-900' : 'text-neutral-900'}`}>
                        {ord.isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
                      </span>
                    </TableCell>

                    {/* Status dropdown selector */}
                    <TableCell className="p-3.5">
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          ord.status === 'สำเร็จ'
                            ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                            : ord.status === 'จัดส่งแล้ว'
                            ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                            : ord.status === 'กำลังจัดเตรียม'
                            ? 'bg-neutral-50 text-neutral-700 border-neutral-400'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <option value="รอดำเนินการ">รอดำเนินการ</option>
                        <option value="กำลังจัดเตรียม">กำลังจัดเตรียม</option>
                        <option value="จัดส่งแล้ว">จัดส่งแล้ว</option>
                        <option value="สำเร็จ">สำเร็จ</option>
                        <option value="ยกเลิก">ยกเลิก</option>
                      </select>
                    </TableCell>

                    {/* Tracking Number Input */}
                    <TableCell className="p-3.5">
                      {ord.trackingNumber ? (
                        <span className="font-mono text-[11px] bg-neutral-50 px-2 py-1 rounded border border-neutral-200 text-neutral-700 block">
                          {ord.trackingNumber}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            placeholder="กรอกเลขพัสดุ..."
                            value={trackingInputs[ord.id] || ''}
                            onChange={(e) =>
                              setTrackingInputs({ ...trackingInputs, [ord.id]: e.target.value })
                            }
                            className="bg-neutral-50 border-neutral-200 rounded px-2 py-1 text-[10px] text-neutral-900 w-24 h-7"
                          />
                          <Button
                            size="icon-xs"
                            onClick={() => handleTrackingSubmit(ord.id)}
                            className="bg-neutral-900 text-white hover:bg-neutral-700 border-0"
                            title="บันทึกและเปลี่ยนสถานะเป็นจัดส่ง"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    {/* Receipt Viewer Action */}
                    <TableCell className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setViewingOrder(ord)}
                        className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 inline-flex items-center gap-1 text-[10px] font-bold"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ใบเสร็จ</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Receipt Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div
            className="relative bg-white border border-neutral-200 rounded-md max-w-lg w-full p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs text-neutral-900 font-mono font-bold">#{viewingOrder.id}</span>
                <h3 className="text-base font-bold text-neutral-900">ใบเสร็จรับเงิน & รายละเอียดคำสั่งซื้อ</h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="bg-neutral-50 p-3.5 rounded-md border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-700 block">ผู้สั่งซื้อ:</span>
                <p className="text-neutral-900 font-semibold">{viewingOrder.customer.name}</p>
                <p className="text-neutral-500">{viewingOrder.customer.email}</p>
                {viewingOrder.customer.note && (
                  <p className="text-neutral-900 text-[11px] pt-1">หมายเหตุ: {viewingOrder.customer.note}</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="font-bold text-neutral-700 block">รายการสินค้า:</span>
                {viewingOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div>
                      <span className="font-bold text-neutral-900 block">{item.name}</span>
                      <span className="text-[10px] text-neutral-400">฿{item.unitPrice.toLocaleString()} x {item.quantity}</span>
                    </div>
                    <span className="font-bold text-neutral-900">
                      ฿{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-100 pt-3 space-y-1 text-neutral-600">
                <div className="flex justify-between">
                  <span>ราคารวมสินค้า:</span>
                  <span>฿{viewingOrder.subtotal.toLocaleString()}</span>
                </div>
                {viewingOrder.discount > 0 && (
                  <div className="flex justify-between text-neutral-900">
                    <span>ส่วนลด:</span>
                    <span>-฿{viewingOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>ยอดสุทธิทั้งสิ้น:</span>
                  <span className="text-neutral-900">฿{viewingOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setViewingOrder(null)}
                className="bg-neutral-900 hover:bg-neutral-700 text-white font-bold text-xs px-5 py-2.5 rounded-md shadow border-0"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
