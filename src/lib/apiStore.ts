import { Product, Order, OrderStatus, Review, Coupon } from '../types/ecommerce';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_COUPONS } from '../data/initialData';

// Shared server-side in-memory cache for API endpoints
let inMemoryProducts: Product[] = [...INITIAL_PRODUCTS];
let inMemoryOrders: Order[] = [...INITIAL_ORDERS];
let inMemoryCoupons: Coupon[] = [...INITIAL_COUPONS];

export function getProductsStore(): Product[] {
  return inMemoryProducts;
}

export function getProductByIdStore(id: string): Product | undefined {
  return inMemoryProducts.find((p) => p.id === id);
}

export function addProductStore(prodData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>): Product {
  const newProduct: Product = {
    ...prodData,
    id: `prod-${Date.now()}`,
    rating: 5.0,
    reviewsCount: 0,
    reviews: []
  };
  inMemoryProducts = [newProduct, ...inMemoryProducts];
  return newProduct;
}

export function updateProductStore(id: string, updates: Partial<Product>): Product | null {
  const index = inMemoryProducts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  inMemoryProducts[index] = { ...inMemoryProducts[index], ...updates };
  return inMemoryProducts[index];
}

export function deleteProductStore(id: string): boolean {
  const initialLen = inMemoryProducts.length;
  inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id);
  return inMemoryProducts.length < initialLen;
}

export function addReviewStore(productId: string, rating: number, comment: string, userName: string): Review | null {
  const product = getProductByIdStore(productId);
  if (!product) return null;

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    userName: userName || 'ลูกค้าผู้ใช้งานจริง',
    rating,
    comment,
    date: new Date().toISOString().substring(0, 10)
  };

  const currentReviews = product.reviews || [];
  const updatedReviews = [newReview, ...currentReviews];
  const newAvgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

  updateProductStore(productId, {
    rating: Number(newAvgRating.toFixed(1)),
    reviewsCount: updatedReviews.length,
    reviews: updatedReviews
  });

  return newReview;
}

export function getOrdersStore(): Order[] {
  return inMemoryOrders;
}

export function getOrderByIdStore(id: string): Order | undefined {
  return inMemoryOrders.find((o) => o.id === id);
}

export function createOrderStore(orderData: Omit<Order, 'id' | 'createdAt'>): Order {
  const newOrder: Order = {
    ...orderData,
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  // Deduct product inventory stock
  orderData.items.forEach((item) => {
    const p = getProductByIdStore(item.product.id);
    if (p) {
      updateProductStore(p.id, { stock: Math.max(0, p.stock - item.quantity) });
    }
  });

  inMemoryOrders = [newOrder, ...inMemoryOrders];
  return newOrder;
}

export function updateOrderStatusStore(id: string, status: OrderStatus, trackingNumber?: string): Order | null {
  const index = inMemoryOrders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  inMemoryOrders[index] = {
    ...inMemoryOrders[index],
    status,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : inMemoryOrders[index].trackingNumber
  };

  return inMemoryOrders[index];
}

export function getCouponsStore(): Coupon[] {
  return inMemoryCoupons;
}

export function validateCouponStore(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; message: string } {
  const cleanCode = code.trim().toUpperCase();
  const coupon = inMemoryCoupons.find((c) => c.code === cleanCode);
  if (!coupon) {
    return { valid: false, message: 'รหัสส่วนลดไม่ถูกต้องหรือหมดอายุ' };
  }
  if (subtotal < coupon.minSpend) {
    return { valid: false, message: `รหัสนี้ใช้ได้เมื่อยอดขั้นต่ำ ฿${coupon.minSpend.toLocaleString()}` };
  }
  return { valid: true, coupon, message: 'ใช้รหัสส่วนลดสำเร็จ!' };
}

export function getStatsStore() {
  const totalRevenue = inMemoryOrders.reduce((sum, ord) => sum + (ord.isPaid ? ord.totalAmount : 0), 0);
  const totalOrders = inMemoryOrders.length;
  const totalProducts = inMemoryProducts.length;
  const lowStockCount = inMemoryProducts.filter((p) => p.stock <= 5).length;

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockCount,
    monthlySalesTrend: [
      { month: 'ม.ค.', sales: 45000 },
      { month: 'ก.พ.', sales: 52000 },
      { month: 'มี.ค.', sales: 61000 },
      { month: 'เม.ย.', sales: 58000 },
      { month: 'พ.ค.', sales: 74000 },
      { month: 'มิ.ย.', sales: 89000 },
      { month: 'ก.ค.', sales: 95000 },
      { month: 'ส.ค.', sales: totalRevenue || 112000 }
    ]
  };
}
