'use client';

import React from 'react';
import { Users, Package, ListChecks, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const StoreStatsBar: React.FC = () => {
  const { products, storefrontStats } = useShop();

  const totalStockRemaining = products.reduce((sum, p) => sum + p.stock, 0);

  const stats = [
    { label: 'จำนวนผู้ใช้งาน', value: storefrontStats.totalUsers, unit: 'คน', icon: Users },
    { label: 'รายการสินค้า', value: products.length, unit: 'ชิ้น', icon: Package },
    { label: 'จำนวนสินค้าที่เหลือ', value: totalStockRemaining, unit: 'ชิ้น', icon: ListChecks },
    { label: 'ยอดขาย', value: storefrontStats.totalItemsSold, unit: 'ชิ้น', icon: CheckCircle2 },
  ];

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, unit, icon: Icon }) => (
        <div key={label} className="border border-neutral-200 rounded-md p-4 flex items-center gap-3 bg-white">
          <div className="w-11 h-11 shrink-0 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-neutral-500 block">{label}</span>
            <span className="text-lg font-bold text-neutral-900">
              {value.toLocaleString()} <span className="text-xs font-normal text-neutral-500">{unit}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
