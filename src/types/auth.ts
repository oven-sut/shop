export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
}

/**
 * A user as the admin user-management page sees them: the auth record plus the
 * money and order totals that decide what an admin does about them.
 *
 * Only ever built from `admin_list_users()`, which runs with the service role —
 * never from a session, so nothing here is readable by the user it describes.
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** True while `bannedUntil` is in the future. Suspended accounts cannot sign in. */
  isBanned: boolean;
  bannedUntil?: string;
  createdAt?: string;
  lastSignInAt?: string;
  /** Unset for an account that never opened the confirmation link. */
  emailConfirmedAt?: string;
  balance: number;
  ordersCount: number;
  totalSpent: number;
  totalTopup: number;
}
