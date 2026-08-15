import { requireNavEnabled } from '@/lib/nav-gate';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  await requireNavEnabled('orders');
  return <OrdersClient />;
}
