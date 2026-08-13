export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  description: string;
  specs: Record<string, string>;
  image: string;
  gallery?: string[];
  rating: number;
  reviewsCount: number;
  badge?: 'HOT' | 'NEW' | 'SALE' | 'LIMITED';
  reviews?: Review[];
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  note?: string;
}

export type OrderStatus = 'รอดำเนินการ' | 'กำลังจัดเตรียม' | 'จัดส่งแล้ว' | 'สำเร็จ' | 'ยกเลิก';

export type PaymentMethod = 'promptpay' | 'credit_card' | 'bank_transfer' | 'cod';

export interface Order {
  id: string;
  createdAt: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  trackingNumber?: string;
  couponCode?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minSpend: number;
  description: string;
}
