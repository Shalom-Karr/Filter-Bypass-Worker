export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const workerOrigin = `${url.protocol}//${url.host}`;

    // 1. HANDLE CORS PREFLIGHT (The browser asking if it's allowed to talk to the proxy)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 2. FIND THE TARGET
    let targetUrlStr = url.searchParams.get('url');

    // Auto-fix relative paths or sub-domain requests from YouTube
    if (!targetUrlStr && url.pathname !== "/") {
      if (url.pathname.includes('videoplayback')) {
          // This is a video chunk. We need to guess the subdomain or use the referer
          const referer = request.headers.get("Referer");
          if (referer && referer.includes("googlevideo.com")) {
              const refUrl = new URL(new URL(referer).searchParams.get("url"));
              targetUrlStr = refUrl.origin + url.pathname + url.search;
          }
      } else {
          targetUrlStr = "https://www.youtube.com" + url.pathname + url.search;
      }
    }

    if (!targetUrlStr) return new Response("Proxy Active", { status: 200 });

    try {
      const targetUrl = new URL(targetUrlStr);
      const modifiedHeaders = new Headers(request.headers);
      
      modifiedHeaders.set("Origin", targetUrl.origin);
      modifiedHeaders.set("Referer", targetUrl.origin);
      modifiedHeaders.set("Host", targetUrl.host);
      // Prevent Google from seeing the proxy IP
      modifiedHeaders.delete("cf-connecting-ip");

      const response = await fetch(targetUrlStr, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      // 3. CLEANUP HEADERS
      let newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Expose-Headers", "*");
      newHeaders.delete("Content-Security-Policy");
      newHeaders.delete("X-Frame-Options");

      // 4. AGGRESSIVE REWRITE FOR JS AND HTML
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("text/html") || contentType.includes("javascript")) {
        let text = await response.text();
        
        // Regex to catch almost all Google-related domains and route them through the proxy
        const domainRegex = /https:\/\/([a-z0-9-]+\.)+(googlevideo|youtube|gstatic|ytimg|google|googleads|doubleclick)\.[a-z]{2,}/g;
        text = text.replace(domainRegex, (match) => `${workerOrigin}/?url=${encodeURIComponent(match)}`);

        return new Response(text, { headers: newHeaders });
      }

      return new Response(response.body, { status: response.status, headers: newHeaders });

    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
