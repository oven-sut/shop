import { NextResponse } from 'next/server';
import { safeRedirectPath } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth / email-confirmation landing route.
 *
 * Google redirects here with a PKCE `code`. Exchanging it writes the Supabase
 * session (access token JWT + refresh token) into cookies on the redirect
 * response, so the very next request is already authenticated on the server.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));

  // The provider (or Supabase) can bounce back with an error instead of a code.
  const providerError = searchParams.get('error_description') || searchParams.get('error');

  const redirectBase = (() => {
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (process.env.NODE_ENV === 'development' || !forwardedHost) return origin;
    return `https://${forwardedHost}`;
  })();

  if (!providerError && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`);
    }

    console.error('exchangeCodeForSession failed:', error.message);
    return NextResponse.redirect(
      `${redirectBase}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${redirectBase}/login?error=${encodeURIComponent(providerError || 'auth_callback_failed')}`
  );
}
