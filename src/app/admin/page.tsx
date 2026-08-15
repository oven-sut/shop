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
import Link from 'next/link';
import {
  Image as ImageIcon,
  Megaphone,
  MessageCircle,
  Save,
  Settings,
  ToggleLeft,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingBlock, Spinner } from '@/components/ui/spinner';
import {
  PROMPTPAY_KIND_LABEL,
  PROMPTPAY_SHAPE_HINT,
  readPromptPayTarget,
} from '../../lib/promptpay-id';
import { StoreSettings } from '../../lib/settings';
import { CONTACT_CHANNELS } from '../../lib/contact';
import { TOPUP_CHANNELS } from '../../lib/topup-channels';
import { NAV_LINKS } from '../../lib/nav-links';

/**
 * Rendered only once the settings row has loaded, so seeding the form from props
 * at mount is enough — no effect needed to refill it later.
 */
function StoreSettingsPanel() {
  const { settings, saveSettings, showToast, uploadProductImage } = useShop();

  const [form, setForm] = useState<StoreSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Whether the number being typed can also be handed out as a QR. */
  const promptpay = readPromptPayTarget(form.topupPromptpayId);

  /** TrueMoney redeems into a mobile number, nothing else. */
  const truemoneyReady = /^0\d{9}$/.test(form.topupTruemoneyPhone.replace(/\D/g, ''));

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveSettings(form);
    setIsSaving(false);
    showToast(result.message, result.success ? 'success' : 'warning');
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    const url = await uploadProductImage(file);
    setIsUploadingBanner(false);

    if (url) update('heroBannerImage', url);
    e.target.value = '';
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

              {/* Hero image banner — topmost of the homepage */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">แบนเนอร์รูปภาพบนสุดของหน้าแรก</span>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  ไม่อัปโหลดรูป = ไม่แสดงแบนเนอร์ อัตราส่วนรูปกว้างจะแสดงผลได้ดีที่สุด
                </p>

                <div className="flex items-start gap-3">
                  <div className="w-24 h-16 shrink-0 rounded-md border border-neutral-200 bg-white overflow-hidden flex items-center justify-center">
                    {form.heroBannerImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.heroBannerImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                      disabled={isUploadingBanner}
                      onChange={handleBannerUpload}
                      className="w-full text-[11px] text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-neutral-700 file:font-bold file:text-[11px] hover:file:bg-neutral-200 cursor-pointer"
                    />
                    <Input
                      type="url"
                      placeholder="หรือวาง URL รูปภาพ"
                      value={form.heroBannerImage}
                      onChange={(e) => update('heroBannerImage', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ลิงก์เมื่อคลิกแบนเนอร์ (ถ้ามี)
                  </label>
                  <Input
                    type="text"
                    placeholder="เช่น /wallet หรือ https://..."
                    value={form.heroBannerLink}
                    onChange={(e) => update('heroBannerLink', e.target.value)}
                    className="w-full bg-white border-neutral-200 text-neutral-900"
                  />
                </div>
              </div>

              {/* Homepage announcement banner */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-neutral-900" />
                    <span className="font-bold text-neutral-900">แถบประกาศหน้าแรก</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.announcementEnabled}
                    aria-label="เปิด/ปิดแถบประกาศ"
                    onClick={() => update('announcementEnabled', !form.announcementEnabled)}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                      form.announcementEnabled
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-400 border-neutral-300'
                    }`}
                  >
                    {form.announcementEnabled ? 'เปิด' : 'ปิด'}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  แสดงเป็นแถบ &quot;ประกาศ&quot; บนสุดของหน้าแรก เว้นข้อความว่างไว้จะไม่แสดงแม้เปิดสวิตช์
                </p>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">ข้อความประกาศ</label>
                  <textarea
                    rows={2}
                    placeholder="เช่น ติดตามข่าวสารใหม่ได้ที่"
                    value={form.announcementText}
                    onChange={(e) => update('announcementText', e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-neutral-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ลิงก์แนบท้ายข้อความ (ถ้ามี)
                  </label>
                  <Input
                    type="text"
                    placeholder="เช่น https://discord.gg/xxxxxxx"
                    value={form.announcementLink}
                    onChange={(e) => update('announcementLink', e.target.value)}
                    className="w-full bg-white border-neutral-200 text-neutral-900"
                  />
                </div>
              </div>

              {/* Top-up destination */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">บัญชีรับเงินเติม</span>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  กรอกช่องไหนก็เปิดช่องทางนั้น ลูกค้าโอนเข้าช่องไหนก็ตรวจสลิปผ่าน ถ้าไม่กรอกเลย
                  แม้แต่ช่องเดียวจะเติมเงินไม่ได้ (กันคนเอาสลิปที่โอนให้คนอื่นมาเติม)
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
                      เลขบัญชีธนาคาร
                    </label>
                    <Input
                      type="text"
                      placeholder="เช่น 012-3-45678-9"
                      value={form.topupReceiverAccount}
                      onChange={(e) => update('topupReceiverAccount', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900 font-mono"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                      ใช้รับโอน + เทียบผู้รับในสลิป สร้าง QR ไม่ได้ (ใส่พร้อมเพย์ในช่องถัดไป)
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">พร้อมเพย์</label>
                    <Input
                      type="text"
                      placeholder="เช่น 081-234-5678"
                      value={form.topupPromptpayId}
                      onChange={(e) => update('topupPromptpayId', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900 font-mono"
                    />
                    {/* Only a PromptPay ID can be drawn as a QR, so say whether this
                        value is one before the customer finds out. */}
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                      {!form.topupPromptpayId.trim()
                        ? `กรอกเพื่อเปิดปุ่มสแกน QR ในหน้ากระเป๋าเงิน — ${PROMPTPAY_SHAPE_HINT}`
                        : promptpay
                          ? `ลูกค้าสแกน QR จ่ายได้ (${PROMPTPAY_KIND_LABEL[promptpay.kind]})`
                          : `เลขนี้สร้าง QR ไม่ได้ — ${PROMPTPAY_SHAPE_HINT}`}
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      เบอร์ทรูวอลเล็ต (รับซองอังเปา)
                    </label>
                    <Input
                      type="text"
                      placeholder="เช่น 0812345678"
                      value={form.topupTruemoneyPhone}
                      onChange={(e) => update('topupTruemoneyPhone', e.target.value)}
                      className="w-full bg-white border-neutral-200 text-neutral-900 font-mono"
                    />
                    {/* The redeem call needs this exact wallet's mobile; a typo here
                        means every voucher a customer sends is refused by TrueMoney. */}
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                      {truemoneyReady
                        ? 'ซองอังเปาที่ลูกค้าส่งมาจะถูกไถ่เข้าเบอร์นี้ แล้วเติมเข้ากระเป๋าให้ทันที'
                        : 'ต้องเป็นเบอร์มือถือ 10 หลักของวอลเล็ตที่จะรับเงิน ถ้าไม่กรอกจะปิดการเติมด้วยซองอังเปา'}
                    </p>
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

              {/* Contact details — shown publicly on /contact, so anything typed
                  here is visible to people who are not signed in. */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">ช่องทางติดต่อ</span>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  แสดงที่หน้า{' '}
                  <Link href="/contact" className="underline underline-offset-2 text-neutral-900">
                    /contact
                  </Link>{' '}
                  ซึ่งเปิดให้คนที่ยังไม่ได้ล็อกอินเห็นด้วย เว้นว่างช่องไหนช่องนั้นจะไม่ถูกแสดง
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONTACT_CHANNELS.map((channel) => (
                    <div key={channel.field} className={channel.multiline ? 'sm:col-span-2' : ''}>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        {channel.label}
                      </label>
                      {channel.multiline ? (
                        <textarea
                          rows={2}
                          placeholder={channel.placeholder}
                          value={form[channel.field]}
                          onChange={(e) => update(channel.field, e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-neutral-900 text-xs"
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder={channel.placeholder}
                          value={form[channel.field]}
                          onChange={(e) => update(channel.field, e.target.value)}
                          className="w-full bg-white border-neutral-200 text-neutral-900"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment channels — each one is enforced in its own route handler
                  as well, so a switch here is a real close, not a hidden tab. */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">ช่องทางเติมเงินที่เปิดรับ</span>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  ปิดช่องไหน ช่องนั้นจะหายจากหน้ากระเป๋าเงินและ API ก็ปฏิเสธด้วย
                  ส่วนรายการที่ลูกค้าจ่ายไปแล้วยังเข้ากระเป๋าตามปกติ
                </p>

                <div className="space-y-2">
                  {TOPUP_CHANNELS.map((channel) => {
                    const enabled = form[channel.field];
                    return (
                      <div
                        key={channel.key}
                        className="bg-white border border-neutral-200 rounded-md p-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-neutral-900 block">{channel.label}</span>
                          <span className="text-[11px] text-neutral-500 leading-relaxed">
                            {channel.hint}
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={channel.label}
                          onClick={() => update(channel.field, !enabled)}
                          className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                            enabled
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-400 border-neutral-300'
                          }`}
                        >
                          {enabled ? 'เปิด' : 'ปิด'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navbar menu — closes purely as a shortcut. The page itself still
                  answers a direct URL, this only hides the pill in the navbar. */}
              <div className="p-4 bg-neutral-100/60 rounded-md border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">เมนูใน Navbar</span>
                </div>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  ปิดเมนูไหน จะหายจาก navbar เท่านั้น หน้านั้นยังเข้าตรง URL ได้อยู่
                </p>

                <div className="space-y-2">
                  {NAV_LINKS.map((link) => {
                    const enabled = form[link.field];
                    return (
                      <div
                        key={link.key}
                        className="bg-white border border-neutral-200 rounded-md p-3 flex items-center justify-between gap-3"
                      >
                        <span className="font-semibold text-neutral-900">{link.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={link.label}
                          onClick={() => update(link.field, !enabled)}
                          className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                            enabled
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-400 border-neutral-300'
                          }`}
                        >
                          {enabled ? 'เปิด' : 'ปิด'}
                        </button>
                      </div>
                    );
                  })}
                </div>
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
