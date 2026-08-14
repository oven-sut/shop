'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types/ecommerce';
import { X, CheckCircle2, Wallet as WalletIcon, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              {completedOrder ? 'สั่งซื้อสำเร็จ' : 'ยืนยันคำสั่งซื้อ'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {completedOrder ? 'ได้รับสินค้าแล้ว' : 'ตรวจสอบรายการและชำระเงิน'}
            </h2>
          </div>

          <button
            onClick={close}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!completedOrder ? (
          <div className="mt-6 space-y-5">
            {/* ยอดเงินในกระเป๋า */}
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                canAfford ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <span className="font-bold text-slate-900 block">ชำระด้วยยอดเงินในกระเป๋า</span>
                <span className="text-slate-500">
                  คงเหลือ{' '}
                  <strong className={canAfford ? 'text-emerald-600' : 'text-amber-700'}>
                    ฿{balance.toLocaleString()}
                  </strong>
                </span>
              </div>
              {!canAfford && (
                <Link
                  href="/wallet"
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition-colors shrink-0"
                >
                  เติมเงิน
                </Link>
              )}
            </div>

            {/* รายการสินค้า */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block mb-1">
                รายการสั่งซื้อ ({cart.length} รายการ)
              </span>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-slate-600">
                  <span className="truncate max-w-[260px]">
                    {item.product.name} x{item.quantity}
                  </span>
                  <span className="text-slate-900 font-medium">
                    ฿{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>รวมทั้งสิ้น</span>
                <span className="text-indigo-600">฿{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุถึงร้าน (ถ้ามี)
              </label>
              <Input
                type="text"
                placeholder="เช่น ต้องการใบเสร็จ"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                ออกใบสั่งซื้อในชื่อ {user?.email}
              </span>
              <Button
                onClick={handleConfirm}
                disabled={!canAfford || isPlacing || cart.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95 border-0 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isPlacing ? 'กำลังดำเนินการ...' : `ยืนยันและจ่าย ฿${cartTotal.toLocaleString()}`}
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">ชำระเงินเรียบร้อย</h3>
              <p className="text-xs text-slate-500 mt-1">
                หมายเลขคำสั่งซื้อ{' '}
                <span className="font-mono font-bold text-indigo-600">#{completedOrder.id}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดที่ชำระ</span>
                <span className="font-extrabold text-emerald-600">
                  ฿{completedOrder.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดคงเหลือในกระเป๋า</span>
                <span className="font-bold text-slate-900">฿{balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-800 flex items-center gap-2 text-left">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>ดูชื่อผู้ใช้ รหัสผ่าน และขอรหัส Steam Guard ได้ที่หน้าบัญชีเกมที่ซื้อไว้</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={close}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-bold text-xs py-3 rounded-xl"
              >
                เลือกซื้อต่อ
              </Button>
              <Link
                href="/orders"
                onClick={close}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl text-center transition-colors"
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
