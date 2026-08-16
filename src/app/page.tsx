'use client';

import React from 'react';
import { ShopProvider, useShop } from '../context/ShopContext';
import { Navbar } from '../components/Navbar';
import { HeroImageBanner } from '../components/HeroImageBanner';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { StoreStatsBar } from '../components/StoreStatsBar';
import { RecentPurchasesBar } from '../components/RecentPurchasesBar';
import { FeatureBar } from '../components/FeatureBar';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ToastContainer } from '../components/ToastContainer';
import { Footer } from '../components/Footer';
import { Button } from '@/components/ui/button';

function StorefrontContent() {
  const { products, isLoading, searchQuery, setSearchQuery } = useShop();

  // บริการ (เช่น รับทำเว็บไซต์) ไม่ใช่ของที่วางแคตาล็อกให้เลือกซื้อแบบสินค้าทั่วไป
  // หมวดหมู่ต่าง ๆ แยกไปอยู่หน้า /category/[ชื่อ] ของตัวเอง หน้านี้จึงกรองแค่คำค้นหา
  const catalogProducts = products.filter((p) => !p.isService);

  const filteredProducts = catalogProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Toast Flash Messages */}
      <ToastContainer />

      {/* Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero image banner, announcement, store stats — topmost, admin-managed */}
        <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
          <HeroImageBanner />
          <AnnouncementBanner />
          <StoreStatsBar />
          <RecentPurchasesBar />
        </div>

        {/* Feature Highlights */}
        <div className="pt-10 lg:pt-16">
          <FeatureBar />
        </div>

        {/* All Products Catalog */}
        <section id="products-section" className="pt-10 lg:pt-16 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                แคตตาล็อกสินค้าทั้งหมด
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {isLoading ? 'กำลังโหลด...' : `${filteredProducts.length} รายการ`}
              </p>
            </div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 shrink-0 hidden sm:block">
              Catalogue
            </span>
          </div>

          {/*
            Product Grid — the loading branch has to come first. Before the
            catalogue arrives `filteredProducts` is empty, and without this the
            page confidently told every first-time visitor that their search
            matched nothing.
          */}
          {isLoading ? (
            <ProductGridSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="border border-neutral-200 rounded-md p-8 sm:p-16 text-center space-y-4">
              <h3 className="text-base font-semibold text-neutral-900">ไม่พบสินค้าที่คุณค้นหา</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                ลองค้นหาด้วยคำค้นอื่น
              </p>
              <Button
                onClick={() => setSearchQuery('')}
                className="h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-sm px-5 rounded-md transition-colors border-0"
              >
                ดูสินค้าทั้งหมด
              </Button>
            </div>
          ) : (
            /* Two across on a phone: one column made each card taller than the
               screen, so the catalogue read as a list of adverts to scroll past
               rather than a grid to browse. */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Slide-overs */}
      <ProductQuickViewModal />
      <CartDrawer />
      <CheckoutModal />
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <ShopProvider>
      <StorefrontContent />
    </ShopProvider>
  );
}
