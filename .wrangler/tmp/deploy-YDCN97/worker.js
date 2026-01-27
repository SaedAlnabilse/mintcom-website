// src/worker.ts
var worker_default = {
  // @ts-ignore
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      const path = url.pathname;
      if (path.match(/\.[^/.]+$/) || path.startsWith("/api/")) {
        return response;
      }
      const indexUrl = new URL("/index.html", request.url);
      const indexRequest = new Request(indexUrl, request);
      return await env.ASSETS.fetch(indexRequest);
    }
    return response;
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
