import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/auth';

/**
 * Only the pages a crawler can actually read.
 *
 * Everything else — the storefront, wallet, orders, admin — sits behind the
 * auth gate in `src/proxy.ts` and answers a redirect to /login, so listing it
 * would just fill Search Console with redirect errors. That is a property of
 * the shop, not an oversight: there is no public catalogue to index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin('https://www.neo.owenx.shop');
  const lastModified = new Date();

  return [
    { url: `${base}/login`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
