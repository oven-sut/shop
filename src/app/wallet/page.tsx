'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ToastContainer } from '../../components/ToastContainer';
import { CartDrawer } from '../../components/CartDrawer';
import { Topup } from '../../types/ecommerce';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Building2,
  Receipt,
  UploadCloud,
  Wallet as WalletIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

function WalletContent() {
  const { balance, walletTransactions, settings, topUp, refreshWallet, showToast } = useShop();

  const [amount, setAmount] = useState('');
  const [slip, setSlip] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Topup[]>([]);

  const loadHistory = async () => {
    const response = await fetch('/api/topups');
    const body = await response.json().catch(() => ({}));
    if (body.success) setHistory(body.data as Topup[]);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Balance */}
        <Card className="bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 border-0 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20">
          <div className="flex items-center gap-3">
            <WalletIcon className="w-8 h-8" />
            <div>
              <span className="text-xs uppercase tracking-widest opacity-80">ยอดเงินคงเหลือ</span>
              <p className="text-3xl font-black tracking-tight">{money(balance)}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top up */}
          <Card className="bg-white border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold">เติมเงินด้วยสลิปโอน</h2>
            </div>

            {receiverConfigured ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  โอนเข้าบัญชีนี้ก่อน แล้วอัปโหลดสลิป
                </span>
                {settings.topupBankName && (
                  <p className="text-slate-500">
                    ธนาคาร: <strong className="text-slate-800">{settings.topupBankName}</strong>
                  </p>
                )}
                {settings.topupReceiverAccount && (
                  <p className="text-slate-500">
                    เลขบัญชี/พร้อมเพย์:{' '}
                    <strong className="font-mono text-indigo-700">
                      {settings.topupReceiverAccount}
                    </strong>
                  </p>
                )}
                {settings.topupReceiverName && (
                  <p className="text-slate-500">
                    ชื่อบัญชี: <strong className="text-slate-800">{settings.topupReceiverName}</strong>
                  </p>
                )}
                <p className="text-slate-400 pt-1">
                  เติมได้ครั้งละ {money(settings.topupMinAmount)} – {money(settings.topupMaxAmount)}
                  {' · '}สลิปต้องไม่เก่ากว่า {settings.topupMaxSlipAgeDays} วัน
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                ร้านยังไม่ได้ตั้งค่าบัญชีรับเงิน — ผู้ดูแลระบบต้องกรอกที่{' '}
                <Link href="/admin" className="underline font-semibold">
                  หน้าแอดมิน → ตั้งค่าร้านค้า
                </Link>{' '}
                ก่อนจึงจะเติมเงินได้
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
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
                    className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                  />
                  <Banknote className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ต้องตรงกับยอดในสลิป ระบบจะตรวจกับธนาคารก่อนเติมเข้าให้
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">รูปสลิปโอนเงิน</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  required
                  onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold file:text-xs hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !receiverConfigured}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 border-0 disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังตรวจสอบสลิป...' : 'ยืนยันการเติมเงิน'}
              </Button>
            </form>
          </Card>

          {/* Movements */}
          <Card className="bg-white border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold">ความเคลื่อนไหวล่าสุด</h2>
            </div>

            {walletTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">ยังไม่มีรายการ</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {walletTransactions.map((tx) => {
                  const isCredit = tx.amount >= 0;
                  return (
                    <li key={tx.id} className="py-2.5 flex items-center gap-3 text-xs">
                      {isCredit ? (
                        <ArrowDownCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          {tx.note || tx.kind}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleString('th-TH')}
                          {tx.reference ? ` · ${tx.reference}` : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          {isCredit ? '+' : ''}
                          {money(tx.amount)}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          คงเหลือ {money(tx.balanceAfter)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Verified slips */}
        <Card className="bg-white border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold">ประวัติการเติมเงิน</h2>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีการเติมเงิน</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 font-semibold">วันที่</th>
                    <th className="py-2 font-semibold">จำนวน</th>
                    <th className="py-2 font-semibold">ผู้โอน</th>
                    <th className="py-2 font-semibold">เลขอ้างอิงสลิป</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50">
                      <td className="py-2 text-slate-500">
                        {new Date(row.createdAt).toLocaleString('th-TH')}
                      </td>
                      <td className="py-2 font-bold text-emerald-600">{money(row.amount)}</td>
                      <td className="py-2 text-slate-700">{row.senderName || '—'}</td>
                      <td className="py-2 font-mono text-[11px] text-slate-400">{row.transRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
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
