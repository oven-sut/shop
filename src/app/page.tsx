'use client';

import React from 'react';
import { ShopProvider, useShop } from '../context/ShopContext';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { FeatureBar } from '../components/FeatureBar';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ToastContainer } from '../components/ToastContainer';
import { Footer } from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function StorefrontContent() {
  const { products, isLoading, searchQuery, selectedCategory, setSelectedCategory } = useShop();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredProducts = products.filter((p) => p.isFeatured || p.badge === 'HOT');

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Toast Flash Messages */}
      <ToastContainer />

      {/* Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Feature Highlights */}
        <FeatureBar />

        {/* Hot / Featured Products Showcase */}
        {isLoading && (
          <section className="pt-16 space-y-6">
            <div className="border-b border-neutral-200 pb-4 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <ProductGridSkeleton count={4} />
          </section>
        )}

        {!isLoading && !searchQuery && selectedCategory === 'ทั้งหมด' && featuredProducts.length > 0 && (
          <section className="pt-16 space-y-6">
            <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                  สินค้าฮิตติดเทรนด์
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  สินค้าขายดีที่มีผู้สนใจสั่งซื้อมากที่สุดในขณะนี้
                </p>
              </div>
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 shrink-0 hidden sm:block">
                Hot deals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All Products Catalog */}
        <section id="products-section" className="pt-16 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                แคตตาล็อกสินค้าทั้งหมด
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                หมวดหมู่{' '}
                <strong className="font-semibold text-neutral-900">
                  &quot;{selectedCategory}&quot;
                </strong>{' '}
                · {isLoading ? 'กำลังโหลด...' : `${filteredProducts.length} รายการ`}
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
            <div className="border border-neutral-200 rounded-md p-16 text-center space-y-4">
              <h3 className="text-base font-semibold text-neutral-900">ไม่พบสินค้าที่คุณค้นหา</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                ลองค้นหาด้วยคำค้นอื่น หรือเลือกสลับหมวดหมู่สินค้าในเมนูด้านบน
              </p>
              <Button
                onClick={() => setSelectedCategory('ทั้งหมด')}
                className="h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-sm px-5 rounded-md transition-colors border-0"
              >
                ดูสินค้าทั้งหมด
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
