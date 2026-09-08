interface Env {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
    API_TARGET?: string;
    /** Edge maintenance gate: "true" | "false" */
    MAINTENANCE_MODE?: string;
    /**
     * Secret for /qa-access bypass during maintenance.
     * Set with: npx wrangler secret put QA_ACCESS_KEY
     * Never commit this value.
     */
    QA_ACCESS_KEY?: string;
}

const PRODUCTION_WEB_ORIGINS = [
    'https://mintcompos.com',
    'https://www.mintcompos.com',
];

const PRODUCTION_WEB_HOSTS = new Set(
    PRODUCTION_WEB_ORIGINS.map((origin) => new URL(origin).host),
);

// Apex is the canonical host (matches VITE_SITE_URL, <link rel="canonical">,
// and OG urls). Serving the same SPA on both apex and www splits analytics
// across two hostnames (the "a new domain loaded your tag" GA warning) and
// duplicates SEO signals, so www navigations are permanently redirected here.
const CANONICAL_HOST = 'mintcompos.com';

const PREVIEW_COOKIE = 'mintcom_preview';
/** Signed preview cookie lifetime: 7 days */
const PREVIEW_MAX_AGE_SEC = 60 * 60 * 24 * 7;

const SECURITY_HEADERS: Record<string, string> = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // identity-credentials-get: required for Google GIS / FedCM button clicks in modern Chrome.
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=(), identity-credentials-get=(self "https://accounts.google.com")',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Content-Security-Policy': [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        // raw.githubusercontent.com hosts the seeded card-brand logos (see
        // establishments.service.ts defaults) — without it Visa/Mastercard
        // images are CSP-blocked while wikimedia-hosted ones still load.
        // *.r2.dev and *.mintcompos.com allow product and media images from Cloudflare R2 / S3.
        "img-src 'self' data: blob: https://mintcompos.com https://*.mintcompos.com https://*.r2.dev https://images.unsplash.com https://*.unsplash.com https://upload.wikimedia.org https://raw.githubusercontent.com https://cdn-icons-png.flaticon.com https://accounts.google.com https://*.googleusercontent.com https://www.gstatic.com https://ssl.gstatic.com https://*.gstatic.com https://*.google.com",
        "font-src 'self' data: https://fonts.gstatic.com https://fonts.cdnfonts.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com https://accounts.google.com",
        // gsi/client + button iframe assets load from accounts.google.com and gstatic
        "script-src 'self' https://www.googletagmanager.com https://connect.facebook.net https://accounts.google.com https://apis.google.com https://www.gstatic.com https://*.gstatic.com https://appleid.cdn-apple.com https://static.cloudflareinsights.com",
        // 'self' covers same-origin /api proxy; api.mintcompos.com is for any direct API calls;
        // apex + www listed explicitly so CSP never blocks if host/www differs mid-session.
        "connect-src 'self' https://mintcompos.com https://*.mintcompos.com https://*.r2.dev https://www.mintcompos.com wss://mintcompos.com wss://www.mintcompos.com https://api.mintcompos.com wss://api.mintcompos.com https://accounts.google.com https://*.google.com https://*.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://appleid.apple.com https://cloudflareinsights.com",
        // GIS button is an iframe under accounts.google.com/gsi/...
        "frame-src https://player.vimeo.com https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://*.google.com https://appleid.apple.com",
        "media-src 'self' https://player.vimeo.com",
        "manifest-src 'self'",
        "worker-src 'self'",
        'upgrade-insecure-requests',
    ].join('; '),
};

function shouldForceHttps(url: URL): boolean {
    return url.protocol === 'http:' && PRODUCTION_WEB_HOSTS.has(url.host);
}

function isAllowedProxyOrigin(origin: string | null, requestUrl: URL): boolean {
    if (!origin) {
        return true;
    }

    try {
        const parsedOrigin = new URL(origin).origin;
        return parsedOrigin === requestUrl.origin || PRODUCTION_WEB_ORIGINS.includes(parsedOrigin);
    } catch {
        return false;
    }
}

function createProxyRequest(request: Request, targetUrl: URL): Request {
    const headers = new Headers(request.headers);

    // The browser calls this Worker same-origin. Forwarding that browser Origin
    // to Railway makes the backend CORS middleware reject otherwise valid proxy
    // requests, especially from http://mintcompos.com before HTTPS redirect.
    headers.delete('Origin');
    headers.delete('Host');
    headers.set('X-Forwarded-Host', new URL(request.url).host);
    headers.set('X-Forwarded-Proto', new URL(request.url).protocol.replace(':', ''));

    return new Request(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'follow',
    });
}

function withSecurityHeaders(response: Response, noIndex = false): Response {
    const secured = new Response(response.body, response);

    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        secured.headers.set(key, value);
    });

    if (noIndex) {
        secured.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }

    return secured;
}

function isMaintenanceOn(env: Env): boolean {
    return ['1', 'true', 'yes', 'on'].includes(String(env.MAINTENANCE_MODE || '').trim().toLowerCase());
}

function parseCookies(header: string | null): Record<string, string> {
    if (!header) return {};
    const out: Record<string, string> = {};
    for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k) out[k] = decodeURIComponent(v);
    }
    return out;
}

async function hmacSign(secret: string, message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function createPreviewCookieValue(secret: string): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + PREVIEW_MAX_AGE_SEC;
    const payload = `v1.${exp}`;
    const sig = await hmacSign(secret, payload);
    return `${payload}.${sig}`;
}

async function isValidPreviewCookie(secret: string | undefined, cookieHeader: string | null): Promise<boolean> {
    if (!secret?.trim()) return false;
    const raw = parseCookies(cookieHeader)[PREVIEW_COOKIE];
    if (!raw) return false;
    const parts = raw.split('.');
    if (parts.length !== 3 || parts[0] !== 'v1') return false;
    const exp = Number(parts[1]);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const payload = `${parts[0]}.${parts[1]}`;
    const expected = await hmacSign(secret, payload);
    // Constant-time-ish compare
    if (expected.length !== parts[2].length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
        diff |= expected.charCodeAt(i) ^ parts[2].charCodeAt(i);
    }
    return diff === 0;
}

function isHtmlNavigation(request: Request): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    const accept = request.headers.get('Accept') || '';
    // Asset requests often omit text/html or prefer */*
    if (accept.includes('text/html')) return true;
    // Some browsers send empty Accept on SPA navigations
    const path = new URL(request.url).pathname;
    return !path.match(/\.[^/.]+$/);
}

function maintenanceHtml(): Response {
    const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Mintcom · Coming Soon</title>
  <style>
    body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
      font-family:system-ui,sans-serif;background:#0a0e17;color:#e8eaed;text-align:center;padding:24px}
    h1{font-size:1.5rem;margin:0 0 8px}
    p{opacity:.7;margin:0;max-width:28rem;line-height:1.5}
  </style>
</head>
<body>
  <div>
    <h1>We&rsquo;ll be right back</h1>
    <p>Mintcom is undergoing scheduled maintenance. Please check again shortly.</p>
  </div>
</body>
</html>`;
    return withSecurityHeaders(
        new Response(body, {
            status: 503,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
                'Retry-After': '3600',
            },
        }),
        true,
    );
}

function timingSafeEqualString(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

export default {
    async fetch(request: Request, env: Env) {
        try {
            const url = new URL(request.url);

            if (!env.ASSETS) {
                console.error('Cloudflare assets binding is missing');
                return new Response('Internal server error', { status: 500 });
            }

            if (shouldForceHttps(url)) {
                url.protocol = 'https:';
                return Response.redirect(url.toString(), 308);
            }

            // Canonicalize host: send www navigations to the apex domain so
            // analytics/SEO are not split across two hostnames. Only GET/HEAD
            // navigations are redirected; API/proxy/realtime calls keep their
            // host so request methods and CORS are never altered.
            if (
                url.host === `www.${CANONICAL_HOST}` &&
                (request.method === 'GET' || request.method === 'HEAD')
            ) {
                url.host = CANONICAL_HOST;
                return Response.redirect(url.toString(), 301);
            }

            // ── Edge QA / preview access (secret never shipped in client JS) ──
            if (url.pathname === '/qa-access' && (request.method === 'GET' || request.method === 'HEAD')) {
                const expected = env.QA_ACCESS_KEY?.trim() || '';
                const provided = url.searchParams.get('key')?.trim() || '';
                const ok =
                    Boolean(expected) &&
                    Boolean(provided) &&
                    timingSafeEqualString(expected, provided);

                const redirectTo = new URL('/', url.origin);
                if (ok && expected) {
                    const value = await createPreviewCookieValue(expected);
                    const headers = new Headers({
                        Location: redirectTo.toString(),
                        'Set-Cookie': `${PREVIEW_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${PREVIEW_MAX_AGE_SEC}; Secure; HttpOnly; SameSite=Lax`,
                        'Cache-Control': 'no-store',
                    });
                    return withSecurityHeaders(new Response(null, { status: 302, headers }), true);
                }
                // Clear any forged cookie and bounce home
                const headers = new Headers({
                    Location: redirectTo.toString(),
                    'Set-Cookie': `${PREVIEW_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`,
                    'Cache-Control': 'no-store',
                });
                return withSecurityHeaders(new Response(null, { status: 302, headers }), true);
            }

            const targetBase = env.API_TARGET || 'https://api.mintcompos.com';
            const noIndexPath = /^\/(api|uploads|files|dashboard|owner|brand|login|signup|verify-email|forgot-password|reset-password|select-establishment)(\/|$)/.test(url.pathname);
            const isProxyPath = url.pathname.startsWith('/api/') || url.pathname.startsWith('/reports/') || url.pathname.startsWith('/app-settings/') || url.pathname.startsWith('/files/') || url.pathname.startsWith('/customers/') || url.pathname.startsWith('/uploads/');
            const isRealtimePath = url.pathname.startsWith('/realtime') || url.pathname.startsWith('/socket.io/');

            if ((isProxyPath || isRealtimePath) && !isAllowedProxyOrigin(request.headers.get('Origin'), url)) {
                return withSecurityHeaders(new Response('Forbidden', { status: 403 }), true);
            }

            // 0. WebSocket Proxy (Forward /realtime WebSocket requests to Railway)
            if (isRealtimePath) {
                const newUrl = new URL(url.pathname + url.search, targetBase);

                // Fetch from the backend - this will handle WebSocket upgrade automatically
                return await fetch(createProxyRequest(request, newUrl));
            }

            // 1. Api Proxy (Forward /api requests to Railway)
            if (isProxyPath) {
                const newUrl = new URL(url.pathname + url.search, targetBase);

                return withSecurityHeaders(await fetch(createProxyRequest(request, newUrl)), true);
            }

            // Edge maintenance: block HTML navigations without a valid signed preview cookie
            if (isMaintenanceOn(env) && isHtmlNavigation(request)) {
                const allowed = await isValidPreviewCookie(env.QA_ACCESS_KEY, request.headers.get('Cookie'));
                if (!allowed) {
                    return maintenanceHtml();
                }
            }

            // Bot SSR for community public pages (SEO)
            if (
                isHtmlNavigation(request) &&
                isSearchBot(request.headers.get('User-Agent')) &&
                url.pathname.startsWith('/community')
            ) {
                try {
                    const prerendered = await prerenderCommunityPage(request, url, targetBase);
                    if (prerendered) {
                        return withSecurityHeaders(prerendered, false);
                    }
                } catch (err) {
                    console.error('Community bot prerender failed', err);
                    // Fall through to SPA
                }
            }

            // 3. Try to fetch the asset
            const response = await env.ASSETS.fetch(request);

            // 3. Spa Fallback
            if (response.status === 404) {
                const path = url.pathname;

                // Don't fallback for files (extensions) or API
                if (path.match(/\.[^/.]+$/) || path.startsWith('/api/')) {
                    return withSecurityHeaders(response, noIndexPath);
                }

                // Serve index.html
                // Construct a clean request to avoid body/immutability issues
                const indexRequest = new Request(new URL('/index.html', request.url), {
                    headers: request.headers,
                    method: request.method
                });

                return withSecurityHeaders(await env.ASSETS.fetch(indexRequest), noIndexPath);
            }

            return withSecurityHeaders(response, noIndexPath);
        } catch (error) {
            console.error('Cloudflare worker request failed', error);
            return withSecurityHeaders(new Response('Internal server error', { status: 500 }));
        }
    }
};

// ── Community bot SSR helpers ──────────────────────────────────────

const BOT_UA =
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|rogerbot|screaming frog|whatsapp|telegram/i;

function isSearchBot(ua: string | null): boolean {
    return !!ua && BOT_UA.test(ua);
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * For crawlers hitting /community/* — fetch public API data and return
 * a minimal HTML document with correct title/meta/JSON-LD so bots can
 * index without waiting for SPA hydration. Progressive; SPA remains
 * the human experience.
 */
async function prerenderCommunityPage(
    request: Request,
    url: URL,
    apiBase: string,
): Promise<Response | null> {
    const path = url.pathname;

    // Topic detail: /community/c/:categorySlug/:topicSlug-:topicId
    // topicId is the last cuid-like segment after the final dash group
    const topicMatch = path.match(
        /^\/community\/c\/[^/]+\/.+-([a-z0-9]{20,})$/i,
    );
    // Category: /community/c/:slug
    const categoryMatch = path.match(/^\/community\/c\/([^/]+)\/?$/);
    // Home
    const isHome = path === '/community' || path === '/community/';

    let title = 'Community | Mintcom POS';
    let description =
        'Ask questions, share tips, and connect with other Mintcom merchants.';
    let jsonLd: Record<string, unknown> | null = null;
    let bodyHtml = '';

    try {
        if (topicMatch) {
            const topicId = topicMatch[1];
            const res = await fetch(`${apiBase}/api/community/topics/${topicId}`, {
                headers: { Accept: 'application/json' },
                // Don't follow redirects forever
                redirect: 'follow',
            });
            if (!res.ok) return null;
            const topic = (await res.json()) as {
                title?: string;
                body?: string;
                bodyHtml?: string;
                bestReplyId?: string | null;
                replyCount?: number;
                author?: { displayName?: string };
                slug?: string;
                category?: { slug?: string };
            };
            if (!topic?.title) return null;

            title = `${topic.title} | Community | Mintcom POS`;
            description = (topic.body || '').slice(0, 160);
            bodyHtml = topic.bodyHtml || escapeHtml(topic.body || '');

            jsonLd = topic.bestReplyId
                ? {
                      '@context': 'https://schema.org',
                      '@type': 'QAPage',
                      mainEntity: {
                          '@type': 'Question',
                          name: topic.title,
                          text: topic.body,
                          answerCount: topic.replyCount || 0,
                      },
                  }
                : {
                      '@context': 'https://schema.org',
                      '@type': 'DiscussionForumPosting',
                      headline: topic.title,
                      text: topic.body,
                      author: {
                          '@type': 'Person',
                          name: topic.author?.displayName || 'Member',
                      },
                  };
        } else if (categoryMatch) {
            const slug = categoryMatch[1];
            const res = await fetch(`${apiBase}/api/community/categories/${slug}`, {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const cat = (await res.json()) as {
                    name?: string;
                    description?: string;
                };
                if (cat?.name) {
                    title = `${cat.name} | Community | Mintcom POS`;
                    description = cat.description || description;
                }
            }
        } else if (!isHome) {
            // Other community routes — let SPA handle
            return null;
        }
    } catch {
        return null;
    }

    const canonical = `https://mintcompos.com${path}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="article" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  <meta http-equiv="refresh" content="0;url=${path}" />
</head>
<body>
  <article>
    <h1>${escapeHtml(title.split(' | ')[0])}</h1>
    ${bodyHtml ? `<div>${bodyHtml}</div>` : `<p>${escapeHtml(description)}</p>`}
  </article>
  <p><a href="${path}">View on Mintcom Community</a></p>
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
    });
}
