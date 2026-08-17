'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useShop } from '../../context/ShopContext';

/**
 * BYShop — แคตาล็อก ประวัติการซื้อ และแจ้งปัญหา
 *
 * ทุกคำขอผ่าน `/api/supplier/byshop` ฝั่งเซิร์ฟเวอร์ เบราว์เซอร์ไม่เคยเห็น keyapi
 *
 * ปุ่มสั่งซื้อยังเป็นการกดทีละรายการโดยแอดมิน ไม่ผูกกับการส่งของอัตโนมัติ เพราะชื่อฟิลด์
 * ของเส้น `/api/buy` ยังไม่ได้ยืนยันกับต้นทาง (ดู `lib/byshop.ts`) — คำตอบดิบจะถูกกางให้ดู
 * ตรงนี้ เพื่อเอาไปเขียนตัวแปลผลให้ถูกก่อนต่อเข้าระบบจริง
 */

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  category: string;
  image: string;
}

interface Purchase {
  orderId: string;
  name: string;
  email: string;
  password: string;
  price: number;
  customerUsername: string;
  purchasedAt: string;
}

interface Reason {
  id: number;
  label: string;
}

const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

export const AdminByshop: React.FC = () => {
  const { showToast } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<Purchase[]>([]);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [configured, setConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [reveal, setReveal] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<unknown>(null);

  const load = async () => {
    setIsLoading(true);
    const response = await fetch('/api/supplier/byshop?history=1');
    const body = await response.json().catch(() => ({}));
    setIsLoading(false);

    if (!body.success) {
      setError(body.message || 'โหลดข้อมูลจาก BYShop ไม่สำเร็จ');
      return;
    }

    setError('');
    setConfigured(Boolean(body.data.configured));
    setProducts(body.data.products as Product[]);
    setHistory((body.data.history ?? []) as Purchase[]);
    setReasons((body.data.reasons ?? []) as Reason[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const post = async (payload: Record<string, unknown>, id: string) => {
    setBusyId(id);
    const response = await fetch('/api/supplier/byshop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    setBusyId('');

    setLastResponse(body.data ?? body);
    showToast(body.message || (body.success ? 'สำเร็จ' : 'ไม่สำเร็จ'), body.success ? 'success' : 'warning');
    if (body.success) load();
  };

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();

  const shown = products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!search.trim() || product.name.toLowerCase().includes(search.trim().toLowerCase()))
  );

  if (isLoading) {
    return (
      <SkeletonRegion label="กำลังโหลดข้อมูล BYShop" className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-md" />
        ))}
      </SkeletonRegion>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <PackageSearch className="w-5 h-5 text-neutral-900" />
        <h3 className="font-bold text-neutral-900">BYShop — แอปพรีเมียม</h3>
        <span className="text-[11px] text-neutral-400">{products.length} รายการจากต้นทาง</span>
      </div>

      {error && (
        <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
          {error}
        </p>
      )}

      {!configured && (
        <p className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-600 leading-relaxed">
          ยังไม่ได้ตั้ง <code>SUPPLIER_BYSHOP_KEYAPI</code> ใน <code>.env</code> — ดูแคตาล็อกได้
          (เส้นนั้นไม่ต้องใช้คีย์) แต่สั่งซื้อ ดูประวัติ และแจ้งปัญหายังทำไม่ได้
        </p>
      )}

      {/* ── แคตาล็อก ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-900"
        >
          <option value="">ทุกหมวด ({products.length})</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <Input
          type="search"
          placeholder="ค้นหาชื่อสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 bg-white border-neutral-200 text-xs"
        />

        <Button
          type="button"
          variant="outline"
          onClick={load}
          className="h-9 px-3 text-xs border-neutral-300 ml-auto"
        >
          รีเฟรช
        </Button>
      </div>

      <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100 bg-white">
        {shown.length === 0 ? (
          <p className="text-xs text-neutral-400 py-10 text-center">ไม่มีสินค้าที่ตรงกับเงื่อนไข</p>
        ) : (
          shown.map((product) => {
            const outOfStock = product.stock < 1;
            return (
              <div key={product.id} className="p-3 flex items-center gap-3 text-xs">
                {product.image ? (
                  <img
                    src={product.image}
                    alt=""
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-md object-contain border border-neutral-200 shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-neutral-100 border border-neutral-200 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-neutral-900 block truncate">{product.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    id {product.id} · {product.category || 'ไม่ระบุหมวด'} ·{' '}
                    {outOfStock ? (
                      <span className="text-neutral-900 font-medium">{product.status || 'สินค้าหมด'}</span>
                    ) : (
                      <>คงเหลือ {product.stock}</>
                    )}
                  </span>
                </div>

                <span className="font-semibold text-neutral-900 shrink-0">{money(product.price)}</span>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!configured || outOfStock || busyId === product.id}
                  onClick={() => post({ action: 'buy', productId: product.id }, product.id)}
                  className="h-8 px-2.5 text-[11px] border-neutral-300 shrink-0"
                  title={outOfStock ? 'สินค้าหมด' : 'สั่งซื้อจาก BYShop ด้วยเครดิตของร้าน'}
                >
                  {busyId === product.id ? <Spinner className="mr-1" /> : <ShoppingCart className="mr-1" />}
                  สั่งซื้อ
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* คำตอบดิบจากต้นทาง — ไว้ยืนยันสัญญาของเส้น /api/buy ก่อนต่ออัตโนมัติ */}
      {lastResponse !== null && (
        <div className="border border-neutral-200 rounded-md p-3 bg-white">
          <span className="text-xs font-semibold text-neutral-900 block mb-2">
            คำตอบล่าสุดจาก BYShop (ดิบ)
          </span>
          <pre className="text-[11px] text-neutral-600 bg-neutral-50 rounded-md p-2 overflow-x-auto">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* ── ประวัติการซื้อ ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2">
        <h3 className="font-bold text-neutral-900 text-sm">ประวัติการซื้อจาก BYShop</h3>
        <span className="text-[11px] text-neutral-400">{history.length} รายการ</span>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-neutral-400 py-8 text-center border border-neutral-200 rounded-md">
          {configured ? 'ยังไม่มีประวัติการซื้อ' : 'ต้องตั้งคีย์ก่อนจึงจะดูประวัติได้'}
        </p>
      ) : (
        <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100 bg-white">
          {history.map((purchase) => (
            <div key={purchase.orderId} className="p-3 text-xs space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-neutral-900 block truncate">{purchase.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    order {purchase.orderId} · {money(purchase.price)} · {purchase.purchasedAt}
                    {purchase.customerUsername ? ` · ลูกค้า ${purchase.customerUsername}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* บัญชีที่ส่งมอบแล้วเป็นของลูกค้า — ปิดไว้ก่อน กดดูได้เมื่อจำเป็น */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReveal(reveal === purchase.orderId ? null : purchase.orderId)}
                    className="h-8 px-2 text-[11px] border-neutral-300"
                  >
                    {reveal === purchase.orderId ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </Button>

                  <select
                    defaultValue=""
                    disabled={busyId === purchase.orderId}
                    onChange={(e) => {
                      const reportId = Number(e.target.value);
                      if (reportId) post({ action: 'report', orderId: purchase.orderId, reportId }, purchase.orderId);
                      e.currentTarget.value = '';
                    }}
                    className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-[11px] text-neutral-900"
                  >
                    <option value="" disabled>
                      แจ้งปัญหา…
                    </option>
                    {reasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.label}
                      </option>
                    ))}
                  </select>

                  {busyId === purchase.orderId && <Spinner className="size-3.5" />}
                </div>
              </div>

              {reveal === purchase.orderId && (
                <div className="bg-neutral-50 rounded-md p-2 font-mono text-[11px] text-neutral-700 break-all">
                  <div>{purchase.email}</div>
                  <div>{purchase.password}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-neutral-400 leading-relaxed flex items-start gap-1.5">
        <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        การสั่งซื้อยังเป็นแบบกดเองทีละรายการ ยังไม่ผูกกับการส่งของอัตโนมัติ เพราะฟิลด์ของเส้น
        สั่งซื้อฝั่ง BYShop ยังไม่ได้ยืนยัน — กดหนึ่งครั้งแล้วดูคำตอบดิบด้านบนเพื่อยืนยันก่อน
      </p>
    </div>
  );
};
