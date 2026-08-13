'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, CartItem, CustomerInfo, OrderStatus, PaymentMethod, Coupon, Review } from '../types/ecommerce';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_COUPONS } from '../data/initialData';
import { createClient } from '../lib/supabase/client';

interface Toast {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

interface ShopContextType {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  wishlist: string[];
  searchQuery: string;
  selectedCategory: string;
  quickViewProduct: Product | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  activeCoupon: Coupon | null;
  toasts: Toast[];

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
  shippingFee: number;
  cartTotal: number;

  // Wishlist actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Coupon
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Order actions
  createOrder: (customer: CustomerInfo, paymentMethod: PaymentMethod) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => void;

  // Product Admin actions
  addProduct: (newProd: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => Product;
  updateProduct: (updatedProd: Product) => void;
  deleteProduct: (id: string) => void;
  addReview: (productId: string, rating: number, comment: string, userName: string) => void;

  // UI Toast
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const supabase = createClient();

  // Load state from localStorage or initialData
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('owen_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      const savedOrders = localStorage.getItem('owen_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        setOrders(INITIAL_ORDERS);
      }

      const savedCart = localStorage.getItem('owen_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedWishlist = localStorage.getItem('owen_wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch {
      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync quickViewProduct with latest products state
  useEffect(() => {
    if (quickViewProduct) {
      const updated = products.find((p) => p.id === quickViewProduct.id);
      if (updated) {
        setQuickViewProduct(updated);
      } else {
        setQuickViewProduct(null);
      }
    }
  }, [products]);

  // Save changes to localStorage only after initial load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('owen_products', JSON.stringify(products));
    }
  }, [products, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('owen_orders', JSON.stringify(orders));
    }
  }, [orders, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('owen_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('owen_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Auto invalidate coupon if cart subtotal falls below minimum spend
  useEffect(() => {
    if (activeCoupon && cartSubtotal < activeCoupon.minSpend) {
      setActiveCoupon(null);
      showToast(`ยกเลิกคูปอง "${activeCoupon.code}" เนื่องจากยอดสั่งซื้อไม่ถึงขั้นต่ำ ฿${activeCoupon.minSpend.toLocaleString()}`, 'warning');
    }
  }, [cartSubtotal, activeCoupon]);

  const discountAmount = activeCoupon
    ? activeCoupon.discountPercent > 0
      ? Math.round((cartSubtotal * activeCoupon.discountPercent) / 100)
      : 0
    : 0;

  const isFreeShipCoupon = activeCoupon?.code === 'FREESHIP';
  const shippingFee = cartSubtotal === 0 ? 0 : cartSubtotal >= 500 || isFreeShipCoupon ? 0 : 50;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // Cart Handlers
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
          selectedColor: selectedColor || updated[existingIndex].selectedColor
        };
        return updated;
      } else {
        return [...prev, { product, quantity: Math.min(quantity, product.stock), selectedColor }];
      }
    });

    showToast(`เพิ่ม "${product.name}" เข้าตะกร้าเรียบร้อยแล้ว`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('ลบรายการสินค้าเรียบร้อยแล้ว', 'info');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(newQty, item.product.stock) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  // Wishlist Handlers
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('ถอดออกจากรายการโปรดแล้ว', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('บันทึกในรายการโปรดแล้ว', 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Coupon Handlers
  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = INITIAL_COUPONS.find((c) => c.code === cleanCode);
    if (!found) {
      return { success: false, message: 'รหัสส่วนลดไม่ถูกต้องหรือหมดอายุ' };
    }
    if (cartSubtotal < found.minSpend) {
      return {
        success: false,
        message: `รหัสนี้ใช้ได้เมื่อยอดขั้นต่ำ ฿${found.minSpend.toLocaleString()}`
      };
    }

    setActiveCoupon(found);
    showToast(`ใช้คูปอง "${found.code}" เรียบร้อยแล้ว`, 'success');
    return { success: true, message: 'ใช้โค้ดส่วนลดสำเร็จ!' };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    showToast('ยกเลิกการใช้โค้ดส่วนลดแล้ว', 'info');
  };

  // Order Handlers
  const createOrder = (customer: CustomerInfo, paymentMethod: PaymentMethod): Order => {
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customer,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: discountAmount,
      shippingFee,
      totalAmount: cartTotal,
      status: 'รอดำเนินการ',
      paymentMethod,
      isPaid: paymentMethod === 'promptpay' || paymentMethod === 'credit_card',
      couponCode: activeCoupon?.code
    };

    // Update Product Stock
    setProducts((prev) =>
      prev.map((p) => {
        const itemInCart = cart.find((ci) => ci.product.id === p.id);
        if (itemInCart) {
          return { ...p, stock: Math.max(0, p.stock - itemInCart.quantity) };
        }
        return p;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setIsCheckoutOpen(false);
    showToast(`สร้างคำสั่งซื้อ #${newOrder.id} สำเร็จ!`, 'success');

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status,
            trackingNumber: trackingNumber !== undefined ? trackingNumber : ord.trackingNumber
          };
        }
        return ord;
      })
    );
    showToast(`อัปเดตสถานะคำสั่งซื้อ #${orderId} เป็น "${status}" แล้ว`, 'success');
  };

  // Product Admin Operations
  const addProduct = (newProdData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>): Product => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      reviews: []
    };

    setProducts((prev) => [newProduct, ...prev]);
    showToast(`เพิ่มสินค้าใหม่ "${newProduct.name}" สำเร็จ`, 'success');
    return newProduct;
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    showToast(`แก้ไขสินค้า "${updatedProd.name}" เรียบร้อยแล้ว`, 'success');
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`ลบสินค้า "${target?.name || id}" เรียบร้อยแล้ว`, 'info');
  };

  const addReview = (productId: string, rating: number, comment: string, userName: string) => {
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      userName: userName || 'ลูกค้าผู้ใช้งานจริง',
      rating,
      comment,
      date: new Date().toISOString().substring(0, 10)
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const currentReviews = p.reviews || [];
          const updatedReviews = [newRev, ...currentReviews];
          const newAvgRating =
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
          return {
            ...p,
            rating: Number(newAvgRating.toFixed(1)),
            reviewsCount: updatedReviews.length,
            reviews: updatedReviews
          };
        }
        return p;
      })
    );

    showToast('ขอบคุณสำหรับรีวิวของคุณ!', 'success');
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        orders,
        cart,
        wishlist,
        searchQuery,
        selectedCategory,
        quickViewProduct,
        isCartOpen,
        isCheckoutOpen,
        activeCoupon,
        toasts,
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
        shippingFee,
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
        addReview,
        showToast
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
