import { createBrowserClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

/**
 * Browser client. `createBrowserClient` stores the session in cookies (not
 * localStorage), which is what lets the server read the same session.
 */
export function createClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
