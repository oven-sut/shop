import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { supabaseEnv } from './env';

/**
 * Server client, bound to the cookies of the current request.
 *
 * If using Fluid compute: don't put this client in a global variable. Always create
 * a new client within each function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component, which cannot write cookies.
          // Safe to ignore: proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}

/**
 * Client for route handlers, acting as the caller so RLS applies.
 *
 * Browsers authenticate with the cookie session; API clients (Postman, scripts)
 * send `Authorization: Bearer <token>` and have no cookies at all, so the header
 * is forwarded to PostgREST — without it their queries would run as `anon` and
 * every policy would deny them.
 */
export async function createRouteClient() {
  const cookieStore = await cookies();
  const authorization = (await headers()).get('authorization');
  const { url, key } = supabaseEnv();

  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  return createServerClient(url, key, {
    global: bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : {},
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Route handlers can normally set cookies; ignore when they cannot.
        }
      },
    },
  });
}
