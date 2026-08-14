import { User, UserRole } from '../types/auth';

type Metadata = Record<string, unknown> | null | undefined;

/** The subset of a verified Supabase JWT payload that this app reads. */
export interface AuthClaims {
  sub?: string;
  email?: string;
  app_metadata?: Metadata;
  user_metadata?: Metadata;
  [key: string]: unknown;
}

/** Shape shared by `session.user` (client) and JWT claims (server). */
export interface AuthIdentity {
  id: string;
  email?: string | null;
  app_metadata?: Metadata;
  user_metadata?: Metadata;
  created_at?: string;
}

function pickString(meta: Metadata, ...keys: string[]): string | undefined {
  if (!meta) return undefined;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

/**
 * Roles live in `app_metadata`, never `user_metadata`: `user_metadata` is
 * writable by the user themselves, so trusting it would let anyone make
 * themselves an admin. `app_metadata` can only be changed with the service role.
 *
 * Promote a user with:
 *   update auth.users
 *   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
 *   where email = 'you@example.com';
 */
export function roleFromAppMetadata(appMetadata: Metadata): UserRole {
  return pickString(appMetadata, 'role') === 'admin' ? 'admin' : 'customer';
}

export function toAppUser(identity: AuthIdentity | null | undefined): User | null {
  if (!identity?.id) return null;

  const email = identity.email ?? '';

  return {
    id: identity.id,
    email,
    name:
      pickString(identity.user_metadata, 'full_name', 'name') ||
      email.split('@')[0] ||
      'ผู้ใช้งาน',
    role: roleFromAppMetadata(identity.app_metadata),
    avatar: pickString(identity.user_metadata, 'avatar_url', 'picture'),
    createdAt: identity.created_at,
  };
}

export function claimsToIdentity(claims: AuthClaims | null | undefined): AuthIdentity | null {
  if (!claims?.sub) return null;

  return {
    id: claims.sub,
    email: claims.email,
    app_metadata: claims.app_metadata,
    user_metadata: claims.user_metadata,
  };
}

export function userFromClaims(claims: AuthClaims | null | undefined): User | null {
  return toAppUser(claimsToIdentity(claims));
}

export function isAdminClaims(claims: AuthClaims | null | undefined): boolean {
  return Boolean(claims?.sub) && roleFromAppMetadata(claims?.app_metadata) === 'admin';
}

/**
 * The origin every auth redirect should come back to.
 *
 * `window.location.origin` is not enough on its own: behind a proxy the browser
 * may sit on the public domain while the app answers on an internal host, and
 * Supabase rejects a `redirectTo` that is not on its allow list, silently
 * falling back to the project's Site URL — which is how a production login
 * lands on localhost:3000. Setting NEXT_PUBLIC_SITE_URL pins the value in both
 * the browser bundle and the callback route, so the two never disagree.
 *
 * Unset, it falls back to whatever the current request came in on, which is the
 * right answer for `next dev` and preview deploys.
 */
export function siteOrigin(fallback?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (fallback) return fallback;
  return typeof window === 'undefined' ? '' : window.location.origin;
}

/** Only allow same-origin, absolute paths as post-login redirect targets. */
export function safeRedirectPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
