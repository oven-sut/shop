'use client';

import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { X, Star, ShoppingBag, Heart, ShieldCheck, Truck, Plus, Minus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const ProductQuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist, addReview } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isWishlisted = isInWishlist(product.id);
  const mainImg = selectedImage || product.image;
  const galleryImages = [product.image, ...(product.gallery || [])];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addReview(product.id, newRating, newComment, userName);
    setNewComment('');
    setUserName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Modal Button */}
        <button
          onClick={() => {
            setQuickViewProduct(null);
            setSelectedImage(null);
            setQuantity(1);
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left: Gallery & Image Preview */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={mainImg}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <Badge className="absolute top-4 left-4 bg-indigo-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-lg border-0">
                  {product.badge}
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      mainImg === img ? 'border-indigo-600 ring-2 ring-indigo-600/30' : 'border-slate-200 opacity-60 hover:opacity-100'
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
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                <span>{product.category}</span>
                <span>•</span>
                <span className={product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {product.stock > 0 ? `สต็อกคงเหลือ ${product.stock} ชิ้น` : 'สินค้าหมด'}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5 leading-snug">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-sm font-extrabold ml-1 text-slate-800">{product.rating}</span>
                </div>
                <span className="text-xs text-slate-500">({product.reviewsCount} ความคิดเห็นจากลูกค้า)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-black text-slate-900">
                  ฿{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through">
                    ฿{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.originalPrice && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 text-xs font-bold border-red-200">
                    ประหยัด ฿{(product.originalPrice - product.price).toLocaleString()}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-sm mt-4 leading-relaxed border-t border-slate-100 pt-4">
                {product.description}
              </p>

              {/* Quantity Selector & Add to Cart */}
              {product.stock > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 border-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>เพิ่มลงในตะกร้า</span>
                  </Button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 rounded-xl border transition-all ${
                      isWishlisted
                        ? 'bg-pink-50 border-pink-200 text-pink-600'
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-pink-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-600' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Guarantee Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>รับประกันศูนย์ไทย 1 ปี</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>ส่งฟรีเมื่อซื้อครบ ฿500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Specs & Reviews Section */}
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 rounded-b-3xl">
          <div className="flex border-b border-slate-200 gap-6 mb-6">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'specs' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ข้อมูลทางเทคนิค (Specs)
              {activeTab === 'specs' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'reviews' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              รีวิวจากผู้ใช้ ({product.reviewsCount})
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {Object.entries(product.specs || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">{key}</span>
                  <span className="text-slate-900 font-semibold">{val}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Write Review Form */}
              <form onSubmit={handleReviewSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  เขียนรีวิวสำหรับสินค้านี้
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="ชื่อของคุณ (เช่น คุณสมชาย)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-900"
                    required
                  />
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                    <span className="text-xs text-slate-500">ให้คะแนน:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="text-amber-500"
                        >
                          <Star className={`w-4 h-4 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`} />
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  required
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors border-0"
                  >
                    ส่งรีวิว
                  </Button>
                </div>
              </form>

              {/* Review List */}
              <div className="space-y-3">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rev.userName}</span>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 mt-1">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีรีวิวสำหรับสินค้านี้ เป็นคนแรกที่ให้รีวิวเลย!</p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
