'use client';

import React from 'react';
import { Product } from '../types/ecommerce';
import { useShop } from '../context/ShopContext';
import { Heart, ShoppingBag, Eye, Star, Flame, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useShop();

  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Card className="group relative bg-white border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setQuickViewProduct(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
        />

        {/* Badge Overlay */}
        {product.badge && (
          <div className="absolute top-3 left-3 flex gap-1 z-10">
            <Badge
              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border-0 ${
                product.badge === 'HOT'
                  ? 'bg-red-500 text-white'
                  : product.badge === 'NEW'
                  ? 'bg-indigo-600 text-white'
                  : product.badge === 'SALE'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {product.badge === 'HOT' && <Flame className="w-3 h-3 fill-white" />}
              {product.badge === 'NEW' && <Sparkles className="w-3 h-3" />}
              {product.badge}
            </Badge>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md z-10 ${
            isWishlisted
              ? 'bg-pink-500 text-white'
              : 'bg-white/80 text-slate-600 hover:bg-white hover:text-pink-600'
          }`}
          title={isWishlisted ? 'ถอดออกจากรายการโปรด' : 'บันทึกในรายการโปรด'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Quick View Hover Layer */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-1.5 backdrop-blur-sm border border-slate-200">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            ดูรายละเอียด
          </span>
        </div>
      </div>

      {/* Product Details */}
      <CardContent className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Category & Stock Tag */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium">{product.category}</span>
            {isOutOfStock ? (
              <Badge variant="destructive" className="text-[10px] bg-red-50 text-red-600 border border-red-200">
                หมดสต็อก
              </Badge>
            ) : isLowStock ? (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                เหลือเพียง {product.stock} ชิ้น!
              </Badge>
            ) : (
              <span className="text-emerald-600 font-semibold text-[10px]">มีสินค้าในสต็อก</span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => setQuickViewProduct(product)}
            className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-xs font-extrabold ml-1 text-slate-800">{product.rating}</span>
            </div>
            <span className="text-xs text-slate-400">({product.reviewsCount} รีวิว)</span>
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900">
                ฿{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ฿{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            size="icon"
            className={
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95 border-0'
            }
            title={isOutOfStock ? 'สินค้าหมด' : 'หยิบใส่ตะกร้า'}
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
