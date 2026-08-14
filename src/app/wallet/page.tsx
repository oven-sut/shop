'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ToastContainer } from '../../components/ToastContainer';
import { CartDrawer } from '../../components/CartDrawer';
import { Topup } from '../../types/ecommerce';
import { ArrowDownRight, ArrowUpRight, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

function WalletContent() {
  const { balance, walletTransactions, settings, isLoading, topUp, refreshWallet, showToast } =
    useShop();

  const [amount, setAmount] = useState('');
  const [slip, setSlip] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Topup[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const loadHistory = async () => {
    const response = await fetch('/api/topups');
    const body = await response.json().catch(() => ({}));
    if (body.success) setHistory(body.data as Topup[]);
    setIsHistoryLoading(false);
  };

  // Top-up history is only needed on this page, so it is fetched here on mount
  // rather than being carried in the shop context.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, []);

  const receiverConfigured = Boolean(
    settings.topupReceiverAccount.trim() || settings.topupReceiverName.trim()
  );

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
      await Promise.all([refreshWallet(), loadHistory()]);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Balance — the one inverted block on the page, so it reads first. */}
        <div className="bg-neutral-900 text-white rounded-md p-8">
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
            ยอดเงินคงเหลือ
          </span>
          {/* ฿0.00 and "not loaded yet" must not look the same on a wallet. */}
          {isLoading ? (
            <Skeleton className="h-10 w-48 mt-2 bg-neutral-700" />
          ) : (
            <p className="text-4xl font-extrabold tracking-tight mt-2">{money(balance)}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top up */}
          <section className="border border-neutral-200 rounded-md p-6 space-y-5">
            <h2 className="text-base font-semibold border-b border-neutral-100 pb-3">
              เติมเงินด้วยสลิปโอน
            </h2>

            {receiverConfigured ? (
              <dl className="border border-neutral-200 rounded-md p-4 text-xs space-y-2">
                <span className="font-semibold text-neutral-900 block">
                  โอนเข้าบัญชีนี้ก่อน แล้วอัปโหลดสลิป
                </span>
                {settings.topupBankName && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">ธนาคาร</dt>
                    <dd className="text-neutral-900 font-medium">{settings.topupBankName}</dd>
                  </div>
                )}
                {settings.topupReceiverAccount && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">เลขบัญชี/พร้อมเพย์</dt>
                    <dd className="font-mono font-semibold text-neutral-900">
                      {settings.topupReceiverAccount}
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
                    onChange={(e) => setAmount(e.target.value)}
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
          </section>

          {/* Movements */}
          <section className="border border-neutral-200 rounded-md p-6 space-y-3">
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
        <section className="border border-neutral-200 rounded-md p-6 space-y-3">
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
            <div className="overflow-x-auto">
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
                      <td className="py-2.5 font-semibold text-neutral-900">{money(row.amount)}</td>
                      <td className="py-2.5 text-neutral-700">{row.senderName || '—'}</td>
                      <td className="py-2.5 font-mono text-[11px] text-neutral-400">
                        {row.transRef}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function WalletPage() {
  return (
    <ShopProvider>
      <WalletContent />
    </ShopProvider>
  );
}
