import { requireNavEnabled } from '@/lib/nav-gate';
import ResetHwidClient from './ResetHwidClient';

export default async function ResetHwidPage() {
  await requireNavEnabled('resetHwid');
  return <ResetHwidClient />;
}
