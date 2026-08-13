'use client';

import React from 'react';
import { useShop } from '../../context/ShopContext';
import { INITIAL_COUPONS } from '../../data/initialData';
import { PieChart, Tag, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AdminAnalytics: React.FC = () => {
  const { products, orders } = useShop();

  // Category counts
  const categoryCounts: Record<string, number> = {};
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const totalProds = products.length || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category breakdown */}
        <Card className="bg-white border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">สัดส่วนสินค้าแยกตามหมวดหมู่</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalProds) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>{cat}</span>
                    <span className="font-bold text-indigo-600">{count} รายการ ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Coupons active */}
        <Card className="bg-white border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">คูปองโปรโมชันที่กำลังใช้งาน</h3>
          </div>

          <div className="space-y-3">
            {INITIAL_COUPONS.map((c) => (
              <div key={c.code} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="font-mono font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                    {c.code}
                  </Badge>
                  <p className="text-slate-500 mt-1">{c.description}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold border-0 text-[10px]">
                  ใช้งานได้
                </Badge>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Top rated products card */}
      <Card className="bg-white border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">สินค้าระดับ 5 ดาวได้รับความนิยมสูงสุด</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {products.slice(0, 3).map((p) => (
            <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img src={p.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-slate-900 text-xs truncate block">{p.name}</span>
                <span className="text-amber-500 text-xs font-bold block mt-0.5">★ {p.rating} ({p.reviewsCount} รีวิว)</span>
                <span className="text-indigo-600 text-xs font-bold">฿{p.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
