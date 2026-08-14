import { NextResponse } from 'next/server';

/**
 * Fixed-window rate limiting, held in the process.
 *
 * Scope and limits of this approach, stated plainly: the counters live in
 * memory, so they reset on deploy and each instance counts on its own. That is
 * the right trade for what this guards — endpoints where every call costs real
 * money or a third-party quota (slip verification, supplier orders, Steam Guard
 * codes). It stops one signed-in account from draining a provider's quota in a
 * loop. It is not a defence against a distributed attacker, and it is not a
 * substitute for the per-user limits the providers enforce themselves.
 *
 * If this ever runs on more than one instance, move the counter to Postgres or
 * Redis — the call sites do not have to change, only `hit()`.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Dropped entries are only reclaimed on access, so sweep occasionally. */
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimit {
  /** Distinct bucket per endpoint, so a burst of one does not starve another. */
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function hit(rule: RateLimit, identity: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${rule.name}:${identity}`;
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  current.count += 1;

  if (current.count > rule.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Returns a 429 when the caller is over the limit, or null to carry on.
 *
 *   const limited = enforceRateLimit(TOPUP_LIMIT, user.id);
 *   if (limited) return limited;
 */
export function enforceRateLimit(rule: RateLimit, identity: string): NextResponse | null {
  const { ok, retryAfterSeconds } = hit(rule, identity);
  if (ok) return null;

  return NextResponse.json(
    {
      success: false,
      error: 'rate_limited',
      message: `ทำรายการถี่เกินไป กรุณารออีก ${retryAfterSeconds} วินาทีแล้วลองใหม่`,
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
