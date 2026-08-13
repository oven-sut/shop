import { NextResponse } from 'next/server';
import { User } from '../types/auth';
import { unauthorized } from './api-response';
import { getBearerUser, getSessionUser } from './supabase/session';

export type ApiAuth =
  | { user: User; response: null }
  | { user: null; response: NextResponse };

/**
 * Auth gate for route handlers. Accepts either the browser cookie session or an
 * `Authorization: Bearer <access_token>` header (Postman, curl, scripts).
 *
 * `proxy.ts` already rejects anonymous requests to /api/*, but Next.js warns that
 * a matcher change can silently remove that coverage — so every handler verifies
 * the JWT again, right next to the data it protects.
 *
 *   const { user, response } = await requireApiUser();
 *   if (response) return response;
 */
export async function requireApiUser(): Promise<ApiAuth> {
  const user = (await getSessionUser()) ?? (await getBearerUser());

  if (!user) {
    return { user: null, response: unauthorized() };
  }

  return { user, response: null };
}
