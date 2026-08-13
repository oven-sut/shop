'use client';

import React from 'react';
import { ShopProvider, useShop } from '../context/ShopContext';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { FeatureBar } from '../components/FeatureBar';
import { ProductCard } from '../components/ProductCard';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ToastContainer } from '../components/ToastContainer';
import { Footer } from '../components/Footer';
import { Flame, Sparkles, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

function StorefrontContent() {
  const { products, searchQuery, selectedCategory, setSelectedCategory } = useShop();

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Flash Messages */}
      <ToastContainer />

      {/* Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Feature Highlights */}
        <FeatureBar />

        {/* Hot / Featured Products Showcase */}
        {!searchQuery && selectedCategory === 'ทั้งหมด' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                  <Flame className="w-5 h-5 fill-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    สินค้าฮิตติดเทรนด์ (HOT DEALS)
                  </h2>
                  <p className="text-xs text-slate-500">สินค้าขายดีที่มีผู้สนใจสั่งซื้อมากที่สุดในขณะนี้</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All Products Catalog */}
        <section id="products-section" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>แคตตาล็อกสินค้าทั้งหมด</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                แสดงผลสินค้าในหมวดหมู่ <strong className="text-indigo-600">&quot;{selectedCategory}&quot;</strong> ({filteredProducts.length} รายการ)
              </p>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 my-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border border-slate-200">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">ไม่พบสินค้าที่คุณค้นหา</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ลองค้นหาด้วยคำค้นอื่น หรือเลือกสลับหมวดหมู่สินค้าในเมนูด้านบน
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory('ทั้งหมด');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow border-0"
              >
                ดูสินค้าทั้งหมด
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
