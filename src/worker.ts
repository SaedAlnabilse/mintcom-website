// @ts-ignore
export default {
    // @ts-ignore
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);

            if (!env.ASSETS) {
                return new Response("Internal Error: env.ASSETS is broken/missing. Please define assets in wrangler.jsonc", { status: 500 });
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
