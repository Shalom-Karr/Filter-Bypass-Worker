# Filter Bypass Worker

A Cloudflare Worker that acts as a reverse proxy, primarily designed to bypass network filters and access restrictions for YouTube and other Google services.

## How It Works

The worker intercepts HTTP requests and forwards them to the target URL, rewriting headers and response content so that resources load correctly through the proxy.

Key behaviors:

- **CORS handling** – Responds to preflight `OPTIONS` requests with permissive CORS headers so the proxy can be called from any origin.
- **Request proxying** – Forwards the original request (including method and body) to the target URL while spoofing `Origin`, `Referer`, and `Host` headers to match the destination.
- **Header cleanup** – Strips `Content-Security-Policy` and `X-Frame-Options` from responses to allow embedding and cross-origin usage.
- **URL rewriting** – Rewrites Google/YouTube domain URLs found in HTML and JavaScript responses so that subsequent requests also route through the proxy.
- **YouTube path handling** – Automatically resolves bare paths (e.g. `/watch?v=...`) to `https://www.youtube.com` and handles `videoplayback` chunk requests.

## Usage

Pass the target URL as a query parameter:

```
https://<your-worker>.workers.dev/?url=https://www.youtube.com
```

If no `url` parameter is provided and the path is `/`, the worker returns a simple `Proxy Active` health-check response.

## Deployment

### Prerequisites

- A [Cloudflare](https://cloudflare.com) account
- [Node.js](https://nodejs.org) (v16+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Steps

1. **Install Wrangler**

   ```bash
   npm install -g wrangler
   ```

2. **Authenticate**

   ```bash
   wrangler login
   ```

3. **Create a `wrangler.toml`** (if one doesn't already exist)

   ```toml
   name = "filter-bypass-worker"
   main = "worker.js"
   compatibility_date = "2024-01-01"
   ```

4. **Deploy**

   ```bash
   wrangler deploy
   ```

The worker will be available at `https://filter-bypass-worker.<your-subdomain>.workers.dev`.

## Project Structure

```
.
└── worker.js   # Cloudflare Worker entry point
```

## License

This project does not currently include a license. Contact the repository owner for usage terms.
