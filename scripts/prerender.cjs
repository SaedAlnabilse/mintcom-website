/**
 * Static Site Generation (SSG) Pre-render Script for Mintcom Website
 * 
 * Pre-renders public marketing pages into static HTML files in dist/
 * so search engine crawlers (Googlebot, Bingbot) and social media crawlers
 * (WhatsApp, Twitter/X, LinkedIn, Facebook, Slack) receive complete, 
 * pre-rendered HTML with strict semantic headings, metadata, and JSON-LD schema.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 4188;

const ROUTES_TO_PRERENDER = [
  { path: '/', title: 'Home' },
  { path: '/about', title: 'About' },
  { path: '/try-pos', title: 'Interactive POS Demo' },
  { path: '/qr-menu-demo', title: 'QR Menu Demo' },
  { path: '/support', title: 'Support Hub' },
  { path: '/support/articles', title: 'Support Articles' },
  { path: '/legal/privacy', title: 'Privacy Policy' },
  { path: '/privacy', title: 'Privacy Policy (Alias)' },
  { path: '/legal/terms', title: 'Terms of Service' },
  { path: '/legal/cookie-policy', title: 'Cookie Policy' },
  { path: '/legal/changelog', title: 'Policy Changelog' },
  { path: '/download-app', title: 'App Download' },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    const rawPath = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(DIST_DIR, decodeURIComponent(rawPath));

    // Try serving exact file or index.html in directory
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      // SPA Fallback: serve dist/index.html (or original fallback if backed up)
      const fallbackFile = fs.existsSync(path.join(DIST_DIR, 'spa-fallback.html'))
        ? path.join(DIST_DIR, 'spa-fallback.html')
        : path.join(DIST_DIR, 'index.html');
      filePath = fallbackFile;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading ${req.url}`);
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
}

async function runPrerender() {
  const startTime = Date.now();
  console.log('🚀 Starting Static Site Generation (SSG) Pre-render...');

  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('❌ Error: dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Backup original template index.html as spa-fallback.html if not already present
  const originalIndex = path.join(DIST_DIR, 'index.html');
  const fallbackPath = path.join(DIST_DIR, 'spa-fallback.html');
  if (!fs.existsSync(fallbackPath)) {
    fs.copyFileSync(originalIndex, fallbackPath);
  }

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`📦 Local pre-render server listening at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Googlebot/2.1 (+http://www.google.com/bot.html)',
    });

    // Suppress cookie banner overlay during prerender so crawlers get clean content
    await context.addInitScript(() => {
      try {
        localStorage.setItem(
          'mintcom-cookie-consent',
          JSON.stringify({ necessary: true, analytics: false, marketing: false })
        );
      } catch (_) {}
    });

    for (const route of ROUTES_TO_PRERENDER) {
      const page = await context.newPage();
      const pageUrl = `http://localhost:${PORT}${route.path}`;

      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15000 });

        // Wait for React to render meaningful text into #root
        await page.waitForFunction(
          () => {
            const root = document.getElementById('root');
            return root && root.innerText && root.innerText.trim().length > 10;
          },
          { timeout: 10000 }
        );

        // Wait a tick for react-helmet-async to finish updating document head
        await page.waitForTimeout(400);

        // Normalize Head: deduplicate title, canonical, meta descriptions, and OG tags
        await page.evaluate((routePath) => {
          const canonicalUrl = `https://mintcompos.com${routePath === '/' ? '' : routePath}`;

          // 1. Deduplicate <title> — select the specific page title set by Helmet
          const titles = Array.from(document.querySelectorAll('title'));
          if (titles.length > 0) {
            const specificTitle = titles.find(
              (t) =>
                t.textContent &&
                !t.textContent.includes('All-in-One Cloud POS & Business Management')
            )?.textContent;
            const finalTitle = specificTitle || titles[0].textContent || document.title || 'Mintcom POS';
            titles.forEach((t) => t.remove());
            const newTitle = document.createElement('title');
            newTitle.textContent = finalTitle;
            document.head.prepend(newTitle);
          }

          // 2. Normalize canonical tag — exactly one canonical pointing to production
          const canonicals = Array.from(document.querySelectorAll('link[rel="canonical"]'));
          canonicals.forEach((el) => el.remove());
          const newCanonical = document.createElement('link');
          newCanonical.setAttribute('rel', 'canonical');
          newCanonical.setAttribute('href', canonicalUrl);
          document.head.appendChild(newCanonical);

          // 3. Normalize og:url and twitter:url
          const ogUrls = Array.from(
            document.querySelectorAll('meta[property="og:url"], meta[name="twitter:url"]')
          );
          ogUrls.forEach((el) => el.remove());
          const newOgUrl = document.createElement('meta');
          newOgUrl.setAttribute('property', 'og:url');
          newOgUrl.setAttribute('content', canonicalUrl);
          document.head.appendChild(newOgUrl);

          const newTwUrl = document.createElement('meta');
          newTwUrl.setAttribute('name', 'twitter:url');
          newTwUrl.setAttribute('content', canonicalUrl);
          document.head.appendChild(newTwUrl);

          // 4. Deduplicate <meta name="description"> — keep the most specific
          const descs = Array.from(document.querySelectorAll('meta[name="description"]'));
          if (descs.length > 1) {
            const lastDesc = descs[descs.length - 1].getAttribute('content') || '';
            descs.forEach((d) => d.remove());
            const newDesc = document.createElement('meta');
            newDesc.setAttribute('name', 'description');
            newDesc.setAttribute('content', lastDesc);
            document.head.appendChild(newDesc);
          }

          // 5. Deduplicate og:title and og:description
          const ogTitles = Array.from(document.querySelectorAll('meta[property="og:title"]'));
          if (ogTitles.length > 1) {
            const lastTitle = ogTitles[ogTitles.length - 1].getAttribute('content') || '';
            ogTitles.forEach((el) => el.remove());
            const newEl = document.createElement('meta');
            newEl.setAttribute('property', 'og:title');
            newEl.setAttribute('content', lastTitle);
            document.head.appendChild(newEl);
          }

          const ogDescs = Array.from(document.querySelectorAll('meta[property="og:description"]'));
          if (ogDescs.length > 1) {
            const lastDesc = ogDescs[ogDescs.length - 1].getAttribute('content') || '';
            ogDescs.forEach((el) => el.remove());
            const newEl = document.createElement('meta');
            newEl.setAttribute('property', 'og:description');
            newEl.setAttribute('content', lastDesc);
            document.head.appendChild(newEl);
          }
        }, route.path);

        const pageTitle = await page.title();
        const html = await page.content();

        // Determine destination file path
        let targetFile;
        if (route.path === '/') {
          targetFile = path.join(DIST_DIR, 'index.html');
        } else {
          // Normalize e.g. /legal/privacy -> dist/legal/privacy/index.html
          const subDir = path.join(DIST_DIR, route.path.replace(/^\//, ''));
          fs.mkdirSync(subDir, { recursive: true });
          targetFile = path.join(subDir, 'index.html');
        }

        fs.writeFileSync(targetFile, html, 'utf8');
        const stat = fs.statSync(targetFile);

        results.push({
          route: route.path,
          status: 'SUCCESS',
          title: pageTitle,
          sizeKb: (stat.size / 1024).toFixed(1),
          target: path.relative(DIST_DIR, targetFile),
        });
      } catch (err) {
        console.error(`⚠️ Failed to pre-render route ${route.path}:`, err.message);
        results.push({
          route: route.path,
          status: 'FAILED',
          error: err.message,
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n================== SSG PRE-RENDER SUMMARY ==================');
  console.table(
    results.map((r) => ({
      Route: r.route,
      Status: r.status,
      Title: r.title ? r.title.slice(0, 45) : '-',
      Size: r.sizeKb ? `${r.sizeKb} KB` : '-',
      Target: r.target || '-',
    }))
  );
  console.log(`✅ Pre-rendered ${results.filter((r) => r.status === 'SUCCESS').length}/${ROUTES_TO_PRERENDER.length} routes in ${durationSec}s\n`);

  const hasFailures = results.some((r) => r.status === 'FAILED');
  if (hasFailures) {
    process.exit(1);
  }
}

runPrerender().catch((err) => {
  console.error('Fatal pre-rendering error:', err);
  process.exit(1);
});
