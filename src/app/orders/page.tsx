'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ToastContainer } from '../../components/ToastContainer';
import { CartDrawer } from '../../components/CartDrawer';
import { Copy, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Fulfillment {
  id: string;
  orderId: string;
  gameTitle: string;
  username: string;
  password: string;
  codeRequests: { used: number; max: number };
  /** `no_account` = ซื้อสำเร็จแต่เป็นสินค้าที่ไม่ต้องผูกบัญชีเกม */
  status: 'delivered' | 'failed' | 'no_account';
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

  /* ซื้อสำเร็จแต่ไม่มีบัญชีเกมให้ส่งมอบ — แสดงเป็นรายการคำสั่งซื้อเฉย ๆ */
  if (item.status === 'no_account') {
    return (
      <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">
            {item.gameTitle || 'คำสั่งซื้อ'}
          </h3>
          <p className="text-[11px] text-neutral-400">
            คำสั่งซื้อ #{item.orderId} · {new Date(item.createdAt).toLocaleString('th-TH')}
          </p>
        </div>
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-1 border border-neutral-300 text-neutral-500 shrink-0">
          ซื้อสำเร็จ
        </span>
      </div>
    );
  }

  /* Failures are marked with a heavy left rule instead of a red card. */
  if (item.status === 'failed') {
    return (
      <div className="bg-white border border-neutral-200 border-l-2 border-l-neutral-900 rounded-md p-5 space-y-1">
        <span className="text-xs font-semibold text-neutral-900">
          ส่งมอบไม่สำเร็จ · คืนเงินแล้ว
        </span>
        <p className="text-[11px] text-neutral-500 font-mono">{item.errorMessage}</p>
        <p className="text-[11px] text-neutral-400">คำสั่งซื้อ #{item.orderId}</p>
      </div>
    );
  }

  const remaining = item.codeRequests.max - item.codeRequests.used;

  return (
    <div className="bg-white border border-neutral-200 rounded-md p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">{item.gameTitle}</h3>
          <p className="text-[11px] text-neutral-400">
            คำสั่งซื้อ #{item.orderId} · {new Date(item.createdAt).toLocaleString('th-TH')}
          </p>
        </div>
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-1 bg-neutral-900 text-white shrink-0">
          ส่งมอบแล้ว
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {[
          { label: 'ชื่อผู้ใช้', value: item.username },
          { label: 'รหัสผ่าน', value: item.password },
        ].map((field) => (
          <div key={field.label} className="border border-neutral-200 rounded-md p-3">
            <span className="block text-[11px] text-neutral-400 mb-1">{field.label}</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-neutral-900 truncate">
                {field.value || '—'}
              </code>
              {field.value && (
                <button
                  type="button"
                  onClick={() => copy(field.label, field.value)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label={`คัดลอก${field.label}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-100 pt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-medium text-neutral-900 block">รหัส Steam Guard</span>
            <span className="text-[11px] text-neutral-400">
              ขอได้อีก {Math.max(0, remaining)} จาก {item.codeRequests.max} รอบ
            </span>
          </div>

          <Button
            onClick={requestCode}
            disabled={isLoading || remaining <= 0}
            className="h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs px-4 rounded-md border-0 disabled:opacity-40"
          >
            <KeyRound className="w-4 h-4 mr-1.5" />
            {isLoading ? 'กำลังขอ...' : code ? 'ขอรหัสใหม่' : 'ขอรหัส'}
          </Button>
        </div>

        {code && (
          <div className="bg-neutral-900 text-white rounded-md p-4 flex items-center justify-between gap-3">
            <div>
              <code className="text-2xl font-bold tracking-[0.3em]">{code.code}</code>
              <span className="block text-[11px] text-neutral-400 mt-1">
                ใช้ได้อีก {code.validForSec} วินาที · ขอซ้ำในรอบนี้ได้อีก {code.expiresInSec} วินาที
              </span>
            </div>
            <button
              type="button"
              onClick={() => copy('รหัส', code.code)}
              className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              aria-label="คัดลอกรหัส"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
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
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="border-b border-neutral-200 pb-4">
          <h1 className="text-xl font-bold tracking-tight">บัญชีเกมที่ซื้อไว้</h1>
          <p className="text-xs text-neutral-500 mt-1">
            คำสั่งซื้อทั้งหมดของคุณ พร้อมชื่อผู้ใช้ รหัสผ่าน และรหัส Steam Guard
            สำหรับรายการที่เป็นบัญชีเกม
          </p>
        </div>

        {isLoading ? (
          <p className="text-xs text-neutral-400 py-16 text-center">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <div className="border border-neutral-200 rounded-md p-16 text-center space-y-4">
            <p className="text-sm text-neutral-500">ยังไม่มีคำสั่งซื้อ</p>
            <Link
              href="/"
              className="inline-flex items-center h-10 px-5 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-sm rounded-md transition-colors"
            >
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <AccountCard key={item.id} item={item} onUpdated={load} />
            ))}
          </div>
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
