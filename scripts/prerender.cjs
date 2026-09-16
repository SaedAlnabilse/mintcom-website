/**
 * Static Site Generation (SSG) Pre-render Script for Mintcom Website
 * 
 * Pre-renders public marketing pages into static HTML files in dist/
 * so search engine crawlers (Googlebot, Bingbot) and social media crawlers
 * (WhatsApp, Twitter/X, LinkedIn, Facebook, Slack) receive complete, 
 * pre-rendered HTML with strict semantic headings, metadata, and JSON-LD schema.
 * 
 * Resilient Execution:
 * - Runs full headless Chromium pre-rendering when supported (local dev, full CI runners).
 * - Gracefully generates lightweight static route files with route-specific SEO tags
 *   in containerized or non-root build environments (e.g. Cloudflare Pages, minimal Docker)
 *   without crashing the production deployment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 4188;

const ROUTES_TO_PRERENDER = [
  {
    path: '/',
    title: 'Mintcom | All-in-One Cloud POS & Business Management',
    description: 'Simplify your business with Mintcom. Fast sales, real-time inventory, and powerful analytics on any device. Start your 14-day free trial today.',
  },
  {
    path: '/pricing',
    title: 'Pricing | Mintcom POS',
    description: 'Simple Mintcom POS pricing per establishment. No hardware sales, no confusing add-ons. Start your free trial.',
  },
  {
    path: '/about',
    title: 'About Us | Mintcom',
    description: "Learn about Mintcom's mission to empower business owners with modern, secure, and scalable POS solutions.",
  },
  {
    path: '/try-pos',
    title: 'Try Mintcom POS · Free interactive demo',
    description: 'Experience Mintcom POS in your browser with our interactive live demo.',
  },
  {
    path: '/qr-menu-demo',
    title: 'QR Digital Menu | Mintcom',
    description: 'Explore Mintcom interactive digital QR menu demo for restaurants and cafes.',
  },
  {
    path: '/support',
    title: 'Support Hub | Mintcom POS',
    description: 'Mintcom POS Help Center, guides, FAQs, and 24/7 live support resources.',
  },
  {
    path: '/support/articles',
    title: 'Support Articles | Mintcom POS',
    description: 'Browse setup guides, hardware integration, inventory tips, and POS tutorials.',
  },
  {
    path: '/legal/privacy',
    title: 'Privacy Policy | Mintcom',
    description: 'Read our privacy policy to understand how we protect your data and maintain your privacy.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Mintcom',
    description: 'Read our privacy policy to understand how we protect your data and maintain your privacy.',
  },
  {
    path: '/legal/terms',
    title: 'Terms of Service | Mintcom',
    description: 'Review our terms of service for using the Mintcom platform and services.',
  },
  {
    path: '/legal/cookie-policy',
    title: 'Cookie Policy | Mintcom',
    description: 'Learn about how we use cookies to improve your experience on our website.',
  },
  {
    path: '/legal/changelog',
    title: 'Policy Changelog | Mintcom',
    description: 'View the history of updates to Mintcom POS Terms of Service and Privacy Policy.',
  },
  {
    path: '/download-app',
    title: 'Download Mintcom POS App | iPad & Android',
    description: 'Download Mintcom POS for iOS and Android tablets, terminals, and mobile devices.',
  },
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

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function writeRouteFallback(route) {
  const fallbackSourcePath = fs.existsSync(path.join(DIST_DIR, 'spa-fallback.html'))
    ? path.join(DIST_DIR, 'spa-fallback.html')
    : path.join(DIST_DIR, 'index.html');
  const template = fs.readFileSync(fallbackSourcePath, 'utf8');

  let targetFile;
  if (route.path === '/') {
    targetFile = path.join(DIST_DIR, 'index.html');
  } else {
    const subDir = path.join(DIST_DIR, route.path.replace(/^\//, ''));
    fs.mkdirSync(subDir, { recursive: true });
    targetFile = path.join(subDir, 'index.html');
  }

  const canonicalUrl = `https://mintcompos.com${route.path === '/' ? '' : route.path}`;
  let html = template;

  if (route.title) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
    html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(route.title)}" />`);
    html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`);
    html = html.replace(/<meta\s+name=["']title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="title" content="${escapeAttr(route.title)}" />`);
  }

  html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta\s+name=["']twitter:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:url" content="${canonicalUrl}" />`);

  if (route.description) {
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${escapeAttr(route.description)}" />`);
    html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(route.description)}" />`);
    html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`);
  }

  fs.writeFileSync(targetFile, html, 'utf8');
  const stat = fs.statSync(targetFile);

  return {
    route: route.path,
    status: 'SUCCESS (Fallback)',
    title: route.title,
    sizeKb: (stat.size / 1024).toFixed(1),
    target: path.relative(DIST_DIR, targetFile),
  };
}

function printSummary(results, startTime) {
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
  const successCount = results.filter((r) => r.status && r.status.includes('SUCCESS')).length;
  console.log(`✅ Pre-rendered/Generated ${successCount}/${ROUTES_TO_PRERENDER.length} routes in ${durationSec}s\n`);
}

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

  // Check for explicit skip
  if (process.env.SKIP_PRERENDER === '1' || process.env.SKIP_PRERENDER === 'true') {
    console.log('ℹ️ SKIP_PRERENDER enabled: generating static route fallbacks with SEO metadata...');
    const results = ROUTES_TO_PRERENDER.map(writeRouteFallback);
    printSummary(results, startTime);
    return;
  }

  // Cloudflare Pages build environment runs in an unprivileged container without root or GUI libraries.
  // Unless explicitly overridden with FORCE_PRERENDER=1, generate static route fallbacks for fast, 100% reliable deployment.
  if (process.env.CF_PAGES === '1' && !process.env.FORCE_PRERENDER) {
    console.log('⚡ Cloudflare Pages build container detected.');
    console.log('ℹ️ Generating static route fallbacks with route-specific SEO tags for fast & reliable deployment...');
    const results = ROUTES_TO_PRERENDER.map(writeRouteFallback);
    printSummary(results, startTime);
    return;
  }

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`📦 Local pre-render server listening at http://localhost:${PORT}`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  } catch (err) {
    const isMissingExecutable =
      err.message.includes("Executable doesn't exist") ||
      err.message.includes('playwright install') ||
      err.message.includes('browserType.launch');

    if (isMissingExecutable) {
      console.log('⚡ Chromium binary not found, attempting npx playwright install chromium (without root)...');
      try {
        // NOTE: Never use --with-deps as that invokes `su` / root apt-get and fails in unprivileged CI containers
        require('child_process').execSync('npx playwright install chromium', { stdio: 'inherit' });
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        });
      } catch (installErr) {
        console.warn(`⚠️ Could not auto-install/launch Chromium: ${installErr.message.split('\n')[0]}`);
      }
    } else {
      console.warn(`⚠️ Headless Chromium failed to launch: ${err.message.split('\n')[0]}`);
    }
  }

  // Gracefully fall back to static route generator if headless browser cannot run in this environment
  if (!browser) {
    console.warn('ℹ️ Headless browser is unavailable in this environment. Falling back to static route SEO generator.');
    await new Promise((resolve) => server.close(resolve));
    const results = ROUTES_TO_PRERENDER.map(writeRouteFallback);
    printSummary(results, startTime);
    return;
  }

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

          // 5b. Deduplicate and normalize og:image, twitter:image, og:site_name
          const ogImages = Array.from(document.querySelectorAll('meta[property="og:image"]'));
          if (ogImages.length > 1) {
            ogImages.slice(1).forEach((el) => el.remove());
          }
          if (ogImages.length === 0) {
            const newImg = document.createElement('meta');
            newImg.setAttribute('property', 'og:image');
            newImg.setAttribute('content', 'https://mintcompos.com/og-image.png');
            document.head.appendChild(newImg);
          }

          const twImages = Array.from(document.querySelectorAll('meta[name="twitter:image"]'));
          if (twImages.length > 1) {
            twImages.slice(1).forEach((el) => el.remove());
          }
          if (twImages.length === 0) {
            const newTwImg = document.createElement('meta');
            newTwImg.setAttribute('name', 'twitter:image');
            newTwImg.setAttribute('content', 'https://mintcompos.com/og-image.png');
            document.head.appendChild(newTwImg);
          }

          // 6. JSON-LD Structured Data:
          // If page components added route-specific JSON-LD, remove the index.html fallback script
          const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          const baseScript = document.getElementById('schema-base');
          if (baseScript && ldScripts.length > 1) {
            baseScript.remove();
          }

          // Ensure all remaining JSON-LD scripts reside in <head> for optimal crawler indexing
          Array.from(document.querySelectorAll('script[type="application/ld+json"]')).forEach((s) => {
            if (s.parentElement !== document.head) {
              document.head.appendChild(s);
            }
          });
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
        console.warn(`⚠️ Pre-render browser issue for ${route.path}: ${err.message}. Using static fallback.`);
        const fallbackRes = writeRouteFallback(route);
        results.push(fallbackRes);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  printSummary(results, startTime);
}

runPrerender().catch((err) => {
  console.warn('⚠️ Pre-rendering script encountered an unexpected error:', err.message);
  try {
    ROUTES_TO_PRERENDER.map(writeRouteFallback);
    console.log('ℹ️ Static route fallback generation completed successfully.');
  } catch (fallbackErr) {
    console.error('Failed to generate fallback:', fallbackErr);
  }
  process.exit(0);
});
