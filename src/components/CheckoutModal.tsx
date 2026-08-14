'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types/ecommerce';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

/**
 * ยืนยันคำสั่งซื้อ
 *
 * สินค้าเป็นดิจิทัล ส่งมอบทันทีผ่านหน้า /orders จึงไม่มีขั้นตอนที่อยู่จัดส่ง
 * และไม่มีค่าจัดส่ง ชื่อกับอีเมลของผู้ซื้อดึงจากบัญชีที่ล็อกอินอยู่
 */
export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, cart, cartTotal, balance, createOrder } = useShop();
  const { user } = useAuth();

  const [note, setNote] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  if (!isCheckoutOpen) return null;

  const canAfford = balance >= cartTotal;

  const close = () => {
    setIsCheckoutOpen(false);
    setCompletedOrder(null);
    setNote('');
  };

  const handleConfirm = async () => {
    setIsPlacing(true);
    // เซิร์ฟเวอร์คิดราคาใหม่จากฐานข้อมูลและตัดเงินในทรานแซกชันเดียว
    // ถ้ายอดไม่พอหรือสต็อกหมดจะคืน null พร้อม toast บอกเหตุผล
    const order = await createOrder({
      name: user?.name ?? 'ลูกค้า',
      email: user?.email ?? '',
      note: note.trim() || undefined,
    });
    setIsPlacing(false);

    if (order) setCompletedOrder(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 overflow-y-auto">
      <div className="relative bg-white border border-neutral-200 rounded-md max-w-lg w-full p-6 sm:p-8 text-neutral-900 animate-in fade-in duration-150">
        <div className="flex items-start justify-between pb-5 border-b border-neutral-200">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">
              {completedOrder ? 'สั่งซื้อสำเร็จ' : 'ยืนยันคำสั่งซื้อ'}
            </span>
            <h2 className="text-xl font-bold text-neutral-900 mt-1 tracking-tight">
              {completedOrder ? 'ได้รับสินค้าแล้ว' : 'ตรวจสอบรายการและชำระเงิน'}
            </h2>
          </div>

          <button
            onClick={close}
            className="p-2 -mr-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!completedOrder ? (
          <div className="mt-6 space-y-5">
            {/* ยอดเงินในกระเป๋า — ยอดไม่พอเน้นด้วยเส้นขอบเข้ม ไม่ใช่สี */}
            <div
              className={`p-4 rounded-md border flex items-center gap-4 ${
                canAfford ? 'border-neutral-200' : 'border-neutral-900'
              }`}
            >
              <div className="flex-1 text-xs">
                <span className="font-semibold text-neutral-900 block">
                  ชำระด้วยยอดเงินในกระเป๋า
                </span>
                <span className="text-neutral-500">
                  คงเหลือ{' '}
                  <strong className="font-semibold text-neutral-900">
                    ฿{balance.toLocaleString()}
                  </strong>
                  {!canAfford && ' · ยอดไม่พอสำหรับคำสั่งซื้อนี้'}
                </span>
              </div>
              {!canAfford && (
                <Link
                  href="/wallet"
                  className="text-xs font-medium bg-neutral-900 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-md transition-colors shrink-0"
                >
                  เติมเงิน
                </Link>
              )}
            </div>

            {/* รายการสินค้า */}
            <div className="border border-neutral-200 rounded-md p-4 text-xs space-y-2">
              <span className="font-semibold text-neutral-900 block mb-2">
                รายการสั่งซื้อ ({cart.length} รายการ)
              </span>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between gap-3 text-neutral-500">
                  <span className="truncate">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="text-neutral-900 shrink-0">
                    ฿{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-neutral-200 pt-3 mt-3 flex justify-between font-bold text-base text-neutral-900">
                <span>รวมทั้งสิ้น</span>
                <span>฿{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                หมายเหตุถึงร้าน (ถ้ามี)
              </label>
              <Input
                type="text"
                placeholder="เช่น ต้องการใบเสร็จ"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 w-full bg-white border-neutral-300 rounded-md text-xs text-neutral-900"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-neutral-400 truncate">
                ออกใบสั่งซื้อในชื่อ {user?.email}
              </span>
              <Button
                onClick={handleConfirm}
                disabled={!canAfford || isPlacing || cart.length === 0}
                className="h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm px-6 rounded-md transition-colors border-0 disabled:opacity-40 shrink-0"
              >
                {isPlacing && <Spinner className="mr-2" />}
                {isPlacing ? 'กำลังดำเนินการ...' : `ยืนยันและจ่าย ฿${cartTotal.toLocaleString()}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-neutral-900 text-white mx-auto flex items-center justify-center">
              <Check className="w-7 h-7" strokeWidth={2.5} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-900 tracking-tight">ชำระเงินเรียบร้อย</h3>
              <p className="text-xs text-neutral-500 mt-1">
                หมายเลขคำสั่งซื้อ{' '}
                <span className="font-mono font-semibold text-neutral-900">
                  #{completedOrder.id}
                </span>
              </p>
            </div>

            <div className="border border-neutral-200 rounded-md p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">ยอดที่ชำระ</span>
                <span className="font-semibold text-neutral-900">
                  ฿{completedOrder.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">ยอดคงเหลือในกระเป๋า</span>
                <span className="font-semibold text-neutral-900">฿{balance.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 border-l-2 border-neutral-900 pl-3 text-left">
              ดูชื่อผู้ใช้ รหัสผ่าน และขอรหัส Steam Guard ได้ที่หน้าบัญชีเกมที่ซื้อไว้
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={close}
                className="flex-1 h-11 bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 font-medium text-sm rounded-md"
              >
                เลือกซื้อต่อ
              </Button>
              <Link
                href="/orders"
                onClick={close}
                className="flex-1 h-11 flex items-center justify-center bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md transition-colors"
              >
                ไปดูบัญชีเกมที่ได้
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
