'use client';

import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { CustomerInfo, PaymentMethod, Order } from '../types/ecommerce';
import { X, CheckCircle2, QrCode, CreditCard, Building2, Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    discountAmount,
    shippingFee,
    cartTotal,
    createOrder,
    showToast
  } = useShop();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: 'คุณสมชาย ใจดี',
    email: 'somchai@example.com',
    phone: '081-987-6543',
    address: '123/45 ถนนสุขุมวิท 21 แขวงคลองเตยเหนือ',
    district: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '10110',
    note: ''
  });

  if (!isCheckoutOpen) return null;

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.address || !customer.province || !customer.postalCode) {
      showToast('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน', 'warning');
      return;
    }
    setStep(2);
  };

  const handleConfirmPayment = () => {
    const order = createOrder(customer, paymentMethod);
    setCompletedOrder(order);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Steps Tracker */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              {step === 1 && 'ขั้นตอนที่ 1 จาก 3: ข้อมูลผู้รับ'}
              {step === 2 && 'ขั้นตอนที่ 2 จาก 3: ช่องทางชำระเงิน'}
              {step === 3 && 'คำสั่งซื้อสำเร็จ!'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {step === 1 && 'ที่อยู่จัดส่งสินค้า'}
              {step === 2 && 'ยืนยันและชำระเงิน'}
              {step === 3 && 'ขอบคุณสำหรับการสั่งซื้อ'}
            </h2>
          </div>

          <button
            onClick={() => {
              setIsCheckoutOpen(false);
              setStep(1);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CUSTOMER FORM */}
        {step === 1 && (
          <form onSubmit={handleNextToPayment} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้รับ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  required
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมลสำหรับรับใบเสร็จ
              </label>
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่ (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เขต/อำเภอ
                </label>
                <Input
                  type="text"
                  value={customer.district}
                  onChange={(e) => setCustomer({ ...customer, district: e.target.value })}
                  className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={customer.province}
                  onChange={(e) => setCustomer({ ...customer, province: e.target.value })}
                  className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสไปรษณีย์ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={customer.postalCode}
                  onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                  className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติมถึงคนส่งสินค้า
              </label>
              <Input
                type="text"
                placeholder="เช่น โทรบอกล่วงหน้า 15 นาที"
                value={customer.note}
                onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                ยอดรวมสุทธิ: <strong className="text-slate-900 text-sm">฿{cartTotal.toLocaleString()}</strong>
              </span>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 border-0"
              >
                <span>ถัดไป: เลือกวิธีชำระเงิน</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: PAYMENT METHOD & SUMMARY */}
        {step === 2 && (
          <div className="mt-6 space-y-6">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'promptpay', label: 'PromptPay QR', icon: QrCode },
                { id: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard },
                { id: 'bank_transfer', label: 'โอนผ่านธนาคาร', icon: Building2 },
                { id: 'cod', label: 'เก็บเงินปลายทาง', icon: Truck }
              ].map((method) => {
                const IconComp = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md shadow-indigo-600/10 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <IconComp className={`w-6 h-6 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs text-center">{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Method Details */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              {paymentMethod === 'promptpay' && (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center shrink-0">
                    <div className="bg-indigo-900 text-white text-[10px] font-bold px-3 py-1 rounded mb-2 uppercase tracking-widest">
                      PROMPTPAY QR
                    </div>
                    {/* Simulated PromptPay QR Graphic */}
                    <div className="w-36 h-36 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center text-white space-y-1">
                      <QrCode className="w-24 h-24 text-indigo-400" />
                      <span className="text-[9px] font-mono text-slate-400">SCAN TO PAY</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 mt-2">
                      ฿{cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <h4 className="font-bold text-slate-900 text-sm">สแกนจ่ายด้วยแอปธนาคารใดก็ได้</h4>
                    <p className="text-slate-500">
                      สแกน QR Code ด้วยแอปพลิเคชัน K PLUS, SCB EASY, Krungthai NEXT หรือแอปธนาคารชั้นนำ ยอดเงินจะตัดเข้าสู่ระบบทันทีแบบเรียลไทม์
                    </p>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] font-mono text-indigo-700 font-semibold">
                      PromptPay ID: 098-765-4321 (บริษัท นีโอ เทค จำกัด)
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">หมายเลขบัตรเครดิต / เดบิต</label>
                    <Input
                      type="text"
                      placeholder="1234 •••• •••• 5678"
                      className="w-full bg-white border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">วันหมดอายุ (MM/YY)</label>
                      <Input
                        type="text"
                        placeholder="12/28"
                        className="w-full bg-white border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">CVV</label>
                      <Input
                        type="password"
                        placeholder="•••"
                        className="w-full bg-white border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-900">โอนผ่านบัญชีธนาคารกสิกรไทย (KBANK)</p>
                  <p className="text-slate-500">เลขที่บัญชี: <strong className="font-mono text-indigo-700">012-3-45678-9</strong> (บจก. นีโอ เทค)</p>
                  <p className="text-slate-500">เมื่อโอนเรียบร้อย ระบบจะตรวจสอบสลิปการโอนเงินอัตโนมัติ</p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">เก็บเงินปลายทาง (Cash on Delivery)</p>
                  <p className="text-slate-500">ชำระเงินกับเจ้าหน้าที่จัดส่งพัสดุเมื่อได้รับสินค้าเรียบร้อย</p>
                </div>
              )}
            </div>

            {/* Order Items Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block mb-2">สรุปรายการคำสั่งซื้อ ({cart.length} ชิ้น)</span>
              {cart.map((ci) => (
                <div key={ci.product.id} className="flex justify-between text-slate-600">
                  <span className="truncate max-w-[240px]">{ci.product.name} x{ci.quantity}</span>
                  <span className="text-slate-900 font-medium">฿{(ci.product.price * ci.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>รวมทั้งสิ้น</span>
                <span className="text-indigo-600">฿{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline"
              >
                ย้อนกลับแก้ไขที่อยู่
              </button>
              <Button
                onClick={handleConfirmPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95 border-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันคำสั่งซื้อทันที</span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CONFIRMED */}
        {step === 3 && completedOrder && (
          <div className="mt-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">สั่งซื้อสินค้าสำเร็จ!</h3>
              <p className="text-xs text-slate-500 mt-1">
                หมายเลขคำสั่งซื้อของคุณคือ <span className="font-mono font-bold text-indigo-600">#{completedOrder.id}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">ผู้รับ:</span>
                <span className="font-bold text-slate-900">{completedOrder.customer.name} ({completedOrder.customer.phone})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">ที่อยู่จัดส่ง:</span>
                <span className="text-slate-700 text-right max-w-[280px]">
                  {completedOrder.customer.address} {completedOrder.customer.district} {completedOrder.customer.province} {completedOrder.customer.postalCode}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">ยอดชำระทั้งสิ้น:</span>
                <span className="font-extrabold text-emerald-600">฿{completedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-800">
              💡 ข้อมูลคำสั่งซื้อนี้ถูกส่งไปยัง <strong>ระบบหลังบ้าน (Admin Dashboard)</strong> เรียบร้อยแล้ว สามารถสลับไปดูสถานะในหน้า Admin ได้ทันที!
            </div>

            <Button
              onClick={() => {
                setIsCheckoutOpen(false);
                setStep(1);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg border-0"
            >
              เสร็จสิ้น / กลับสู่หน้าร้าน
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
