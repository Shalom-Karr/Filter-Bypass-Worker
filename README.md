# Filter Bypass Worker

A Cloudflare Worker that acts as a reverse proxy, primarily designed to bypass network filters and access restrictions for YouTube and other Google services.

> **Disclaimer:** This project is provided for educational and research purposes only. Users are responsible for ensuring their use complies with all applicable laws, regulations, and terms of service. Do not use this tool to circumvent security policies or controls without proper authorization.

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

## Deploying to a Cloudflare Worker

There are two ways to deploy: through the **Cloudflare Dashboard** (no tools required) or with the **Wrangler CLI** (recommended for ongoing development). Both are free on the Cloudflare Workers free tier (100 000 requests/day).

---

### Option A – Cloudflare Dashboard (quickest, no CLI needed)

1. Sign up or log in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. In the left sidebar, go to **Workers & Pages**.
3. Click **Create** → **Create Worker**.
4. Give the worker a name (e.g. `filter-bypass-worker`) and click **Deploy** to create the default "Hello World" worker.
5. Click **Edit Code** to open the online editor.
6. **Delete** all of the placeholder code and **paste** the entire contents of [`worker.js`](worker.js) from this repository.
7. Click **Deploy** (top-right).

Your worker is now live at:

```
https://filter-bypass-worker.<your-account>.workers.dev
```

> **Tip:** You can find your `*.workers.dev` subdomain under **Workers & Pages → Overview** in the dashboard.

---

### Option B – Wrangler CLI (recommended)

#### Prerequisites

| Requirement | Why |
|---|---|
| [Node.js](https://nodejs.org) v16 or later | Wrangler runs on Node |
| A free [Cloudflare account](https://dash.cloudflare.com/sign-up) | Hosts the worker |

#### Step-by-step

1. **Clone the repository**

   ```bash
   git clone https://github.com/Shalom-Karr/Filter-Bypass-Worker.git
   cd Filter-Bypass-Worker
   ```

2. **Install Wrangler** (Cloudflare's CLI tool for Workers)

   ```bash
   npm install -g wrangler
   ```

   > You can also use `npx wrangler` instead of installing globally.

3. **Log in to Cloudflare**

   ```bash
   wrangler login
   ```

   This opens a browser window. Authorize Wrangler and return to the terminal.

4. **Deploy**

   ```bash
   wrangler deploy
   ```

   Wrangler reads the included `wrangler.toml` configuration file and uploads `worker.js` to Cloudflare. On success you will see output like:

   ```
   Published filter-bypass-worker (0.50 sec)
     https://filter-bypass-worker.<your-account>.workers.dev
   ```

5. **Verify** – open the printed URL in your browser. You should see the text **"Proxy Active"**.

#### Useful Wrangler commands

| Command | Description |
|---|---|
| `wrangler deploy` | Deploy (or re-deploy) the worker |
| `wrangler dev` | Start a local development server at `http://localhost:8787` |
| `wrangler tail` | Stream live logs from the deployed worker |
| `wrangler delete` | Remove the worker from Cloudflare |

---

### Configuration

The `wrangler.toml` included in this repo contains the minimal configuration needed:

```toml
name = "filter-bypass-worker"   # Worker name (becomes part of the URL)
main = "worker.js"              # Entry point
compatibility_date = "2026-04-01"
```

You can change the `name` field to give the worker a different URL, or add a [custom domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) in the Cloudflare dashboard.

## Project Structure

```
.
├── worker.js      # Cloudflare Worker entry point
└── wrangler.toml  # Wrangler deployment configuration
```

## License

This project does not currently include a license. Contact the repository owner for usage terms.
