import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/auth';

/**
 * The disallow list is a courtesy to well-behaved crawlers, not a control:
 * every path below is already refused to anyone without a session, and the
 * admin paths to anyone without the role. It keeps them out of the crawl
 * budget and out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin('https://www.neo.owenx.shop');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/orders', '/wallet', '/docs', '/openapi.json', '/auth/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
