'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ToastContainer } from '../../components/ToastContainer';
import { CartDrawer } from '../../components/CartDrawer';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const RESET_FEE = 50;

interface ResetResult {
  balance: number;
  gameTitle: string | null;
  hwidResetCount: number;
  hwidResetLastAt: string;
}

function ResetHwidContent() {
  const { showToast, refreshWallet } = useShop();
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    const response = await fetch('/api/reset-hwid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey }),
    });

    const body = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!body.success) {
      showToast(body.message || 'รีเซ็ต HWID ไม่สำเร็จ', 'warning');
      return;
    }

    setResult(body.data as ResetResult);
    setLicenseKey('');
    showToast(body.message || 'รีเซ็ต HWID เรียบร้อยแล้ว', 'success');
    refreshWallet();
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h1 className="text-xl font-bold tracking-tight">Reset HWID</h1>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ย้อนกลับ
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-neutral-200 rounded-md p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1">
              License Key
            </label>
            <Input
              type="text"
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="กรอก License Key ของคุณ"
              className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
            />
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              กรอกชื่อผู้ใช้ของบัญชีที่ซื้อจากร้านนี้ (ดูได้จากหน้า{' '}
              <Link href="/orders" className="underline underline-offset-2 text-neutral-900">
                บัญชีเกมที่ซื้อไว้
              </Link>
              )
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !licenseKey.trim()}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-700 text-white font-bold rounded-md border-0 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Spinner /> : <RotateCcw className="w-4 h-4" />}
            {isSubmitting ? 'กำลังรีเซ็ต...' : `Reset HWID (${RESET_FEE} บาท)`}
          </Button>
        </form>

        {result && (
          <div className="border border-neutral-200 rounded-md p-5 bg-neutral-50 space-y-1">
            <p className="text-sm font-semibold text-neutral-900">
              รีเซ็ต HWID สำเร็จ{result.gameTitle ? ` — ${result.gameTitle}` : ''}
            </p>
            <p className="text-xs text-neutral-500">
              รีเซ็ตไปแล้วทั้งหมด {result.hwidResetCount} ครั้ง ·{' '}
              {new Date(result.hwidResetLastAt).toLocaleString('th-TH')}
            </p>
            <p className="text-xs text-neutral-500">
              ยอดเงินคงเหลือ ฿{result.balance.toLocaleString()}
            </p>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function ResetHwidClient() {
  return (
    <ShopProvider>
      <ResetHwidContent />
    </ShopProvider>
  );
}
