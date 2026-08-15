'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShopProvider, useShop } from '../../../context/ShopContext';
import { Navbar } from '../../../components/Navbar';
import { ProductCard } from '../../../components/ProductCard';
import { ProductGridSkeleton } from '../../../components/ProductCardSkeleton';
import { ProductQuickViewModal } from '../../../components/ProductQuickViewModal';
import { CartDrawer } from '../../../components/CartDrawer';
import { CheckoutModal } from '../../../components/CheckoutModal';
import { ToastContainer } from '../../../components/ToastContainer';
import { Footer } from '../../../components/Footer';
import { Button } from '@/components/ui/button';

function CategoryContent() {
  const { slug } = useParams<{ slug: string }>();
  const categoryName = decodeURIComponent(slug);
  const { products, isLoading, searchQuery } = useShop();

  // บริการ (เช่น รับทำเว็บไซต์) ไม่ใช่ของที่วางแคตาล็อกให้เลือกซื้อแบบสินค้าทั่วไป
  const categoryProducts = products.filter(
    (p) => !p.isService && p.category === categoryName
  );

  const filteredProducts = categoryProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      <ToastContainer />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{categoryName}</h1>
            <p className="text-xs text-neutral-500 mt-1">
              {isLoading ? 'กำลังโหลด...' : `${filteredProducts.length} รายการ`}
            </p>
          </div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 shrink-0 hidden sm:block">
            Category
          </span>
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="border border-neutral-200 rounded-md p-16 text-center space-y-4">
            <h3 className="text-base font-semibold text-neutral-900">
              ยังไม่มีสินค้าในหมวดหมู่นี้
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              ลองดูหมวดหมู่อื่น หรือกลับไปดูแคตตาล็อกสินค้าทั้งหมด
            </p>
            <Link href="/">
              <Button className="h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-sm px-5 rounded-md transition-colors border-0">
                ดูสินค้าทั้งหมด
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      <ProductQuickViewModal />
      <CartDrawer />
      <CheckoutModal />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <ShopProvider>
      <CategoryContent />
    </ShopProvider>
  );
}
