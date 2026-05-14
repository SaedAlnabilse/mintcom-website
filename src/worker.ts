interface Env {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
    API_TARGET?: string;
}

const SECURITY_HEADERS: Record<string, string> = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=()',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Content-Security-Policy': [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "img-src 'self' data: blob: https://paymintpos.net https://www.paymintpos.net https://upload.wikimedia.org https://cdn-icons-png.flaticon.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://accounts.google.com https://apis.google.com",
        "connect-src 'self' https://grateful-liberation-production-d036.up.railway.app wss://grateful-liberation-production-d036.up.railway.app https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net",
        "frame-src https://player.vimeo.com https://accounts.google.com",
        "media-src 'self' https://player.vimeo.com",
        "manifest-src 'self'",
        "worker-src 'self'",
        'upgrade-insecure-requests',
    ].join('; '),
};

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

export default {
    async fetch(request: Request, env: Env) {
        try {
            const url = new URL(request.url);

            if (!env.ASSETS) {
                console.error('Cloudflare assets binding is missing');
                return new Response('Internal server error', { status: 500 });
            }

            const targetBase = env.API_TARGET || 'https://grateful-liberation-production-d036.up.railway.app';
            const noIndexPath = /^\/(api|uploads|files|dashboard|owner|brand|login|signup|verify-email|forgot-password|reset-password|select-establishment)(\/|$)/.test(url.pathname);

            // 0. WebSocket Proxy (Forward /realtime WebSocket requests to Railway)
            if (url.pathname.startsWith('/realtime') || url.pathname.startsWith('/socket.io/')) {
                const newUrl = new URL(url.pathname + url.search, targetBase);
                
                // Create a new request with the target URL
                const proxyRequest = new Request(newUrl, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body,
                });

                // Fetch from the backend - this will handle WebSocket upgrade automatically
                return await fetch(proxyRequest);
            }

            // 1. Api Proxy (Forward /api requests to Railway)
            if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/reports/') || url.pathname.startsWith('/app-settings/') || url.pathname.startsWith('/files/') || url.pathname.startsWith('/customers/') || url.pathname.startsWith('/uploads/')) {
                const newUrl = new URL(url.pathname + url.search, targetBase);

                const proxyRequest = new Request(newUrl, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body,
                    redirect: 'follow'
                });

                return withSecurityHeaders(await fetch(proxyRequest), true);
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
