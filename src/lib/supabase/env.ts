/**
 * Single place where the Supabase browser-safe credentials are read.
 *
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the current key format; the legacy
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback. Missing values throw
 * instead of silently falling back to a placeholder project — a placeholder makes
 * every auth call fail with a confusing error far away from the real cause.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env'
    );
  }

  return { url, key };
}
