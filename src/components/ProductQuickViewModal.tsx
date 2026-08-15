'use client';

import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { X, Star, ShoppingBag, Heart, ShieldCheck, Zap, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ProductQuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist, addReview, showToast } = useShop();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isWishlisted = isInWishlist(product.id);
  const mainImg = selectedImage || product.image;
  const galleryImages = [product.image, ...(product.gallery || [])];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // The reviewer is the signed-in account — no name field is sent.
    const res = await addReview(product.id, newRating, newComment);
    showToast(res.message, res.success ? 'success' : 'warning');

    if (res.success) setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 overflow-y-auto">
      <div
        className="relative bg-white border border-neutral-200 rounded-md max-w-4xl w-full max-h-[90vh] overflow-y-auto text-neutral-900 animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Modal Button */}
        <button
          onClick={() => {
            setQuickViewProduct(null);
            setSelectedImage(null);
            setQuantity(1);
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-md bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Left: Gallery & Image Preview */}
          <div className="md:col-span-6 space-y-3">
            <div className="relative aspect-square overflow-hidden bg-neutral-50 border border-neutral-200 rounded-md">
              <img
                src={mainImg}
                alt={product.name}
                // เหมือนการ์ดสินค้า: โลโก้ต้องเห็นครบ ไม่ใช่ถูกครอบตัดให้เต็มกรอบ
                className="w-full h-full object-contain p-8"
              />
              {product.badge && (
                <span className="absolute top-0 left-0 bg-neutral-900 text-white text-[10px] font-semibold tracking-[0.15em] px-2.5 py-1">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border shrink-0 transition-colors ${
                      mainImg === img
                        ? 'border-neutral-900'
                        : 'border-neutral-200 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Purchase Actions */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-neutral-400">
                <span>{product.category}</span>
                <span>·</span>
                <span className={product.stock > 0 ? 'text-neutral-900' : 'text-neutral-400 line-through'}>
                  {product.stock > 0 ? `คงเหลือ ${product.stock} ชิ้น` : 'สินค้าหมด'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-neutral-900 mt-2 tracking-tight">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Star className="w-4 h-4 fill-neutral-900 text-neutral-900" />
                <span className="font-semibold text-neutral-900">{product.rating}</span>
                <span className="text-xs text-neutral-400">
                  ({product.reviewsCount} ความคิดเห็นจากลูกค้า)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline flex-wrap gap-3 mt-5">
                <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  ฿{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">
                      ฿{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-neutral-900 border border-neutral-300 rounded-sm px-2 py-0.5">
                      ประหยัด ฿{(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-neutral-600 text-sm mt-5 leading-relaxed border-t border-neutral-100 pt-5">
                {product.description}
              </p>

              {/* Quantity Selector & Add to Cart */}
              {product.stock > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="flex items-center h-11 border border-neutral-300 rounded-md">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 h-full text-neutral-500 hover:text-neutral-900 transition-colors"
                      aria-label="ลดจำนวน"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-semibold text-sm text-neutral-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 h-full text-neutral-500 hover:text-neutral-900 transition-colors"
                      aria-label="เพิ่มจำนวน"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md transition-colors flex items-center justify-center gap-2 border-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>เพิ่มลงในตะกร้า</span>
                  </Button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`h-11 w-11 flex items-center justify-center rounded-md border transition-colors ${
                      isWishlisted
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'bg-white border-neutral-300 text-neutral-500 hover:text-neutral-900'
                    }`}
                    aria-label="รายการโปรด"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-white' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Guarantee Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500 pt-5 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" strokeWidth={1.5} />
                <span>ตรวจสอบก่อนส่งมอบทุกครั้ง</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neutral-900 shrink-0" strokeWidth={1.5} />
                <span>ได้รับทันทีหลังชำระเงิน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Specs & Reviews Section */}
        <div className="p-6 md:p-8 bg-neutral-50 border-t border-neutral-200">
          <div className="flex border-b border-neutral-200 gap-6 mb-6">
            {([
              { id: 'specs', label: 'ข้อมูลทางเทคนิค' },
              { id: 'reviews', label: `รีวิวจากผู้ใช้ (${product.reviewsCount})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 -mb-px text-sm transition-colors relative border-b-2 ${
                  activeTab === tab.id
                    ? 'text-neutral-900 font-semibold border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 rounded-md overflow-hidden">
              {Object.entries(product.specs || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-3 p-3 bg-white text-xs">
                  <span className="text-neutral-500">{key}</span>
                  <span className="text-neutral-900 font-medium text-right">{val}</span>
                </div>
              ))}
              {Object.keys(product.specs || {}).length === 0 && (
                <p className="p-4 bg-white text-xs text-neutral-400 text-center sm:col-span-2">
                  ยังไม่ได้ระบุข้อมูลทางเทคนิค
                </p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-5">
              {/* Write Review Form */}
              <form
                onSubmit={handleReviewSubmit}
                className="bg-white p-4 rounded-md border border-neutral-200 space-y-3"
              >
                <h4 className="text-sm font-semibold text-neutral-900">เขียนรีวิวสำหรับสินค้านี้</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center h-10 border border-neutral-200 rounded-md px-3 text-xs text-neutral-500">
                    รีวิวในชื่อ
                    <span className="font-semibold text-neutral-900 ml-1 truncate">
                      {user?.name ?? 'บัญชีของคุณ'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 h-10 border border-neutral-200 rounded-md px-3">
                    <span className="text-xs text-neutral-500">ให้คะแนน</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          aria-label={`${star} ดาว`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= newRating
                                ? 'fill-neutral-900 text-neutral-900'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="แบ่งปันประสบการณ์ใช้งานของคุณกับสินค้านี้..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-md p-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                  required
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="h-9 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs px-4 rounded-md transition-colors border-0"
                  >
                    ส่งรีวิว
                  </Button>
                </div>
              </form>

              {/* Review List */}
              <div className="space-y-2">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-white rounded-md border border-neutral-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900">{rev.userName}</span>
                        <span className="text-[10px] text-neutral-400">{rev.date}</span>
                      </div>
                      <div className="flex">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-neutral-900 text-neutral-900" />
                        ))}
                      </div>
                      <p className="text-neutral-600">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-6">
                    ยังไม่มีรีวิวสำหรับสินค้านี้ เป็นคนแรกที่ให้รีวิวเลย
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
