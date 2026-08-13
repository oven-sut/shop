import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses RLS entirely — server-side only.
 *
 * Used for exactly one thing: crediting a wallet after a slip has been verified
 * with RDCW. That write must be impossible to trigger from the browser, so no
 * RLS policy allows it and the secret key never leaves the server.
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
