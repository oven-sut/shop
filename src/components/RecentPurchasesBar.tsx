'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, UserRound } from 'lucide-react';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';

/**
 * แถบ "รายการสั่งซื้อ (ล่าสุด)" — ของที่เพิ่งมีคนซื้อ เลื่อนดูแนวนอนได้
 *
 * Social proof, so it only ever says what was bought and roughly when, by a
 * masked handle the API produces. Nothing here can identify a buyer: the server
 * sends `bas***` and this component has no way to ask for more.
 *
 * Renders nothing at all when there are no recent purchases — an empty shelf
 * labelled "ล่าสุด" says the shop is dead, which is worse than not asking.
 */

interface Purchase {
  id: string;
  name: string;
  image: string;
  buyer: string;
  purchasedAt: string;
}

/** "25 นาทีที่แล้ว" — ใกล้ ๆ บอกเป็นนาที ไกลออกไปไม่มีใครสนใจว่ากี่นาที */
function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(seconds / 86_400)} วันที่แล้ว`;
}

export const RecentPurchasesBar: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch('/api/stats/recent-purchases')
      .then((response) => response.json())
      .then((body) => {
        if (!active) return;
        if (body.success) setPurchases(body.data as Purchase[]);
        setIsLoading(false);
      })
      .catch(() => active && setIsLoading(false));

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <SkeletonRegion label="กำลังโหลดรายการสั่งซื้อล่าสุด" className="border border-neutral-200 rounded-md">
        <div className="border-b border-neutral-100 px-3 py-2">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-3 p-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-56 shrink-0 rounded-md" />
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  if (!purchases.length) return null;

  return (
    <section className="border border-neutral-200 rounded-md bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-100">
        <ShoppingBag className="w-3.5 h-3.5 text-neutral-900" />
        <span className="text-xs font-semibold text-neutral-900">รายการสั่งซื้อ</span>
        <span className="text-[11px] text-neutral-400">(ล่าสุด)</span>
      </div>

      {/* เลื่อนเองด้วยนิ้ว/เมาส์ ไม่ใช่วิ่งอัตโนมัติ — ของที่ขยับเองอ่านยากและกดยาก
          บนมือถือ ส่วน divide-x ทำให้แต่ละรายการแยกกันชัดโดยไม่ต้องมีกรอบซ้อน */}
      <ul className="flex overflow-x-auto divide-x divide-neutral-100">
        {purchases.map((purchase) => (
          <li key={purchase.id} className="flex items-center gap-2.5 px-3 py-2.5 shrink-0 max-w-[19rem]">
            {purchase.image ? (
              <img
                src={purchase.image}
                alt=""
                width={36}
                height={36}
                className="w-9 h-9 rounded-md object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-neutral-100 border border-neutral-200 shrink-0" />
            )}

            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-900 block truncate">
                {purchase.name}
              </span>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <UserRound className="w-3 h-3 shrink-0" />
                <span className="font-mono">{purchase.buyer}</span>
                <span aria-hidden>·</span>
                <span className="whitespace-nowrap">{timeAgo(purchase.purchasedAt)}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
