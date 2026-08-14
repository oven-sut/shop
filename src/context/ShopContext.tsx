'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  CartItem,
  Coupon,
  CustomerInfo,
  Order,
  OrderStatus,
  Product,
  WalletTransaction,
} from '../types/ecommerce';
import { DEFAULT_SETTINGS, StoreSettings } from '../lib/settings';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

export interface ActionResult {
  success: boolean;
  message: string;
}

interface ShopContextType {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  settings: StoreSettings;
  isLoading: boolean;

  cart: CartItem[];
  wishlist: string[];
  searchQuery: string;
  selectedCategory: string;
  quickViewProduct: Product | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  activeCoupon: Coupon | null;
  toasts: Toast[];

  // Wallet
  balance: number;
  walletTransactions: WalletTransaction[];
  refreshWallet: () => Promise<void>;
  topUp: (amount: number, slip: File | null, payload?: string) => Promise<ActionResult>;

  // Setters & Filters
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  setQuickViewProduct: (prod: Product | null) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  setIsCheckoutOpen: (isOpen: boolean) => void;

  // Cart actions
  addToCart: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  discountAmount: number;
  cartTotal: number;

  // Wishlist actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Coupon
  applyCoupon: (code: string) => Promise<ActionResult>;
  removeCoupon: () => void;

  // Orders
  createOrder: (customer: CustomerInfo) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => Promise<void>;

  // Admin
  addProduct: (product: Partial<Product>) => Promise<Product | null>;
  updateProduct: (product: Partial<Product> & { id: string }) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<void>;
  uploadProductImage: (file: File) => Promise<string | null>;
  saveSettings: (patch: Partial<StoreSettings>) => Promise<ActionResult>;
  addReview: (productId: string, rating: number, comment: string) => Promise<ActionResult>;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;

  // UI Toast
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

/** Every endpoint answers `{ success, data?, message?, error? }`. */
async function callApi<T>(
  input: string,
  init?: RequestInit
): Promise<{ ok: boolean; data?: T; message: string }> {
  try {
    const response = await fetch(input, init);
    const body = await response.json().catch(() => ({}));

    return {
      ok: response.ok && body.success !== false,
      data: body.data as T,
      message: body.message || body.error || (response.ok ? '' : `เกิดข้อผิดพลาด (${response.status})`),
    };
  } catch {
    return { ok: false, message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
  }
}

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const [balance, setBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);

  // Cart and wishlist are the only things that stay in the browser — they belong
  // to the visitor, not to the shop, and are worthless to anyone else.
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    },
    []
  );

  const refreshProducts = useCallback(async () => {
    const { data } = await callApi<Product[]>('/api/products');
    if (data) setProducts(data);
  }, []);

  const refreshOrders = useCallback(async () => {
    const { data } = await callApi<Order[]>('/api/orders');
    if (data) setOrders(data);
  }, []);

  const refreshWallet = useCallback(async () => {
    const { data } = await callApi<{ balance: number; transactions: WalletTransaction[] }>(
      '/api/wallet'
    );
    if (data) {
      setBalance(data.balance);
      setWalletTransactions(data.transactions ?? []);
    }
  }, []);

  /* localStorage does not exist during the server render, so cart and wishlist
     can only be read after mount. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCart(readStored<CartItem[]>('neo_cart', []));
    setWishlist(readStored<string[]>('neo_wishlist', []));
    setIsHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Initial load. The storefront is client-rendered and every endpoint is
     per-user (RLS), so the first fetch happens on mount; `active` drops the
     result if the provider unmounts while the requests are in flight. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let active = true;

    const load = async () => {
      // The coupon list is admin-only — it is the full set of live discount
      // codes, and only the admin dashboard renders it. Asking as a customer
      // would just collect a 403.
      const [productList, orderList, couponList, storeSettings] = await Promise.all([
        callApi<Product[]>('/api/products'),
        callApi<Order[]>('/api/orders'),
        isAdmin ? callApi<Coupon[]>('/api/coupons') : Promise.resolve({ ok: true, data: [] }),
        callApi<StoreSettings>('/api/settings'),
      ]);

      if (!active) return;

      if (productList.data) setProducts(productList.data);
      if (orderList.data) setOrders(orderList.data);
      if (couponList.data) setCoupons(couponList.data);
      if (storeSettings.data) setSettings(storeSettings.data);
      setIsLoading(false);
    };

    load();
    refreshWallet();

    return () => {
      active = false;
    };
  }, [refreshWallet, isAdmin]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isHydrated) localStorage.setItem('neo_cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem('neo_wishlist', JSON.stringify(wishlist));
  }, [wishlist, isHydrated]);

  // Derived from `products`, so the quick-view modal always shows current stock.
  const quickViewProduct = quickViewProductId
    ? products.find((p) => p.id === quickViewProductId) ?? null
    : null;

  const setQuickViewProduct = (product: Product | null) =>
    setQuickViewProductId(product?.id ?? null);

  // ── Cart maths ────────────────────────────────────────────────────────────
  const subtotalOf = (items: CartItem[]) =>
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const cartSubtotal = subtotalOf(cart);

  // A coupon only counts while the cart still meets its minimum spend. Deriving it
  // (instead of clearing the state) means it applies again if the cart grows back.
  const activeCoupon =
    selectedCoupon && cartSubtotal >= selectedCoupon.minSpend ? selectedCoupon : null;

  const warnIfCouponLapses = (nextCart: CartItem[]) => {
    if (!activeCoupon) return;
    if (subtotalOf(nextCart) >= activeCoupon.minSpend) return;

    showToast(
      `พักการใช้คูปอง "${activeCoupon.code}" ชั่วคราว เนื่องจากยอดสั่งซื้อไม่ถึงขั้นต่ำ ฿${activeCoupon.minSpend.toLocaleString()}`,
      'warning'
    );
  };

  const discountAmount = activeCoupon
    ? Math.round((cartSubtotal * activeCoupon.discountPercent) / 100)
    : 0;

  // ไม่มีค่าจัดส่ง สินค้าเป็นดิจิทัลส่งมอบทันที
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  // ── Cart actions ──────────────────────────────────────────────────────────
  const addToCart = (product: Product, quantity = 1, selectedColor?: string) => {
    if (product.stock <= 0) {
      showToast('สินค้าชิ้นนี้หมดสต็อกชั่วคราว', 'warning');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, product.stock),
          selectedColor: selectedColor || updated[existingIndex].selectedColor,
        };
        return updated;
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock), selectedColor }];
    });

    showToast(`เพิ่ม "${product.name}" เข้าตะกร้าเรียบร้อยแล้ว`, 'success');
  };

  const removeFromCart = (productId: string) => {
    const nextCart = cart.filter((item) => item.product.id !== productId);
    setCart(nextCart);
    showToast('ลบรายการสินค้าเรียบร้อยแล้ว', 'info');
    warnIfCouponLapses(nextCart);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const nextCart = cart.flatMap((item) => {
      if (item.product.id !== productId) return [item];

      const newQty = item.quantity + delta;
      if (newQty <= 0) return [];
      return [{ ...item, quantity: Math.min(newQty, item.product.stock) }];
    });

    setCart(nextCart);
    warnIfCouponLapses(nextCart);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCoupon(null);
  };

  // ── Wishlist ──────────────────────────────────────────────────────────────
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('ถอดออกจากรายการโปรดแล้ว', 'info');
        return prev.filter((id) => id !== productId);
      }
      showToast('บันทึกในรายการโปรดแล้ว', 'success');
      return [...prev, productId];
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // ── Coupons ───────────────────────────────────────────────────────────────
  const applyCoupon = async (code: string): Promise<ActionResult> => {
    const result = await callApi<Coupon>('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal: cartSubtotal }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.message || 'ใช้รหัสส่วนลดไม่สำเร็จ' };
    }

    setSelectedCoupon(result.data);
    showToast(`ใช้คูปอง "${result.data.code}" เรียบร้อยแล้ว`, 'success');
    return { success: true, message: result.message || 'ใช้โค้ดส่วนลดสำเร็จ!' };
  };

  const removeCoupon = () => {
    setSelectedCoupon(null);
    showToast('ยกเลิกการใช้โค้ดส่วนลดแล้ว', 'info');
  };

  // ── Wallet ────────────────────────────────────────────────────────────────
  const topUp = async (amount: number, slip: File | null, payload?: string): Promise<ActionResult> => {
    const form = new FormData();
    form.append('amount', String(amount));
    if (slip) form.append('slip', slip);
    if (payload) form.append('payload', payload);

    const result = await callApi<{ balance: number }>('/api/topups', { method: 'POST', body: form });

    if (!result.ok) return { success: false, message: result.message || 'เติมเงินไม่สำเร็จ' };

    await refreshWallet();
    return { success: true, message: result.message || 'เติมเงินสำเร็จ' };
  };

  // ── Orders ────────────────────────────────────────────────────────────────
  const createOrder = async (customer: CustomerInfo): Promise<Order | null> => {
    const result = await callApi<Order>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        // Only ids and quantities: the server prices the order from the database.
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
        })),
        couponCode: activeCoupon?.code,
      }),
    });

    if (!result.ok || !result.data) {
      showToast(result.message || 'สั่งซื้อไม่สำเร็จ', 'warning');
      return null;
    }

    setOrders((prev) => [result.data as Order, ...prev]);
    clearCart();
    setIsCheckoutOpen(false);
    await Promise.all([refreshWallet(), refreshProducts()]);
    showToast(`สร้างคำสั่งซื้อ #${result.data.id} สำเร็จ!`, 'success');

    return result.data;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ) => {
    const result = await callApi<Order>(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNumber }),
    });

    if (!result.ok || !result.data) {
      showToast(result.message || 'อัปเดตสถานะไม่สำเร็จ', 'warning');
      return;
    }

    setOrders((prev) => prev.map((order) => (order.id === orderId ? result.data! : order)));
    showToast(`อัปเดตสถานะคำสั่งซื้อ #${orderId} เป็น "${status}" แล้ว`, 'success');
  };

  // ── Admin ─────────────────────────────────────────────────────────────────
  const addProduct = async (product: Partial<Product>): Promise<Product | null> => {
    const result = await callApi<Product>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!result.ok || !result.data) {
      showToast(result.message || 'เพิ่มสินค้าไม่สำเร็จ', 'warning');
      return null;
    }

    setProducts((prev) => [result.data as Product, ...prev]);
    showToast(`เพิ่มสินค้าใหม่ "${result.data.name}" สำเร็จ`, 'success');
    return result.data;
  };

  const updateProduct = async (
    product: Partial<Product> & { id: string }
  ): Promise<Product | null> => {
    const result = await callApi<Product>(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!result.ok || !result.data) {
      showToast(result.message || 'แก้ไขสินค้าไม่สำเร็จ', 'warning');
      return null;
    }

    setProducts((prev) => prev.map((p) => (p.id === product.id ? result.data! : p)));
    showToast(`แก้ไขสินค้า "${result.data.name}" เรียบร้อยแล้ว`, 'success');
    return result.data;
  };

  const deleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    const result = await callApi(`/api/products/${id}`, { method: 'DELETE' });

    if (!result.ok) {
      showToast(result.message || 'ลบสินค้าไม่สำเร็จ', 'warning');
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`ลบสินค้า "${target?.name || id}" เรียบร้อยแล้ว`, 'info');
  };

  const uploadProductImage = async (file: File): Promise<string | null> => {
    const form = new FormData();
    form.append('file', file);

    const result = await callApi<{ url: string }>('/api/uploads', { method: 'POST', body: form });

    if (!result.ok || !result.data) {
      showToast(result.message || 'อัปโหลดรูปไม่สำเร็จ', 'warning');
      return null;
    }

    return result.data.url;
  };

  const saveSettings = async (patch: Partial<StoreSettings>): Promise<ActionResult> => {
    const result = await callApi<StoreSettings>('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.message || 'บันทึกการตั้งค่าไม่สำเร็จ' };
    }

    setSettings(result.data);
    return { success: true, message: result.message || 'บันทึกการตั้งค่าแล้ว' };
  };

  const addReview = async (
    productId: string,
    rating: number,
    comment: string
  ): Promise<ActionResult> => {
    const result = await callApi(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });

    if (!result.ok) return { success: false, message: result.message || 'ส่งรีวิวไม่สำเร็จ' };

    await refreshProducts();
    return { success: true, message: result.message || 'ส่งรีวิวสำเร็จ' };
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        orders,
        coupons,
        settings,
        isLoading,
        cart,
        wishlist,
        searchQuery,
        selectedCategory,
        quickViewProduct,
        isCartOpen,
        isCheckoutOpen,
        activeCoupon,
        toasts,
        balance,
        walletTransactions,
        refreshWallet,
        topUp,
        setSearchQuery,
        setSelectedCategory,
        setQuickViewProduct,
        setIsCartOpen,
        setIsCheckoutOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        discountAmount,
        cartTotal,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
        createOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        uploadProductImage,
        saveSettings,
        addReview,
        refreshProducts,
        refreshOrders,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
