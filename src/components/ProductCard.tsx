'use client';

import React from 'react';
import { Product } from '../types/ecommerce';
import { useShop } from '../context/ShopContext';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useShop();

  const isWishlisted = isInWishlist(product.id);
  // ของที่ขายไม่จำกัดไม่มีวันหมด — คอลัมน์ stock ของมันเป็นเลขที่ไม่ได้ใช้
  const isOutOfStock = !product.isUnlimited && product.stock <= 0;
  const isLowStock = !product.isUnlimited && product.stock > 0 && product.stock <= 5;

  return (
    <article className="group relative bg-white border border-neutral-200 rounded-md overflow-hidden hover:border-neutral-900 transition-colors flex flex-col h-full">
      {/* Product Image Container
          สินค้าเป็นโลโก้แอป/เกม ไม่ใช่ภาพถ่าย: กรอบสี่เหลี่ยมจัตุรัสเต็มความกว้าง
          บวก object-cover ทำให้โลโก้ใหญ่จนล้นการ์ดและถูกครอบตัดขอบทิ้ง
          กรอบเตี้ยลงเป็น 4:3 กับ object-contain จึงเห็นโลโก้ครบทั้งอันในขนาดที่พอดี */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-neutral-50 cursor-pointer border-b border-neutral-200"
        onClick={() => setQuickViewProduct(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 sm:p-6"
        />

        {/* Badge — one flat treatment for every kind; the word carries the meaning. */}
        {product.badge && (
          <span className="absolute top-0 left-0 z-10 bg-neutral-900 text-white text-[10px] font-semibold tracking-[0.15em] px-2.5 py-1">
            {product.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-md transition-colors z-10 ${
            isWishlisted
              ? 'bg-neutral-900 text-white'
              : 'bg-white/90 text-neutral-500 hover:text-neutral-900 border border-neutral-200'
          }`}
          title={isWishlisted ? 'ถอดออกจากรายการโปรด' : 'บันทึกในรายการโปรด'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Quick View Hover Layer */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-neutral-900/90 text-white text-xs font-medium text-center py-2.5 pointer-events-none">
          ดูรายละเอียด
        </div>
      </div>

      {/* Product Details */}
      {/* Two cards sit side by side on a phone, so the inner padding and the gaps
          come down a step to leave the name and price room to breathe. */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category & Stock */}
          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
            <span className="text-neutral-400 truncate">{product.category}</span>
            {isOutOfStock ? (
              <span className="text-neutral-400 line-through shrink-0">หมดสต็อก</span>
            ) : product.isUnlimited ? (
              <span className="text-neutral-400 shrink-0">พร้อมส่งทันที</span>
            ) : isLowStock ? (
              <span className="text-neutral-900 font-medium shrink-0">
                เหลือ {product.stock} ชิ้น
              </span>
            ) : (
              <span className="text-neutral-400 shrink-0">มีสินค้า</span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => setQuickViewProduct(product)}
            className="font-semibold text-neutral-900 text-sm mt-1.5 line-clamp-2 cursor-pointer hover:underline underline-offset-4 decoration-neutral-300"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <Star className="w-3.5 h-3.5 fill-neutral-900 text-neutral-900" />
            <span className="font-semibold text-neutral-900">{product.rating}</span>
            <span className="text-neutral-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline flex-wrap gap-x-2 min-w-0">
            <span className="text-sm sm:text-base font-bold text-neutral-900">
              ฿{product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                ฿{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <Button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            size="icon"
            className={
              isOutOfStock
                ? 'size-9 shrink-0 rounded-md bg-neutral-100 text-neutral-300 border border-neutral-200'
                : 'size-9 shrink-0 rounded-md bg-neutral-900 hover:bg-neutral-700 text-white border-0'
            }
            title={isOutOfStock ? 'สินค้าหมด' : 'หยิบใส่ตะกร้า'}
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </article>
  );
};
