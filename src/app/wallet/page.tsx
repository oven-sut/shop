import { requireNavEnabled } from '@/lib/nav-gate';
import WalletClient from './WalletClient';

export default async function WalletPage() {
  await requireNavEnabled('wallet');
  return <WalletClient />;
}
