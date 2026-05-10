interface Env {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
    API_TARGET?: string;
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

                return await fetch(proxyRequest);
            }

            // 2. Pollinations Proxy (Forward /external/pollinations requests to gen.pollinations.ai)
            if (url.pathname.startsWith('/external/pollinations/')) {
                const pollinationsUrl = new URL(url.pathname.replace('/external/pollinations/', '/'), 'https://gen.pollinations.ai');
                pollinationsUrl.search = url.search;

                const proxyRequest = new Request(pollinationsUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'image/*',
                        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
                    },
                    redirect: 'follow'
                });

                return await fetch(proxyRequest);
            }

            // 3. Try to fetch the asset
            const response = await env.ASSETS.fetch(request);

            // 3. Spa Fallback
            if (response.status === 404) {
                const path = url.pathname;

                // Don't fallback for files (extensions) or API
                if (path.match(/\.[^/.]+$/) || path.startsWith('/api/')) {
                    return response;
                }

                // Serve index.html
                // Construct a clean request to avoid body/immutability issues
                const indexRequest = new Request(new URL('/index.html', request.url), {
                    headers: request.headers,
                    method: request.method
                });

                return await env.ASSETS.fetch(indexRequest);
            }

            return response;
        } catch (error) {
            console.error('Cloudflare worker request failed', error);
            return new Response('Internal server error', { status: 500 });
        }
    }
};
