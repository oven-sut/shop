import { notFound } from 'next/navigation';
import { getSessionUser } from '../../lib/supabase/session';

/**
 * Second lock on the API reference, next to the one in proxy.ts: a matcher change
 * there must not quietly publish the endpoint map. Non-admins get 404, not 403,
 * so the page's existence is not confirmed.
 */
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (user?.role !== 'admin') {
    notFound();
  }

  return <>{children}</>;
}
