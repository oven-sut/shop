import { notFound } from 'next/navigation';
import { createClient } from './supabase/server';
import { loadSettings } from './settings';
import { isNavLinkEnabled, type NavLinkKey } from './nav-links';

/**
 * Server-side gate for pages behind a navbar toggle (see lib/nav-links.ts).
 * Disabling a toggle isn't just cosmetic — the route itself 404s, so someone
 * who bookmarked the URL or guesses it while the feature is off gets nothing.
 */
export async function requireNavEnabled(key: NavLinkKey): Promise<void> {
  const supabase = await createClient();
  const settings = await loadSettings(supabase);
  if (!isNavLinkEnabled(settings, key)) notFound();
}
