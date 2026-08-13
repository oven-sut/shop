import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AuthClaims } from '../auth';
import { supabaseEnv } from './env';

/**
 * Refreshes the Supabase session cookies for the incoming request.
 *
 * Three things have to happen for a cookie session to survive:
 *   1. `getClaims()` verifies the JWT and refreshes it when it is near expiry,
 *   2. `request.cookies.set` hands the fresh token to Server Components,
 *   3. `response.cookies.set` hands the fresh token back to the browser.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  claims: AuthClaims | null;
}> {
  let response = NextResponse.next({ request });

  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not remove: this call is what triggers the refresh and the cookie writes above.
  let claims: AuthClaims | null = null;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (!error) claims = (data?.claims as AuthClaims | undefined) ?? null;
  } catch {
    claims = null;
  }

  return { response, claims };
}
