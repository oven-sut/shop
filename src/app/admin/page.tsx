'use client';

import React, { useState } from 'react';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { AdminHeader } from '../../components/Admin/AdminHeader';
import { AdminOverview } from '../../components/Admin/AdminOverview';
import { AdminProductList } from '../../components/Admin/AdminProductList';
import { AdminOrderList } from '../../components/Admin/AdminOrderList';
import { AdminAnalytics } from '../../components/Admin/AdminAnalytics';
import { AdminSupplier } from '../../components/Admin/AdminSupplier';
import { ToastContainer } from '../../components/ToastContainer';
import { Settings, Save, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingBlock, Spinner } from '@/components/ui/spinner';
import {
  PROMPTPAY_KIND_LABEL,
  PROMPTPAY_SHAPE_HINT,
  readPromptPayTarget,
} from '../../lib/promptpay-id';
import { StoreSettings } from '../../lib/settings';

/**
 * Rendered only once the settings row has loaded, so seeding the form from props
 * at mount is enough — no effect needed to refill it later.
 */
function StoreSettingsPanel() {
  const { settings, saveSettings, showToast } = useShop();

  const [form, setForm] = useState<StoreSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Whether the number being typed can also be handed out as a QR. */
  const promptpay = readPromptPayTarget(form.topupReceiverAccount);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveSettings(form);
    setIsSaving(false);
    showToast(result.message, result.success ? 'success' : 'warning');
  };

  return (
    <div className="bg-white border border-neutral-200 p-6 rounded-md max-w-2xl mx-auto space-y-6 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <Settings className="w-6 h-6 text-neutral-900" />
              <div>
                <h2 className="text-lg font-bold text-neutral-900">ตั้งค่าระบบร้านค้า (Store Settings)</h2>
                <p className="text-xs text-neutral-500">ชื่อร้าน บัญชีรับเงินเติม และเงื่อนไขการสั่งซื้อ</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">ชื่อร้านค้า</label>
                <Input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => update('storeName', e.target.value)}
                  className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
                />
              </div>

              {/* Top-up destination */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">บัญชีรับเงินเติม</span>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  ระบบจะเทียบผู้รับในสลิปกับค่านี้ก่อนเติมเงินให้ลูกค้า ถ้าเว้นว่างทั้งคู่จะเติมเงินไม่ได้เลย
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ชื่อบัญชี</label>
                    <Input
                      type="text"
                      placeholder="เช่น นายสมชาย ใจดี"
                      value={form.topupReceiverName}
                      onChange={(e) => update('topupReceiverName', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      เลขบัญชี / พร้อมเพย์
                    </label>
                    <Input
                      type="text"
                      placeholder="เช่น 012-3-45678-9"
                      value={form.topupReceiverAccount}
                      onChange={(e) => update('topupReceiverAccount', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900 font-mono"
                    />
                    {/* Only a PromptPay ID can be drawn as a QR, so say which of
                        the two this value is before the customer finds out. */}
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                      {!form.topupReceiverAccount.trim()
                        ? `กรอกเป็นพร้อมเพย์เพื่อให้ลูกค้าสแกน QR จ่ายได้ — ${PROMPTPAY_SHAPE_HINT}`
                        : promptpay
                          ? `ลูกค้าสแกน QR จ่ายได้ (${PROMPTPAY_KIND_LABEL[promptpay.kind]})`
                          : `เลขนี้ใช้รับโอน + ตรวจสลิปได้ แต่สร้าง QR ให้ลูกค้าไม่ได้ — ${PROMPTPAY_SHAPE_HINT}`}
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ธนาคาร</label>
                    <Input
                      type="text"
                      placeholder="เช่น กสิกรไทย"
                      value={form.topupBankName}
                      onChange={(e) => update('topupBankName', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      สลิปเก่าได้ไม่เกิน (วัน)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={form.topupMaxSlipAgeDays}
                      onChange={(e) => update('topupMaxSlipAgeDays', Number(e.target.value))}
                      className="w-full bg-white border-neutral-200 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">เติมขั้นต่ำ (฿)</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.topupMinAmount}
                      onChange={(e) => update('topupMinAmount', Number(e.target.value))}
                      className="w-full bg-white border-neutral-200 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">เติมสูงสุด (฿)</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.topupMaxAmount}
                      onChange={(e) => update('topupMaxAmount', Number(e.target.value))}
                      className="w-full bg-white border-neutral-200 text-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">VAT (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.taxRate}
                  onChange={(e) => update('taxRate', Number(e.target.value))}
                  className="w-full sm:max-w-[200px] bg-neutral-50 border-neutral-200 text-neutral-900"
                />
              </div>

              <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 block">สถานะเปิด/ปิดรับคำสั่งซื้อ</span>
                  <span className="text-neutral-500 text-[11px]">
                    ปิดแล้วลูกค้าจะสั่งซื้อไม่ได้ (ตรวจที่ฝั่งเซิร์ฟเวอร์)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => update('isOpen', !form.isOpen)}
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                    form.isOpen ? 'bg-neutral-900 text-white' : 'bg-neutral-900 text-white'
                  }`}
                >
                  {form.isOpen ? 'เปิดร้านปกติ' : 'ปิดปรับปรุง'}
                </button>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-neutral-900 hover:bg-neutral-700 text-white font-bold text-xs px-6 py-3 rounded-md transition-all flex items-center gap-2 border-0 disabled:opacity-50"
                >
                  {isSaving ? <Spinner /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
                </Button>
              </div>
      </form>
    </div>
  );
}

function AdminContent() {
  const { isLoading } = useShop();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'supplier' | 'orders' | 'analytics' | 'settings'
  >('overview');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      <ToastContainer />
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'overview' && (
          <AdminOverview
            onNavigateToProducts={() => setActiveTab('products')}
            onNavigateToOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'products' && <AdminProductList />}

        {activeTab === 'supplier' && <AdminSupplier />}

        {activeTab === 'orders' && <AdminOrderList />}

        {activeTab === 'analytics' && <AdminAnalytics />}

        {activeTab === 'settings' &&
          (isLoading ? (
            <LoadingBlock label="กำลังโหลดการตั้งค่า..." />
          ) : (
            <StoreSettingsPanel />
          ))}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ShopProvider>
      <AdminContent />
    </ShopProvider>
  );
}
