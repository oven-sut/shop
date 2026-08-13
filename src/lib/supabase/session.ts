import { headers } from 'next/headers';
import { User } from '../../types/auth';
import { AuthClaims, userFromClaims } from '../auth';
import { createClient } from './server';

/**
 * Reads the signed-in user from the request cookies.
 *
 * Uses `getClaims()` rather than `getSession()`: cookies can be spoofed, and
 * `getClaims()` verifies the JWT signature against the project's public keys
 * before returning anything.
 */
export async function getSessionClaims(): Promise<AuthClaims | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error) return null;
    return (data?.claims as AuthClaims | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<User | null> {
  return userFromClaims(await getSessionClaims());
}

/**
 * Reads the user from an `Authorization: Bearer <access_token>` header.
 *
 * Browsers use the cookie session; this is for API clients that have no cookie
 * jar (Postman, curl, scripts). The token goes through the same signature
 * verification as the cookie path.
 */
export async function getBearerUser(): Promise<User | null> {
  try {
    const authorization = (await headers()).get('authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!token) return null;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims(token);
    if (error) return null;

    return userFromClaims(data?.claims as AuthClaims | undefined);
  } catch {
    return null;
  }
}
