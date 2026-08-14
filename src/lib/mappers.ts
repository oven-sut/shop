import {
  Coupon,
  Order,
  OrderItem,
  Product,
  Review,
  Topup,
  WalletTransaction,
} from '../types/ecommerce';

/**
 * Postgres ↔ app shape. The database uses snake_case and `numeric` (which
 * supabase-js hands back as a string to avoid float rounding), the UI uses
 * camelCase numbers.
 */
type Row = Record<string, unknown>;

const num = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const optionalStr = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

export function toReview(row: Row): Review {
  return {
    id: str(row.id),
    userName: str(row.user_name, 'ลูกค้า'),
    rating: num(row.rating),
    comment: str(row.comment),
    date: str(row.created_at).slice(0, 10),
  };
}

export function toProduct(row: Row): Product {
  const reviews = Array.isArray(row.product_reviews)
    ? (row.product_reviews as Row[]).map(toReview)
    : undefined;

  return {
    id: str(row.id),
    name: str(row.name),
    category: str(row.category),
    price: num(row.price),
    originalPrice: row.original_price == null ? undefined : num(row.original_price),
    stock: num(row.stock),
    description: str(row.description),
    specs: (row.specs as Record<string, string>) ?? {},
    image: str(row.image),
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
    rating: num(row.rating),
    reviewsCount: num(row.reviews_count),
    badge: (optionalStr(row.badge) as Product['badge']) ?? undefined,
    reviews,
    isFeatured: Boolean(row.is_featured),
  };
}

export function toOrderItem(row: Row): OrderItem {
  return {
    productId: str(row.product_id),
    name: str(row.name),
    image: str(row.image),
    unitPrice: num(row.unit_price),
    quantity: num(row.quantity),
    selectedColor: optionalStr(row.selected_color),
  };
}

export function toOrder(row: Row): Order {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    customer: row.customer as Order['customer'],
    items: Array.isArray(row.items) ? (row.items as Row[]).map(toOrderItem) : [],
    subtotal: num(row.subtotal),
    discount: num(row.discount),
    shippingFee: num(row.shipping_fee),
    totalAmount: num(row.total_amount),
    status: str(row.status) as Order['status'],
    paymentMethod: str(row.payment_method, 'wallet') as Order['paymentMethod'],
    isPaid: Boolean(row.is_paid),
    trackingNumber: optionalStr(row.tracking_number),
    couponCode: optionalStr(row.coupon_code),
  };
}

export function toCoupon(row: Row): Coupon {
  return {
    code: str(row.code),
    discountPercent: num(row.discount_percent),
    minSpend: num(row.min_spend),
    description: str(row.description),
    isActive: Boolean(row.is_active),
  };
}

export function toWalletTransaction(row: Row): WalletTransaction {
  return {
    id: str(row.id),
    kind: str(row.kind, 'adjustment') as WalletTransaction['kind'],
    amount: num(row.amount),
    balanceAfter: num(row.balance_after),
    reference: optionalStr(row.reference),
    note: optionalStr(row.note),
    createdAt: str(row.created_at),
  };
}

export function toTopup(row: Row): Topup {
  return {
    id: str(row.id),
    amount: num(row.amount),
    transRef: str(row.trans_ref),
    senderName: optionalStr(row.sender_name),
    receiverName: optionalStr(row.receiver_name),
    transferredAt: optionalStr(row.transferred_at),
    createdAt: str(row.created_at),
  };
}

/** Only the columns an admin may set — keeps client-supplied junk out of the table. */
export function toProductRow(input: Row): Row {
  const row: Row = {};

  if (input.name !== undefined) row.name = str(input.name);
  if (input.category !== undefined) row.category = str(input.category);
  if (input.price !== undefined) row.price = num(input.price);
  if (input.originalPrice !== undefined)
    row.original_price = input.originalPrice === null || input.originalPrice === ''
      ? null
      : num(input.originalPrice);
  if (input.stock !== undefined) row.stock = Math.trunc(num(input.stock));
  if (input.description !== undefined) row.description = str(input.description);
  if (input.specs !== undefined) row.specs = input.specs ?? {};
  if (input.image !== undefined) row.image = str(input.image);
  if (input.gallery !== undefined) row.gallery = Array.isArray(input.gallery) ? input.gallery : [];
  if (input.badge !== undefined) row.badge = optionalStr(input.badge) ?? null;
  if (input.isFeatured !== undefined) row.is_featured = Boolean(input.isFeatured);

  return row;
}
