import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses RLS entirely — server-side only.
 *
 * Three uses: crediting a wallet after a slip has been verified with RDCW (that
 * write must be impossible to trigger from the browser, so no RLS policy
 * allows it), reading store-wide aggregate counts for the homepage stats
 * banner (every table here is locked to "your own rows", but a plain count
 * carries no PII so it is safe to read across all users), and the admin user
 * management pages, which read `auth.users` and change roles, suspensions and
 * balances — none of which any RLS policy grants to a signed-in session.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SECRET_KEY. Dashboard → Project Settings → API keys → secret/service_role, แล้วใส่ใน .env'
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
