
// @ts-ignore
export default {
    // @ts-ignore
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Try to fetch the asset from the asset binding
        // env.ASSETS is automatically available when "assets" is defined in wrangler.jsonc
        let response = await env.ASSETS.fetch(request);

        // 2. If the response is a 404 (file not found), handle SPA fallback
        if (response.status === 404) {
            const path = url.pathname;

            // If the request looks like a file (has extension) or is an API call, return the 404.
            // This prevents "white screen" issues where a script (e.g., main.js) is missing 
            // and we accidentally serve index.html instead of letting the browser know it's missing.
            if (path.match(/\.[^/.]+$/) || path.startsWith('/api/')) {
                return response;
            }

            // Otherwise, serve index.html for client-side routing
            const indexUrl = new URL('/index.html', request.url);
            const indexRequest = new Request(indexUrl, request);
            return await env.ASSETS.fetch(indexRequest);
        }

        return response;
    }
};
