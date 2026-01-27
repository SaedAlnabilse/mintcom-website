// @ts-ignore
export default {
    // @ts-ignore
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);

            if (!env.ASSETS) {
                return new Response("Internal Error: env.ASSETS is broken/missing. Please define assets in wrangler.jsonc", { status: 500 });
            }

            // 0. API Proxy (Forward /api requests to Railway)
            if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/reports/') || url.pathname.startsWith('/app-settings/') || url.pathname.startsWith('/files/') || url.pathname.startsWith('/customers/') || url.pathname.startsWith('/uploads/')) {
                // @ts-ignore
                const targetBase = env.API_TARGET || 'https://grateful-liberation-production-d036.up.railway.app';
                const newUrl = new URL(url.pathname + url.search, targetBase);

                const proxyRequest = new Request(newUrl, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body,
                    redirect: 'follow'
                });

                return await fetch(proxyRequest);
            }

            // 1. Try to fetch the asset
            let response = await env.ASSETS.fetch(request);

            // 2. SPA Fallback
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
        } catch (e: any) {
            return new Response(`Worker Exception: ${e.message}\n${e.stack}`, { status: 500 });
        }
    }
};
