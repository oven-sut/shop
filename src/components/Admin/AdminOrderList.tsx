'use client';

import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Order, OrderStatus } from '../../types/ecommerce';
import { Search, X, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const AdminOrderList: React.FC = () => {
  const { orders, updateOrderStatus } = useShop();

  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  const [search, setSearch] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer.phone.includes(search);
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="ค้นหาด้วยหมายเลขสั่งซื้อ, ชื่อลูกค้า หรือเบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ทั้งหมด', 'รอดำเนินการ', 'กำลังจัดเตรียม', 'จัดส่งแล้ว', 'สำเร็จ', 'ยกเลิก'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-xs text-slate-700">
            <TableHeader className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="p-3.5 text-slate-600">หมายเลขสั่งซื้อ</TableHead>
                <TableHead className="p-3.5 text-slate-600">ลูกค้า & ที่อยู่</TableHead>
                <TableHead className="p-3.5 text-slate-600">รายการที่สั่ง</TableHead>
                <TableHead className="p-3.5 text-slate-600">ยอดสุทธิ</TableHead>
                <TableHead className="p-3.5 text-slate-600">การชำระเงิน</TableHead>
                <TableHead className="p-3.5 text-slate-600">สถานะ</TableHead>
                <TableHead className="p-3.5 text-slate-600">เลข พัสดุ (Tracking)</TableHead>
                <TableHead className="p-3.5 text-right text-slate-600">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลคำสั่งซื้อที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="p-3.5 font-mono font-bold text-indigo-600">
                      #{ord.id}
                      <span className="block text-[10px] text-slate-400 font-sans">{ord.createdAt}</span>
                    </TableCell>

                    <TableCell className="p-3.5">
                      <span className="font-bold text-slate-900 block">{ord.customer.name}</span>
                      <span className="text-[10px] text-slate-500 block">{ord.customer.phone}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                        {ord.customer.province}
                      </span>
                    </TableCell>

                    <TableCell className="p-3.5">
                      <span className="font-semibold text-slate-800">
                        {ord.items.length} รายการ ({ord.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น)
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate max-w-[160px]">
                        {ord.items.map((i) => i.name).join(', ')}
                      </span>
                    </TableCell>

                    <TableCell className="p-3.5 font-bold text-emerald-600">
                      ฿{ord.totalAmount.toLocaleString()}
                    </TableCell>

                    <TableCell className="p-3.5">
                      <span className="uppercase text-[10px] font-mono text-slate-600 block">{ord.paymentMethod}</span>
                      <span className={`text-[10px] font-bold ${ord.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
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
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.status === 'จัดส่งแล้ว'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : ord.status === 'กำลังจัดเตรียม'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
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
                        <span className="font-mono text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200 text-indigo-700 block">
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
                            className="bg-slate-50 border-slate-200 rounded px-2 py-1 text-[10px] text-slate-900 w-24 h-7"
                          />
                          <Button
                            size="icon-xs"
                            onClick={() => handleTrackingSubmit(ord.id)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 border-0"
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
                        className="bg-slate-50 hover:bg-slate-100 text-indigo-600 border-slate-200 inline-flex items-center gap-1 text-[10px] font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="relative bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-indigo-600 font-mono font-bold">#{viewingOrder.id}</span>
                <h3 className="text-base font-bold text-slate-900">ใบเสร็จรับเงิน & รายละเอียดคำสั่งซื้อ</h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">ข้อมูลผู้รับสินค้า:</span>
                <p className="text-slate-900 font-semibold">{viewingOrder.customer.name} ({viewingOrder.customer.phone})</p>
                <p className="text-slate-500">
                  {viewingOrder.customer.address} {viewingOrder.customer.district} {viewingOrder.customer.province} {viewingOrder.customer.postalCode}
                </p>
                {viewingOrder.customer.note && (
                  <p className="text-amber-600 text-[11px] pt-1">หมายเหตุ: {viewingOrder.customer.note}</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">รายการสินค้า:</span>
                {viewingOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">฿{item.unitPrice.toLocaleString()} x {item.quantity}</span>
                    </div>
                    <span className="font-bold text-indigo-600">
                      ฿{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>ราคารวมสินค้า:</span>
                  <span>฿{viewingOrder.subtotal.toLocaleString()}</span>
                </div>
                {viewingOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ส่วนลด:</span>
                    <span>-฿{viewingOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ค่าจัดส่ง:</span>
                  <span>฿{viewingOrder.shippingFee}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>ยอดสุทธิทั้งสิ้น:</span>
                  <span className="text-emerald-600">฿{viewingOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setViewingOrder(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow border-0"
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
