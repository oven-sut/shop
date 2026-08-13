'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ToastContainer } from '../../components/ToastContainer';
import { CartDrawer } from '../../components/CartDrawer';
import { Copy, KeyRound, Package, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Fulfillment {
  id: string;
  orderId: string;
  gameTitle: string;
  username: string;
  password: string;
  codeRequests: { used: number; max: number };
  status: 'delivered' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

interface GuardCode {
  code: string;
  validForSec: number;
  expiresInSec: number;
  codeRequests: { used: number; max: number };
}

function AccountCard({ item, onUpdated }: { item: Fulfillment; onUpdated: () => void }) {
  const { showToast } = useShop();
  const [code, setCode] = useState<GuardCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`คัดลอก${label}แล้ว`, 'success');
    } catch {
      showToast('คัดลอกไม่สำเร็จ กรุณาคัดลอกเอง', 'warning');
    }
  };

  const requestCode = async () => {
    setIsLoading(true);

    const response = await fetch(`/api/orders/${item.orderId}/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ครั้งแรกของแต่ละรอบต้องบอกเหตุผล ครั้งถัดไปในหน้าต่างเดิมขอซ้ำได้เลย
      body: JSON.stringify(code ? {} : { reason: 'ลูกค้าเข้าสู่ระบบ Steam' }),
    });

    const body = await response.json().catch(() => ({}));
    setIsLoading(false);

    if (!body.success) {
      showToast(body.message || 'ขอรหัสไม่สำเร็จ', 'warning');
      return;
    }

    setCode(body.data as GuardCode);
    onUpdated();
  };

  if (item.status === 'failed') {
    return (
      <Card className="bg-white border-rose-200 rounded-2xl p-5 space-y-1">
        <span className="text-xs font-bold text-rose-700">ส่งมอบไม่สำเร็จ · คืนเงินแล้ว</span>
        <p className="text-[11px] text-slate-500 font-mono">{item.errorMessage}</p>
        <p className="text-[11px] text-slate-400">คำสั่งซื้อ #{item.orderId}</p>
      </Card>
    );
  }

  const remaining = item.codeRequests.max - item.codeRequests.used;

  return (
    <Card className="bg-white border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{item.gameTitle}</h3>
          <p className="text-[11px] text-slate-400">
            คำสั่งซื้อ #{item.orderId} · {new Date(item.createdAt).toLocaleString('th-TH')}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          ส่งมอบแล้ว
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {[
          { label: 'ชื่อผู้ใช้', value: item.username },
          { label: 'รหัสผ่าน', value: item.password },
        ].map((field) => (
          <div key={field.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="block text-[11px] text-slate-500 mb-1">{field.label}</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-slate-900 truncate">{field.value || '—'}</code>
              {field.value && (
                <button
                  type="button"
                  onClick={() => copy(field.label, field.value)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                  aria-label={`คัดลอก${field.label}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              รหัส Steam Guard
            </span>
            <span className="text-[11px] text-slate-400">
              ขอได้อีก {Math.max(0, remaining)} จาก {item.codeRequests.max} รอบ
            </span>
          </div>

          <Button
            onClick={requestCode}
            disabled={isLoading || remaining <= 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border-0 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4 mr-1.5" />
            {isLoading ? 'กำลังขอ...' : code ? 'ขอรหัสใหม่' : 'ขอรหัส'}
          </Button>
        </div>

        {code && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <code className="text-2xl font-black tracking-[0.3em] text-indigo-700">
                {code.code}
              </code>
              <span className="block text-[11px] text-indigo-600 mt-0.5">
                ใช้ได้อีก {code.validForSec} วินาที · ขอซ้ำในรอบนี้ได้อีก {code.expiresInSec} วินาที
              </span>
            </div>
            <button
              type="button"
              onClick={() => copy('รหัส', code.code)}
              className="p-2 rounded-lg text-indigo-500 hover:bg-white transition-colors"
              aria-label="คัดลอกรหัส"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function OrdersContent() {
  const [items, setItems] = useState<Fulfillment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    const response = await fetch('/api/fulfillments');
    const body = await response.json().catch(() => ({}));
    if (body.success) setItems(body.data as Fulfillment[]);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-extrabold">บัญชีเกมที่ซื้อไว้</h1>
        </div>

        {isLoading ? (
          <p className="text-xs text-slate-400 py-16 text-center">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <Card className="bg-white border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <p className="text-sm text-slate-500">ยังไม่มีคำสั่งซื้อ</p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
            >
              เลือกซื้อสินค้า
            </Link>
          </Card>
        ) : (
          items.map((item) => <AccountCard key={item.id} item={item} onUpdated={load} />)
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ShopProvider>
      <OrdersContent />
    </ShopProvider>
  );
}
