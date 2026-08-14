import { NextResponse } from 'next/server';
import { User } from '../types/auth';
import { forbidden, unauthorized } from './api-response';
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

/**
 * Same gate, restricted to admins.
 *
 * The RLS policies already refuse a customer's write, so this is deliberately a
 * second lock rather than the only one. It matters because the two fail in
 * different ways: RLS refusing an update is indistinguishable from "no such
 * row", and a handler that is later switched to the service-role client — which
 * bypasses RLS entirely — would silently lose its only check. Stating the rule
 * in the handler keeps the intent visible where the route is read.
 */
export async function requireAdmin(): Promise<ApiAuth> {
  const auth = await requireApiUser();
  if (auth.response) return auth;

  if (auth.user.role !== 'admin') {
    return { user: null, response: forbidden() };
  }

  return auth;
}
