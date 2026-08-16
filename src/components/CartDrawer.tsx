'use client';

import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    discountAmount,
    cartTotal,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen
  } = useShop();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    setCouponError('');

    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/50"
        onClick={() => setIsCartOpen(false)}
      />

      {/* The 40px strip of backdrop left of the drawer is a comfortable way out
          with a mouse and a waste of a third of the room on a phone, where the
          close button is the way out anyway. */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-200 text-neutral-900 flex flex-col justify-between animate-in slide-in-from-right duration-200">

          {/* Drawer Header */}
          <div className="px-4 sm:px-5 h-16 border-b border-neutral-200 flex items-center justify-between shrink-0">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-neutral-900">ตะกร้าสินค้า</h2>
              <span className="text-xs text-neutral-400">
                {cart.reduce((s, i) => s + i.quantity, 0)} รายการ
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 -mr-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Item List */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 space-y-4">
                <h3 className="font-semibold text-neutral-900 text-base">ตะกร้าของคุณยังว่างอยู่</h3>
                <p className="text-xs text-neutral-500 max-w-xs">
                  เลือกชมสินค้าหลากหลายรายการ และเพิ่มไอเทมที่คุณชื่นชอบลงในตะกร้าได้เลย
                </p>
                <Button
                  onClick={() => setIsCartOpen(false)}
                  className="h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-sm px-5 rounded-md transition-colors border-0"
                >
                  เลือกช้อปสินค้าตอนนี้
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex gap-3 sm:gap-3.5 p-4 sm:p-5 items-start">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md border border-neutral-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-900 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <span className="text-xs text-neutral-400 block mt-0.5">
                        ฿{item.product.price.toLocaleString()} / ชิ้น
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-neutral-200 rounded-md">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                            className="px-2 py-1 text-neutral-400 hover:text-neutral-900 transition-colors"
                            aria-label="ลดจำนวน"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                            className="px-2 py-1 text-neutral-400 hover:text-neutral-900 transition-colors"
                            aria-label="เพิ่มจำนวน"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-neutral-300 hover:text-neutral-900 transition-colors"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-neutral-900 shrink-0">
                      ฿{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Drawer Footer Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-200 space-y-4 shrink-0">
              {/* Coupon Input Form */}
              {activeCoupon ? (
                <div className="flex items-center justify-between border border-neutral-900 rounded-md px-3 py-2.5 text-xs">
                  <span className="text-neutral-900">
                    ใช้โค้ด <strong className="font-mono font-semibold">{activeCoupon.code}</strong>{' '}
                    · ลด {activeCoupon.discountPercent}%
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-400 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="กรอกโค้ดส่วนลด"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="h-10 flex-1 bg-white border-neutral-300 rounded-md text-xs text-neutral-900 placeholder-neutral-400"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-10 bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-xs px-4 rounded-md border-neutral-300"
                    >
                      ใช้โค้ด
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-neutral-500 border-l-2 border-neutral-900 pl-2">
                      {couponError}
                    </p>
                  )}
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-neutral-500 border-t border-neutral-100 pt-4">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า</span>
                  <span className="text-neutral-900">฿{cartSubtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>ส่วนลด</span>
                    <span className="text-neutral-900">-฿{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline text-base font-bold text-neutral-900 border-t border-neutral-200 pt-3 mt-1">
                  <span>ยอดชำระสุทธิ</span>
                  <span>฿{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full h-12 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md transition-colors flex items-center justify-center gap-2 border-0"
              >
                <span>ดำเนินการสั่งซื้อ</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>ชำระเงินปลอดภัยด้วยระบบการเงินมาตรฐานสากล</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
