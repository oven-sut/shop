import { NextResponse, type NextRequest } from 'next/server';
import { unauthorized } from '@/lib/api-response';
import { isAdminClaims } from '@/lib/auth';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Paths reachable without a session. Everything else — pages and API routes —
 * requires a signed-in user.
 *
 * `/auth` must stay open: it is where Google sends the user back with the
 * authorization code, i.e. the request that creates the session in the first place.
 */
// Policy pages stay open: people must be able to read the terms they are asked
// to accept before they have an account.
const PUBLIC_PATHS = ['/login', '/auth', '/terms', '/privacy', '/cookies'];

/**
 * The API reference and its spec map out every endpoint, so they are kept to
 * admins and answer 404 for anyone else — a 403 would confirm they exist.
 */
const ADMIN_ONLY_PATHS = ['/docs', '/openapi.json'];

function matches(paths: string[], pathname: string) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Runs before every request (see `matcher`):
 *   1. keeps the Supabase cookie session fresh,
 *   2. sends anonymous visitors to /login,
 *   3. answers anonymous API calls with 401 instead of a redirect.
 *
 * This is the outer gate. Authorization still happens where the data is —
 * `src/app/admin/layout.tsx` for the dashboard, `requireApiUser()` in each
 * route handler — because a matcher change here must not silently open anything.
 */
export async function proxy(request: NextRequest) {
  const { response, claims } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (matches(ADMIN_ONLY_PATHS, pathname)) {
    return isAdminClaims(claims)
      ? response
      : new NextResponse('Not found', { status: 404 });
  }

  if (claims || matches(PUBLIC_PATHS, pathname)) {
    return response;
  }

  if (pathname.startsWith('/api/')) {
    // API clients without a cookie jar send `Authorization: Bearer <token>`;
    // the route handler verifies that token via requireApiUser().
    const hasBearer = /^Bearer\s+\S+/i.test(request.headers.get('authorization') ?? '');
    return hasBearer ? response : unauthorized();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Every path except static assets, so that API routes and pages both get a
     * refreshed session cookie and pass through the auth gate.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
