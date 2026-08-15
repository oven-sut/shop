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
  /** บริการ (เช่น รับทำเว็บไซต์) — ไม่แสดงในแคตาล็อกหน้าแรก และไม่นับ stock รวมของร้าน */
  isService?: boolean;
}

/** A product in the cart — still linked to the live product record. */
export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

/**
 * A line on a placed order. Unlike CartItem this is a snapshot: the name, image
 * and price are copied at checkout so an order never changes when a product is
 * later edited, renamed or deleted.
 */
export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedColor?: string;
}

/** สินค้าเป็นดิจิทัล ส่งมอบผ่านหน้าเว็บ จึงไม่มีข้อมูลจัดส่ง */
export interface CustomerInfo {
  name: string;
  email: string;
  note?: string;
}

export type OrderStatus = 'รอดำเนินการ' | 'กำลังจัดเตรียม' | 'จัดส่งแล้ว' | 'สำเร็จ' | 'ยกเลิก';

export type PaymentMethod = 'wallet' | 'promptpay' | 'credit_card' | 'bank_transfer' | 'cod';

export interface Order {
  id: string;
  createdAt: string;
  customer: CustomerInfo;
  items: OrderItem[];
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
  isActive: boolean;
}

export interface Wallet {
  balance: number;
  updatedAt: string;
}

export type WalletTransactionKind = 'topup' | 'purchase' | 'refund' | 'adjustment';

export interface WalletTransaction {
  id: string;
  kind: WalletTransactionKind;
  /** Positive credits the wallet, negative debits it. */
  amount: number;
  balanceAfter: number;
  reference?: string;
  note?: string;
  createdAt: string;
}

export interface Topup {
  id: string;
  amount: number;
  transRef: string;
  senderName?: string;
  receiverName?: string;
  transferredAt?: string;
  createdAt: string;
}
