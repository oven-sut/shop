'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Boxes, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SupplierCatalogueItem {
  productId: string;
  type: string;
  platform: string;
  name: string;
  image: string;
  stock: number;
  webPrice: number;
  cost: number;
  ratePercent: number;
  denuvo: boolean;
  genres: string[];
  durations?: Record<string, { webPrice: number; cost: number }>;
  imported: boolean;
}

interface SupplierAccount {
  websiteName: string;
  status: string;
  balance: number;
  ratePercent: number;
  keyPrefix: string;
  isSandbox: boolean;
}

const money = (value: number) => `฿${value.toLocaleString('th-TH')}`;

/** แคตตาล็อกของ 499K Network — นำเข้าแล้วสินค้าจะไปโผล่ในร้านทันที */
export const AdminSupplier: React.FC = () => {
  const { showToast, refreshProducts } = useShop();

  const [account, setAccount] = useState<SupplierAccount | null>(null);
  const [items, setItems] = useState<SupplierCatalogueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const response = await fetch('/api/supplier');
    const body = await response.json().catch(() => ({}));
    setIsLoading(false);

    if (!body.success) {
      setError(body.message || 'โหลดแคตตาล็อกไม่สำเร็จ');
      return;
    }

    setError('');
    setAccount(body.data.account as SupplierAccount);
    setItems(body.data.products as SupplierCatalogueItem[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const importProduct = async (item: SupplierCatalogueItem) => {
    setImporting(item.productId);

    const response = await fetch('/api/supplier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: item.productId }),
    });

    const body = await response.json().catch(() => ({}));
    setImporting(null);

    showToast(body.message || (body.success ? 'นำเข้าสำเร็จ' : 'นำเข้าไม่สำเร็จ'),
      body.success ? 'success' : 'warning');

    if (body.success) {
      await Promise.all([load(), refreshProducts()]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="bg-white border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">ซัพพลายเออร์ 499K Network</h2>
              {account ? (
                <p className="text-xs text-slate-500">
                  เครดิตคงเหลือ <strong className="text-emerald-600">{money(account.balance)}</strong>
                  {' · '}เรตตัวแทน {account.ratePercent}%{' · '}
                  <span className="font-mono text-[11px]">{account.keyPrefix}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400">กำลังเชื่อมต่อ...</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {account?.isSandbox && (
              <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold">
                โหมดทดสอบ (sandbox)
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={load}
              disabled={isLoading}
              className="text-xs font-bold border-slate-300 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              รีเฟรช
            </Button>
          </div>
        </div>

        {account?.isSandbox && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
            คีย์ทดสอบสั่งซื้อได้เฉพาะสินค้า sandbox และ rental เท่านั้น
            เมื่อเปลี่ยนเป็นคีย์ live (`499k_live_`) จึงจะเห็นสินค้าจริงทั้งหมด
          </p>
        )}
      </Card>

      {error && (
        <Card className="bg-rose-50 border-rose-200 rounded-2xl p-4 text-xs text-rose-700">
          {error}
        </Card>
      )}

      {isLoading && !items.length ? (
        <p className="text-xs text-slate-400 py-16 text-center">กำลังโหลดแคตตาล็อก...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.productId}
              className="bg-white border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-slate-200 text-slate-600 shrink-0"
                  >
                    {item.type === 'rental' ? 'เช่า' : 'ซื้อขาด'}
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-400">
                  {item.platform.toUpperCase()} · คงเหลือ {item.stock}
                  {item.denuvo ? ' · Denuvo' : ''}
                </p>

                {item.durations ? (
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    {Object.entries(item.durations).map(([days, price]) => (
                      <div key={days} className="flex justify-between">
                        <span>{days} วัน</span>
                        <span>
                          ขาย {money(price.webPrice)}{' '}
                          <span className="text-slate-400">(ทุน {money(price.cost)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-900">{money(item.webPrice)}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ทุน {money(item.cost)} · กำไร {money(item.webPrice - item.cost)}
                    </span>
                  </div>
                )}

                <div className="pt-2 mt-auto">
                  <Button
                    onClick={() => importProduct(item)}
                    disabled={importing === item.productId}
                    variant={item.imported ? 'outline' : 'default'}
                    className={
                      item.imported
                        ? 'w-full text-xs font-bold border-slate-300 rounded-xl'
                        : 'w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-0'
                    }
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    {importing === item.productId
                      ? 'กำลังนำเข้า...'
                      : item.imported
                        ? 'นำเข้าแล้ว · อัปเดตราคา/สต็อก'
                        : 'นำเข้ามาขาย'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
