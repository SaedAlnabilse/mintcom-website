/**
 * Build-time sitemap generator.
 *
 * Single source of truth for SEO-visible URLs lives next to the router:
 * keep this list in sync with `routeSeo` in src/App.tsx (public routes only —
 * anything behind auth or with noindex must NOT be listed here).
 *
 * Runs after `vite build` so dist/ exists. `npm run build` invokes it via
 * the `build:sitemap` script. Public assets (incl. a stale sitemap.xml) are
 * copied to dist/ by Vite first, so this file overwrites with fresh dates.
 */
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const SITE_URL = (process.env.VITE_SITE_URL || 'https://mintcompos.com').replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

// [path, changefreq, priority]
const PUBLIC_ROUTES = [
  ['/', 'weekly', '1.0'],
  ['/pricing', 'weekly', '0.9'],
  ['/try-pos', 'weekly', '0.9'],
  ['/qr-menu-demo', 'monthly', '0.8'],
  ['/menu/demo', 'monthly', '0.7'],
  ['/download-app', 'monthly', '0.7'],
  ['/about', 'monthly', '0.8'],
  ['/qa', 'monthly', '0.7'],
  ['/support', 'weekly', '0.7'],
  ['/support/articles', 'weekly', '0.7'],
  ['/community', 'daily', '0.8'],
  ['/community/c/announcements', 'daily', '0.7'],
  ['/community/c/q-a', 'daily', '0.7'],
  ['/community/c/feature-requests', 'daily', '0.7'],
  ['/community/c/discussions', 'daily', '0.7'],
  ['/community/c/tips-tricks', 'daily', '0.7'],
  ['/community/c/showcase', 'daily', '0.7'],
  ['/community/feature-requests', 'daily', '0.7'],
  ['/legal/privacy', 'yearly', '0.3'],
  ['/legal/terms', 'yearly', '0.3'],
  ['/legal/cookie-policy', 'yearly', '0.3'],
  ['/legal/changelog', 'yearly', '0.3'],
];

function buildSitemap() {
  const urls = PUBLIC_ROUTES.map(
    ([route, changefreq, priority]) =>
      `  <url>\n    <loc>${SITE_URL}${route === '/' ? '/' : route}</loc>\n` +
      `    <lastmod>${TODAY}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] wrote ${PUBLIC_ROUTES.length} URLs to dist/sitemap.xml`);
}

buildSitemap();
