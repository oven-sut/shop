'use client';

import React from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';
import { ShoppingBag, Flame, Sparkles } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { products, setSelectedCategory, setQuickViewProduct } = useShop();

  const featured = products.find((p) => p.isFeatured) ?? products[0] ?? null;
  const categoryCount = new Set(products.map((p) => p.category).filter(Boolean)).size;

  const discountPercent =
    featured?.originalPrice && featured.originalPrice > featured.price
      ? Math.round((1 - featured.price / featured.originalPrice) * 100)
      : 0;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl my-6 border border-slate-800 shadow-2xl">
      {/* Background Decorative Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>แอปใหม่ประจำปี 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-100">
            ยกระดับทุกประสบการณ์ด้วย <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              แอปพลิเคชันพรีเมียม พร้อมใช้ทันที
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-light">
            คัดสรรแอปและบริการดิจิทัลที่ใช้งานได้จริง เติมเงินเข้ากระเป๋าครั้งเดียว แล้วกดซื้อได้ทันทีทุกรายการ
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setSelectedCategory('ทั้งหมด')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ดูแอปทั้งหมด</span>
            </button>

            <Link
              href="/wallet"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>เติมเงินเข้ากระเป๋า</span>
            </Link>
          </div>

          {/* Quick Metrics — counted from the catalogue, not written by hand */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-slate-300">
            <div>
              <span className="block text-xl font-extrabold text-white">{products.length}</span>
              <span className="text-xs text-slate-400">แอปในร้าน</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">{categoryCount}</span>
              <span className="text-xs text-slate-400">หมวดหมู่</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">ทันที</span>
              <span className="text-xs text-slate-400">ได้รับหลังชำระเงิน</span>
            </div>
          </div>
        </div>

        {/* Right Column — whichever product the shop is actually featuring */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 group bg-slate-900">
            {featured ? (
              <>
                {featured.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.image}
                    alt={featured.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {discountPercent > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    <span>-{discountPercent}%</span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-indigo-400 font-bold tracking-wide uppercase">
                    แอปแนะนำ
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 truncate">{featured.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-amber-400">
                        ฿{featured.price.toLocaleString()}
                      </span>
                      {featured.originalPrice ? (
                        <span className="text-xs text-slate-500 line-through">
                          ฿{featured.originalPrice.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => setQuickViewProduct(featured)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
                <Sparkles className="w-8 h-8 text-slate-700" />
                <span>ยังไม่มีแอปในร้าน</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
