'use client';

import React from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const HeroBanner: React.FC = () => {
  const { products, isLoading, setSelectedCategory, setQuickViewProduct } = useShop();

  const featured = products.find((p) => p.isFeatured) ?? products[0] ?? null;
  const categoryCount = new Set(products.map((p) => p.category).filter(Boolean)).size;

  const discountPercent =
    featured?.originalPrice && featured.originalPrice > featured.price
      ? Math.round((1 - featured.price / featured.originalPrice) * 100)
      : 0;

  const metrics = [
    { value: String(products.length), label: 'แอปในร้าน' },
    { value: String(categoryCount), label: 'หมวดหมู่' },
    { value: 'ทันที', label: 'ได้รับหลังชำระเงิน' },
  ];

  return (
    <section className="border-b border-neutral-200 pt-10 pb-12 lg:pt-16 lg:pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

        {/* Left Column Text */}
        <div className="lg:col-span-7 space-y-7">
          <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-neutral-400">
            แอปใหม่ประจำปี 2026
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900">
            ยกระดับทุกประสบการณ์
            <br />
            ด้วยแอปพรีเมียม พร้อมใช้ทันที
          </h1>

          <p className="text-neutral-500 text-base leading-relaxed max-w-xl">
            คัดสรรแอปและบริการดิจิทัลที่ใช้งานได้จริง เติมเงินเข้ากระเป๋าครั้งเดียว
            แล้วกดซื้อได้ทันทีทุกรายการ
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => setSelectedCategory('ทั้งหมด')}
              className="h-12 px-6 rounded-md bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <span>ดูแอปทั้งหมด</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/wallet"
              className="h-12 px-6 rounded-md bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-sm border border-neutral-300 transition-colors flex items-center"
            >
              เติมเงินเข้ากระเป๋า
            </Link>
          </div>

          {/* Quick Metrics — counted from the catalogue, not written by hand */}
          <dl className="pt-7 border-t border-neutral-200 grid grid-cols-3 gap-3 sm:gap-6">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt className="sr-only">{metric.label}</dt>
                <dd>
                  {/* A hard "0" while the catalogue is still in flight reads as
                      an empty shop rather than as a pending number. */}
                  {isLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <span className="block text-xl sm:text-2xl font-bold text-neutral-900">
                      {metric.value}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">{metric.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right Column — whichever product the shop is actually featuring */}
        <div className="lg:col-span-5">
          <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden border border-neutral-200 rounded-md bg-neutral-50 group">
            {isLoading ? (
              /* Same panel, no content yet — not "the shop is empty", which is
                 what this said before while the request was still open. */
              <div className="w-full h-full">
                <Skeleton className="w-full h-full rounded-none" />
                <div className="absolute bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 space-y-3">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ) : featured ? (
              <>
                {featured.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.image}
                    alt={featured.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {discountPercent > 0 && (
                  <div className="absolute top-0 left-0 bg-neutral-900 text-white font-semibold text-xs px-3 py-1.5">
                    -{discountPercent}%
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4">
                  <span className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase">
                    แอปแนะนำ
                  </span>
                  <h3 className="text-sm font-semibold text-neutral-900 mt-1 truncate">
                    {featured.name}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-neutral-900">
                        ฿{featured.price.toLocaleString()}
                      </span>
                      {featured.originalPrice ? (
                        <span className="text-xs text-neutral-400 line-through">
                          ฿{featured.originalPrice.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => setQuickViewProduct(featured)}
                      className="text-xs font-medium text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                ยังไม่มีแอปในร้าน
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
