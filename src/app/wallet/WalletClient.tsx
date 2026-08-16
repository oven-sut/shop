'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ToastContainer } from '../../components/ToastContainer';
import { CartDrawer } from '../../components/CartDrawer';
import { Topup } from '../../types/ecommerce';
import { ArrowDownRight, ArrowUpRight, Banknote, Gift, QrCode, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pickPromptPayTarget } from '@/lib/promptpay-id';

const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

/** How often the page asks the gateway whether the QR has been paid. */
const POLL_MS = 4_000;

/** What `/api/topups/qr` answers with. */
interface PromptPayQr {
  image: string;
  payload: string;
  amount: number | null;
  kindLabel: string;
  account: string;
  receiverName: string;
  bankName: string;
}

/** A gateway charge from `/api/topups/charges` — credits by itself once paid. */
interface Charge {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  /** promptpay = สแกน QR, truemoney = ไปยืนยัน OTP ที่ authorizeUri */
  method: 'promptpay' | 'truemoney';
  expiresAt: string | null;
  qrPath: string | null;
  authorizeUri: string | null;
}

function WalletContent() {
  const {
    balance,
    walletTransactions,
    settings,
    isLoading,
    topUp,
    redeemVoucher,
    refreshWallet,
    showToast,
  } = useShop();

  const [amount, setAmount] = useState('');
  const [slip, setSlip] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Topup[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const [qr, setQr] = useState<PromptPayQr | null>(null);
  const [qrError, setQrError] = useState('');
  const [isQrLoading, setIsQrLoading] = useState(false);

  const [voucher, setVoucher] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [gateway, setGateway] = useState<string | null>(null);
  const [gatewayMethods, setGatewayMethods] = useState<string[]>([]);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [chargeError, setChargeError] = useState('');
  const [isChargeLoading, setIsChargeLoading] = useState(false);
  const [walletPhone, setWalletPhone] = useState('');

  const loadHistory = async () => {
    const response = await fetch('/api/topups');
    const body = await response.json().catch(() => ({}));
    if (body.success) setHistory(body.data as Topup[]);
    setIsHistoryLoading(false);
  };

  // Top-up history and the gateway probe are only needed on this page, so they
  // are fetched here on mount rather than being carried in the shop context.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();

    fetch('/api/topups/charges')
      .then((response) => response.json())
      .then((body) => {
        if (!body.success) return;
        setGateway(body.data.gateway as string | null);
        setGatewayMethods((body.data.methods ?? []) as string[]);
      })
      .catch(() => setGateway(null));
  }, []);

  const receiverConfigured = Boolean(
    settings.topupReceiverAccount.trim() ||
      settings.topupPromptpayId.trim() ||
      settings.topupTruemoneyPhone.trim() ||
      settings.topupReceiverName.trim()
  );

  /**
   * Only a PromptPay ID can be turned into a QR. When the shop receives on a
   * plain account number the panel is left out altogether — a button that can
   * only answer "this is not a PromptPay account" is worse than no button.
   */
  const promptpaySupported =
    pickPromptPayTarget(settings.topupPromptpayId, settings.topupReceiverAccount) !== null;

  /** ซองอังเปาต้องมีเบอร์วอลเล็ตปลายทาง ไม่มีก็ไถ่ไม่ได้ */
  const voucherConfigured = /^0\d{9}$/.test(settings.topupTruemoneyPhone.replace(/\D/g, ''));

  /**
   * A tab needs two things: the shop must have left the channel open, and the
   * channel must actually be set up. The switches come from the same settings row
   * the route handlers read, so what is shown and what is accepted cannot drift.
   */
  const slipTab = settings.topupSlipEnabled;
  const qrTab = settings.topupQrEnabled && (Boolean(gateway) || promptpaySupported);
  const voucherSupported = settings.topupVoucherEnabled && voucherConfigured;
  const truemoneyTab = voucherSupported || gatewayMethods.includes('truemoney');

  const firstOpenTab = slipTab ? 'slip' : qrTab ? 'qr' : truemoneyTab ? 'truemoney' : 'none';

  /**
   * A QR carries the amount inside it, so it stops being the right QR the moment
   * the field changes — dropping it is safer than leaving one on screen that
   * charges a figure the customer is no longer looking at.
   */
  const handleAmountChange = (value: string) => {
    setAmount(value);
    setQr(null);
    setQrError('');

    // Same reasoning for the gateway charge, with one difference: a charge that
    // was already paid is still credited by the webhook, so dropping it here only
    // stops this page from watching it — never the money.
    setCharge(null);
    setChargeError('');
  };

  const loadQr = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      showToast('กรอกจำนวนเงินก่อน แล้วจึงสร้าง QR', 'warning');
      return;
    }

    setIsQrLoading(true);
    setQrError('');

    const response = await fetch(`/api/topups/qr?amount=${encodeURIComponent(value)}`);
    const body = await response.json().catch(() => ({}));

    setIsQrLoading(false);

    if (body.success) {
      setQr(body.data as PromptPayQr);
    } else {
      setQr(null);
      setQrError(body.message || 'สร้าง QR ไม่สำเร็จ');
    }
  };

  const openCharge = async (method: 'promptpay' | 'truemoney' = 'promptpay') => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      showToast('กรอกจำนวนเงินก่อน', 'warning');
      return;
    }

    if (method === 'truemoney' && !/^0\d{9}$/.test(walletPhone.replace(/\D/g, ''))) {
      showToast('กรอกเบอร์ทรูวอลเล็ตของคุณให้ครบ 10 หลัก', 'warning');
      return;
    }

    setIsChargeLoading(true);
    setChargeError('');

    const response = await fetch('/api/topups/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: value, method, phone: walletPhone }),
    });
    const body = await response.json().catch(() => ({}));

    setIsChargeLoading(false);

    if (body.success) {
      setCharge(body.data as Charge);
    } else {
      setCharge(null);
      setChargeError(body.message || 'สร้าง QR ไม่สำเร็จ');
    }
  };

  /**
   * Watches an open charge until the money lands.
   *
   * The webhook is what normally credits the top-up; this poll exists so the
   * customer sees it happen, and so a webhook that never arrives — wrong URL,
   * gateway hiccup — still ends with the wallet credited rather than a support
   * message. Both paths run the same server-side settle step, so whichever gets
   * there first wins and the other is a no-op.
   */
  useEffect(() => {
    if (!charge) return;

    let stopped = false;

    const check = async () => {
      const response = await fetch(`/api/topups/charges/${encodeURIComponent(charge.id)}`);
      const body = await response.json().catch(() => ({}));
      if (stopped || !body.success) return;

      const status = body.data.status as Charge['status'];
      if (status === 'pending') return;

      setCharge(null);

      if (status === 'paid') {
        showToast(`เติมเงิน ${money(body.data.amount)} สำเร็จ`, 'success');
        await Promise.all([refreshWallet(), loadHistory()]);
      } else {
        setChargeError(
          status === 'expired'
            ? 'QR หมดอายุแล้ว กรุณาสร้างใหม่'
            : 'การชำระเงินไม่สำเร็จ กรุณาลองใหม่'
        );
      }
    };

    const timer = setInterval(check, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
    // Deliberately not depending on loadHistory: it is redefined every render, so
    // including it would tear down and restart the poll on each one.
  }, [charge, refreshWallet, showToast]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!voucher.trim()) {
      showToast('วางลิงก์ซองอังเปาก่อน', 'warning');
      return;
    }

    setIsRedeeming(true);
    const result = await redeemVoucher(voucher.trim());
    setIsRedeeming(false);

    showToast(result.message, result.success ? 'success' : 'warning');

    if (result.success) {
      setVoucher('');
      await loadHistory();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      showToast('กรุณากรอกจำนวนเงินที่โอน', 'warning');
      return;
    }
    if (!slip) {
      showToast('กรุณาแนบรูปสลิปโอนเงิน', 'warning');
      return;
    }

    setIsSubmitting(true);
    const result = await topUp(value, slip);
    setIsSubmitting(false);

    showToast(result.message, result.success ? 'success' : 'warning');

    if (result.success) {
      setAmount('');
      setSlip(null);
      setQr(null);
      await Promise.all([refreshWallet(), loadHistory()]);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 sm:space-y-6">
        {/* Balance — the one inverted block on the page, so it reads first. */}
        <div className="bg-neutral-900 text-white rounded-md p-6 sm:p-8">
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
            ยอดเงินคงเหลือ
          </span>
          {/* ฿0.00 and "not loaded yet" must not look the same on a wallet. */}
          {isLoading ? (
            <Skeleton className="h-10 w-40 sm:w-48 mt-2 bg-neutral-700" />
          ) : (
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 break-all">
              {money(balance)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top up — one section, three ways in. They differ in what proves the
              money arrived, which is what the copy in each tab has to say. */}
          <section className="border border-neutral-200 rounded-md p-4 sm:p-6 space-y-5">
            {firstOpenTab === 'none' && (
              <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
                ร้านปิดรับการเติมเงินทุกช่องทางชั่วคราว — ลองใหม่ภายหลัง หรือติดต่อผู้ดูแลร้าน
              </p>
            )}

            <Tabs key={firstOpenTab} defaultValue={firstOpenTab} className="gap-5">
              <TabsList variant="line" className="w-full gap-5 h-auto! p-0 border-b border-neutral-100">
                {slipTab && (
                  <TabsTrigger value="slip" className="flex-none h-auto px-0 pb-3 text-xs">
                    สลิปโอนเงิน
                  </TabsTrigger>
                )}
                {qrTab && (
                  <TabsTrigger value="qr" className="flex-none h-auto px-0 pb-3 text-xs">
                    QR {gateway ? 'อัตโนมัติ' : 'พร้อมเพย์'}
                  </TabsTrigger>
                )}
                {truemoneyTab && (
                  <TabsTrigger value="truemoney" className="flex-none h-auto px-0 pb-3 text-xs">
                    ทรูวอลเล็ต
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ── 1. โอนแล้วส่งสลิป — ตรวจกับธนาคารก่อนเติม ─────────────── */}
              {slipTab && (
              <TabsContent value="slip" className="space-y-5">
            {receiverConfigured ? (
              <dl className="border border-neutral-200 rounded-md p-4 text-xs space-y-2">
                <span className="font-semibold text-neutral-900 block">
                  โอนเข้าช่องทางใดช่องทางหนึ่งนี้ก่อน แล้วอัปโหลดสลิป
                </span>
                {settings.topupBankName && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">ธนาคาร</dt>
                    <dd className="text-neutral-900 font-medium">{settings.topupBankName}</dd>
                  </div>
                )}
                {settings.topupReceiverAccount && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">เลขบัญชี</dt>
                    <dd className="font-mono font-semibold text-neutral-900">
                      {settings.topupReceiverAccount}
                    </dd>
                  </div>
                )}
                {settings.topupPromptpayId && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">พร้อมเพย์</dt>
                    <dd className="font-mono font-semibold text-neutral-900">
                      {settings.topupPromptpayId}
                    </dd>
                  </div>
                )}
                {settings.topupTruemoneyPhone && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">ทรูวอลเล็ต</dt>
                    <dd className="font-mono font-semibold text-neutral-900">
                      {settings.topupTruemoneyPhone}
                    </dd>
                  </div>
                )}
                {settings.topupReceiverName && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">ชื่อบัญชี</dt>
                    <dd className="text-neutral-900 font-medium">{settings.topupReceiverName}</dd>
                  </div>
                )}
                <p className="text-neutral-400 pt-2 border-t border-neutral-100">
                  เติมได้ครั้งละ {money(settings.topupMinAmount)} – {money(settings.topupMaxAmount)}
                  {' · '}สลิปต้องไม่เก่ากว่า {settings.topupMaxSlipAgeDays} วัน
                </p>
              </dl>
            ) : (
              <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
                ร้านยังไม่ได้ตั้งค่าบัญชีรับเงิน — ผู้ดูแลระบบต้องกรอกที่{' '}
                <Link href="/admin" className="underline underline-offset-2 font-medium text-neutral-900">
                  หน้าแอดมิน → ตั้งค่าร้านค้า
                </Link>{' '}
                ก่อนจึงจะเติมเงินได้
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  จำนวนเงินที่โอน (บาท)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min={settings.topupMinAmount}
                    max={settings.topupMaxAmount}
                    required
                    placeholder="เช่น 500"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="h-11 pl-10 bg-white border-neutral-300 rounded-md text-neutral-900 text-sm"
                  />
                  <Banknote className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  ต้องตรงกับยอดในสลิป ระบบจะตรวจกับธนาคารก่อนเติมเข้าให้
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  รูปสลิปโอนเงิน
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  required
                  onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:border-neutral-300 file:bg-white file:text-neutral-900 file:font-medium file:text-xs hover:file:bg-neutral-100 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !receiverConfigured}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md border-0 disabled:opacity-40"
              >
                {isSubmitting && <Spinner className="mr-2" />}
                {isSubmitting ? 'กำลังตรวจสอบสลิป...' : 'ยืนยันการเติมเงิน'}
              </Button>
              {isSubmitting && (
                <p className="text-[11px] text-neutral-400 text-center">
                  ส่งสลิปไปตรวจกับธนาคาร อาจใช้เวลาสักครู่ กรุณาอย่าปิดหน้านี้
                </p>
              )}
            </form>
              </TabsContent>
              )}

              {/* ── 2. QR — เข้าเองเมื่อจ่าย ถ้าร้านต่อเกตเวย์ไว้ ─────────── */}
              {qrTab && (
              <TabsContent value="qr" className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    จำนวนเงินที่จะเติม (บาท)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min={settings.topupMinAmount}
                      max={settings.topupMaxAmount}
                      placeholder="เช่น 500"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="h-11 pl-10 bg-white border-neutral-300 rounded-md text-neutral-900 text-sm"
                    />
                    <Banknote className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    เติมได้ครั้งละ {money(settings.topupMinAmount)} –{' '}
                    {money(settings.topupMaxAmount)}
                  </p>
                </div>

                {gateway ? (
                  <>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      สแกน QR นี้จ่ายด้วยแอปธนาคารไหนก็ได้ ระบบรับชำระเงินจะแจ้งกลับมาเอง
                      แล้วเงินเข้ากระเป๋าให้อัตโนมัติ — <span className="font-semibold text-neutral-900">ไม่ต้องอัปโหลดสลิป</span>
                    </p>

                    <Button
                      type="button"
                      onClick={() => openCharge('promptpay')}
                      disabled={isChargeLoading || Boolean(charge)}
                      className="w-full h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md border-0 disabled:opacity-40"
                    >
                      {isChargeLoading ? <Spinner className="mr-2" /> : <QrCode className="mr-2" />}
                      {isChargeLoading ? 'กำลังสร้าง QR...' : 'สร้าง QR สำหรับจ่าย'}
                    </Button>

                    {chargeError && (
                      <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
                        {chargeError}
                      </p>
                    )}

                    {charge?.method === 'promptpay' && charge.qrPath && (
                      <div className="border border-neutral-200 rounded-md p-4 flex flex-col items-center gap-2">
                        {/* Served by our own route, not the gateway's host. */}
                        <img
                          src={charge.qrPath}
                          alt={`QR ชำระเงิน ${money(charge.amount)}`}
                          width={224}
                          height={224}
                          className="w-56 h-56 rounded-md border border-neutral-200 bg-white"
                        />
                        <p className="text-sm font-semibold text-neutral-900">
                          {money(charge.amount)}
                        </p>
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                          <Spinner className="size-3" />
                          รอการชำระเงิน — หน้านี้จะอัปเดตให้เองเมื่อเงินเข้า
                        </p>
                        {charge.expiresAt && (
                          <p className="text-[11px] text-neutral-400">
                            QR หมดอายุ {new Date(charge.expiresAt).toLocaleString('th-TH')}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* No gateway: the shop can still hand out a QR, but nothing
                        tells it the money arrived — so this one needs the slip. */}
                    <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
                      ร้านยังไม่ได้ต่อระบบรับชำระเงิน จึงยังเติมอัตโนมัติไม่ได้ — สแกน QR
                      พร้อมเพย์ด้านล่างจ่ายได้ตามปกติ แล้วอัปโหลดสลิปที่แท็บ{' '}
                      <span className="font-medium text-neutral-900">สลิปโอนเงิน</span>{' '}
                      เพื่อรับเงินเข้ากระเป๋า
                    </p>

                    {promptpaySupported ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={loadQr}
                          disabled={isQrLoading}
                          className="w-full h-11 rounded-md border-neutral-300 text-sm font-medium"
                        >
                          {isQrLoading ? <Spinner className="mr-2" /> : <QrCode className="mr-2" />}
                          {qr ? 'สร้าง QR ใหม่' : 'สร้าง QR พร้อมเพย์'}
                        </Button>

                        {qrError && (
                          <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
                            {qrError}
                          </p>
                        )}

                        {qr && (
                          <div className="border border-neutral-200 rounded-md p-4 flex flex-col items-center gap-2">
                            <img
                              src={qr.image}
                              alt={`QR พร้อมเพย์ ยอด ${money(qr.amount ?? 0)}`}
                              width={224}
                              height={224}
                              className="w-56 h-56 rounded-md border border-neutral-200"
                            />
                            <p className="text-sm font-semibold text-neutral-900">
                              {money(qr.amount ?? 0)}
                            </p>
                            <p className="text-[11px] text-neutral-400 text-center">
                              {qr.receiverName || qr.account}
                              {' · '}
                              {qr.kindLabel} {qr.account}
                            </p>
                            <a
                              href={qr.image}
                              download={`promptpay-${qr.amount ?? 'static'}.png`}
                              className="text-[11px] text-neutral-500 underline underline-offset-2"
                            >
                              บันทึกรูป QR
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-neutral-400">
                        ร้านยังไม่ได้ตั้งพร้อมเพย์ไว้ จึงยังสร้าง QR ให้ไม่ได้
                      </p>
                    )}
                  </>
                )}
              </TabsContent>
              )}

              {/* ── 3. ทรูวอลเล็ต — จ่ายผ่านเกตเวย์ หรือส่งซองอังเปา ─────── */}
              {truemoneyTab && (
              <TabsContent value="truemoney" className="space-y-4">
                {/* จ่ายจากวอลเล็ตโดยตรง: เกตเวย์ถือความสัมพันธ์กับทรูให้ จึงไม่ต้อง
                    ยิง endpoint ที่ทรูไม่ได้เปิดให้ใครเรียก */}
                {gatewayMethods.includes('truemoney') && (
                  <div className="border border-neutral-200 rounded-md p-4 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 block">
                        จ่ายจากทรูวอลเล็ตโดยตรง
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        ยืนยันด้วย OTP ในหน้าของผู้ให้บริการ แล้วเงินเข้ากระเป๋าอัตโนมัติ
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        จำนวนเงิน (บาท)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min={settings.topupMinAmount}
                          max={settings.topupMaxAmount}
                          placeholder="เช่น 500"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="h-11 pl-10 bg-white border-neutral-300 rounded-md text-neutral-900 text-sm"
                        />
                        <Banknote className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        เบอร์ทรูวอลเล็ตของคุณ
                      </label>
                      <div className="relative">
                        <Input
                          type="tel"
                          inputMode="numeric"
                          placeholder="08xxxxxxxx"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          className="h-11 pl-10 bg-white border-neutral-300 rounded-md text-neutral-900 text-sm font-mono"
                        />
                        <Wallet className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        OTP จะส่งไปที่เบอร์นี้ — เป็นเบอร์ของคุณเอง ไม่ใช่เบอร์ร้าน
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => openCharge('truemoney')}
                      disabled={isChargeLoading || Boolean(charge)}
                      className="w-full h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md border-0 disabled:opacity-40"
                    >
                      {isChargeLoading && <Spinner className="mr-2" />}
                      {isChargeLoading ? 'กำลังสร้างรายการ...' : 'จ่ายด้วยทรูวอลเล็ต'}
                    </Button>

                    {charge?.method === 'truemoney' && charge.authorizeUri && (
                      <div className="border border-neutral-200 rounded-md p-4 space-y-2 text-center">
                        <p className="text-sm font-semibold text-neutral-900">
                          {money(charge.amount)}
                        </p>
                        {/* เปิดแท็บใหม่ ไม่พาออกจากหน้านี้ หน้านี้ยังเฝ้าสถานะอยู่ */}
                        <a
                          href={charge.authorizeUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-neutral-900 text-white text-sm font-semibold"
                        >
                          เปิดหน้ายืนยัน OTP
                        </a>
                        <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
                          <Spinner className="size-3" />
                          ยืนยันเสร็จแล้วกลับมาหน้านี้ ระบบจะเติมให้เอง
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {voucherSupported ? (
                  <>
                    <p className="text-xs font-semibold text-neutral-900 pt-1">
                      หรือส่งเป็นซองอังเปา
                    </p>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      ส่งซองอังเปาจากแอปทรูวอลเล็ตมาที่{' '}
                      <span className="font-mono font-semibold text-neutral-900">
                        {settings.topupTruemoneyPhone}
                      </span>{' '}
                      แล้ววางลิงก์ซองที่ได้ลงช่องนี้ — ถ้าลิงก์ถูกต้อง ระบบจะรับซองแล้วเติมยอด
                      ตามที่อยู่ในซองให้ทันที ไม่ต้องแนบสลิป ซองหนึ่งใบใช้ได้ครั้งเดียว
                    </p>

                    <form onSubmit={handleRedeem} className="space-y-3">
                      <div className="relative">
                        <Input
                          type="text"
                          required
                          placeholder="https://gift.truemoney.com/campaign/?v=..."
                          value={voucher}
                          onChange={(e) => setVoucher(e.target.value)}
                          className="h-11 pl-10 bg-white border-neutral-300 rounded-md text-neutral-900 text-sm font-mono"
                        />
                        <Gift className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <Button
                        type="submit"
                        disabled={isRedeeming}
                        className="w-full h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md border-0 disabled:opacity-40"
                      >
                        {isRedeeming && <Spinner className="mr-2" />}
                        {isRedeeming ? 'กำลังรับซอง...' : 'รับซองแล้วเติมเงิน'}
                      </Button>
                      <p className="text-[11px] text-neutral-400">
                        ยอดจากซองเข้าตามจริง ไม่ถูกจำกัดด้วยขั้นต่ำ/ขั้นสูงของร้าน
                      </p>
                    </form>
                  </>
                ) : (
                  // Only worth saying when there is no other way in on this tab —
                  // with the gateway available, the voucher is a bonus, not a gap.
                  !gatewayMethods.includes('truemoney') && (
                    <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
                      ร้านยังไม่ได้เปิดช่องทางทรูวอลเล็ต — ผู้ดูแลระบบต้องต่อระบบรับชำระเงิน
                      หรือกรอกเบอร์ทรูวอลเล็ตที่{' '}
                      <Link href="/admin" className="underline underline-offset-2 font-medium text-neutral-900">
                        หน้าแอดมิน → ตั้งค่าร้านค้า
                      </Link>
                    </p>
                  )
                )}
              </TabsContent>
              )}
            </Tabs>
          </section>

          {/* Movements */}
          <section className="border border-neutral-200 rounded-md p-4 sm:p-6 space-y-3">
            <h2 className="text-base font-semibold border-b border-neutral-100 pb-3">
              ความเคลื่อนไหวล่าสุด
            </h2>

            {/* This list comes from the shop context alongside the balance, so it
                follows the context's flag — not the top-up table's own fetch. */}
            {isLoading ? (
              <SkeletonRegion label="กำลังโหลดความเคลื่อนไหว" className="divide-y divide-neutral-100">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="py-3 flex items-center gap-3">
                    <Skeleton className="size-4 shrink-0 rounded-sm" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/5" />
                      <Skeleton className="h-2.5 w-3/5" />
                    </div>
                    <div className="space-y-1.5 items-end flex flex-col">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </SkeletonRegion>
            ) : walletTransactions.length === 0 ? (
              <p className="text-xs text-neutral-400 py-10 text-center">ยังไม่มีรายการ</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {walletTransactions.map((tx) => {
                  const isCredit = tx.amount >= 0;
                  return (
                    <li key={tx.id} className="py-3 flex items-center gap-3 text-xs">
                      {isCredit ? (
                        <ArrowDownRight className="w-4 h-4 text-neutral-900 shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-neutral-900 block truncate">
                          {tx.note || tx.kind}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(tx.createdAt).toLocaleString('th-TH')}
                          {tx.reference ? ` · ${tx.reference}` : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-semibold ${
                            isCredit ? 'text-neutral-900' : 'text-neutral-500'
                          }`}
                        >
                          {isCredit ? '+' : ''}
                          {money(tx.amount)}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          คงเหลือ {money(tx.balanceAfter)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Verified slips */}
        <section className="border border-neutral-200 rounded-md p-4 sm:p-6 space-y-3">
          <h2 className="text-base font-semibold border-b border-neutral-100 pb-3">
            ประวัติการเติมเงิน
          </h2>

          {isHistoryLoading ? (
            <SkeletonRegion label="กำลังโหลดประวัติการเติมเงิน" className="space-y-3 py-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </SkeletonRegion>
          ) : history.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">ยังไม่มีการเติมเงิน</p>
          ) : (
            <>
              {/* Four columns will not fit a phone, and a slip reference is a long
                  unbreakable token — so below sm each row becomes its own block
                  instead of a table squeezed sideways. */}
              <ul className="sm:hidden divide-y divide-neutral-100">
                {history.map((row) => (
                  <li key={row.id} className="py-3 space-y-1 text-xs">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-neutral-900">{money(row.amount)}</span>
                      <span className="text-[11px] text-neutral-400 shrink-0">
                        {new Date(row.createdAt).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="text-neutral-500">ผู้โอน {row.senderName || '—'}</div>
                    <div className="font-mono text-[11px] text-neutral-400 break-all">
                      {row.transRef}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-neutral-400 border-b border-neutral-200">
                      <th className="py-2.5 font-medium">วันที่</th>
                      <th className="py-2.5 font-medium">จำนวน</th>
                      <th className="py-2.5 font-medium">ผู้โอน</th>
                      <th className="py-2.5 font-medium">เลขอ้างอิงสลิป</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {history.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 text-neutral-500">
                          {new Date(row.createdAt).toLocaleString('th-TH')}
                        </td>
                        <td className="py-2.5 font-semibold text-neutral-900">
                          {money(row.amount)}
                        </td>
                        <td className="py-2.5 text-neutral-700">{row.senderName || '—'}</td>
                        <td className="py-2.5 font-mono text-[11px] text-neutral-400">
                          {row.transRef}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function WalletClient() {
  return (
    <ShopProvider>
      <WalletContent />
    </ShopProvider>
  );
}
