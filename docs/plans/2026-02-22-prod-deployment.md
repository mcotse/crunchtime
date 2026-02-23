# Production Deployment Plan (Local + Cloudflare Tunnel)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run Crunchtime in production mode locally, exposed publicly via a Cloudflare Tunnel with Cloudflare Access JWT auth.

**Architecture:** Hono server (`node dist/server/index.js`) serves both the compiled React SPA and the REST/SSE API on port **4000**. `cloudflared` creates a persistent tunnel from a public hostname to `localhost:4000`. Cloudflare Access sits in front of that hostname and issues JWTs — the server validates them via the `CF_TEAM_DOMAIN` env var. Dev server stays on its default port 3000 so both can run simultaneously.

**Tech Stack:** Node.js (ESM), Hono, better-sqlite3, Vite (built), cloudflared

---

## Gotchas to Know

- **Port conflict:** Vite's dev proxy is hardcoded to `localhost:3000` (`vite.config.ts:8`). Prod runs on **port 4000** so dev (port 3000) and prod can coexist without touching any config.
- **DB path:** In dev, `__dirname` in `server/db.ts` is `server/`, so DB lands at `crunchtime.db` (project root). In production, `__dirname` of the compiled file is `dist/server/`, so without `DB_PATH` it would look for `dist/crunchtime.db` (wrong). **Always set `DB_PATH` explicitly for prod.**
- **Separate DBs:** Use `crunchtime.db` for prod and `crunchtime-dev.db` for dev. Dev server uses `DB_PATH=$(pwd)/crunchtime-dev.db tsx watch server/index.ts`.
- **Static files:** `serveStatic({ root: './dist/client' })` resolves relative to CWD. You must run `node dist/server/index.js` **from the project root**.
- **Auth:** When `CF_TEAM_DOMAIN` is empty, auth is skipped and the first member is used. Dev intentionally leaves this unset. Set it in production.
- **Existing tunnel:** You already have tunnel `spacebot` (`7f15496c...`) wired to `app.chummycollective.com:19898`. We'll create a **separate** crunchtime tunnel so the two apps stay independent.

---

### Task 1: Rebuild the Production Bundle

Ensure `dist/` is fresh and matches current source.

**Files:**
- Generated: `dist/server/` (compiled TS)
- Generated: `dist/client/` (Vite SPA bundle)

**Step 1: Run the build**

```bash
cd /Users/mcotse/Developer/crunchtime
npm run build
```

Expected output ends with something like:
```
dist/client/index.html   x.xx kB
dist/client/assets/...
```
and no TypeScript errors.

**Step 2: Verify the server entrypoint exists**

```bash
ls dist/server/index.js
```

Expected: file exists.

**Step 3: Verify the client build exists**

```bash
ls dist/client/index.html
```

Expected: file exists.

---

### Task 2: Ensure the Database Is Seeded

The `crunchtime.db` at the project root is what we'll use. It must exist and have members in it (auth matches on email).

**Step 1: Check if the DB already has members**

```bash
sqlite3 /Users/mcotse/Developer/crunchtime/crunchtime.db "SELECT id, name, email FROM members LIMIT 5;"
```

- If rows are returned → skip to Task 3.
- If empty or error → continue.

**Step 2: Seed the database**

```bash
cd /Users/mcotse/Developer/crunchtime
npm run seed
```

**Step 3: Confirm seed worked**

```bash
sqlite3 /Users/mcotse/Developer/crunchtime/crunchtime.db "SELECT id, name, email FROM members;"
```

Expected: at least one row with real email addresses that match what Cloudflare Access will return.

---

### Task 3: Create a Cloudflare Tunnel for Crunchtime

You'll create a named tunnel and a DNS CNAME pointing at it.

**Prerequisites:**
- You must be logged in: `cloudflared tunnel list` should work (it does — you already have `cert.pem`).
- Decide on a public hostname, e.g. `crunchtime.chummycollective.com`.

**Step 1: Create the tunnel**

```bash
cloudflared tunnel create crunchtime
```

Expected: prints a new tunnel UUID. Note it down.

**Step 2: Route a hostname to the tunnel**

Replace `<your-zone>` with your domain (e.g. `chummycollective.com`):

```bash
cloudflared tunnel route dns crunchtime crunchtime.chummycollective.com
```

Expected: `Added CNAME crunchtime.chummycollective.com which will route to this tunnel`

**Step 3: Write a tunnel config file**

Create `~/.cloudflared/crunchtime.yml`:

```yaml
tunnel: crunchtime
credentials-file: /Users/mcotse/.cloudflared/<NEW-TUNNEL-UUID>.json

ingress:
  - hostname: crunchtime.chummycollective.com
    service: http://localhost:4000
  - service: http_status:404
```

Replace `<NEW-TUNNEL-UUID>` with the UUID from Step 1.

---

### Task 4: Configure Cloudflare Access

In the Cloudflare dashboard you need an Access Application so that JWTs are issued for `crunchtime.chummycollective.com`.

**Step 1: Go to Cloudflare Zero Trust dashboard**

`https://one.dash.cloudflare.com/` → Access → Applications → Add an application.

**Step 2: Create a Self-hosted application**

- **Application name:** Crunchtime
- **Session duration:** 24 hours (or your preference)
- **Application domain:** `crunchtime.chummycollective.com`

**Step 3: Add a policy**

- **Policy name:** Members
- **Action:** Allow
- **Rule:** Emails → add the exact email addresses of your members (must match what's in the DB).

**Step 4: Note your team domain**

In Zero Trust → Settings → Custom Pages (or the URL bar) — your team domain is the subdomain of `cloudflareaccess.com`, e.g. `yourteam`. The full domain is `yourteam.cloudflareaccess.com`.

---

### Task 5: Run the Production Server

Run the server from the project root with `DB_PATH` and `CF_TEAM_DOMAIN` set.

**Step 1: Start the server**

```bash
cd /Users/mcotse/Developer/crunchtime
DB_PATH=/Users/mcotse/Developer/crunchtime/crunchtime.db \
CF_TEAM_DOMAIN=<your-team-name> \
PORT=4000 \
node dist/server/index.js
```

Replace `<your-team-name>` with the subdomain from Task 4 Step 4 (just the name, not the full URL).

Expected output:
```
Crunchtime server running on http://localhost:4000
```

**Step 2: Quick smoke test (new terminal)**

```bash
curl -s http://localhost:4000/api/me
```

Expected: `{"error":"Unauthorized"}` (401) — confirms auth middleware is active and the server is running.

**Step 3: Check static files are served**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/
```

Expected: `200`

---

### Task 6: Start the Cloudflare Tunnel

In a separate terminal, start the tunnel pointing at the crunchtime config.

**Step 1: Run the tunnel**

```bash
cloudflared tunnel --config ~/.cloudflared/crunchtime.yml run crunchtime
```

Expected: lines like:
```
INF Connection established connIndex=0 ...
INF Registered tunnel connection ...
```

**Step 2: Verify public access**

Open `https://crunchtime.chummycollective.com` in a browser.

Expected: Cloudflare Access login page appears (if not already authenticated), then the Crunchtime app loads after sign-in.

---

### Task 7: (Optional) Make it Persistent with a Process Manager

If you want the server and tunnel to survive terminal closes, use a simple approach with background processes and a script.

**Step 1: Create `scripts/start-prod.sh`**

```bash
#!/bin/bash
set -e

export DB_PATH=/Users/mcotse/Developer/crunchtime/crunchtime.db
export CF_TEAM_DOMAIN=<your-team-name>
export PORT=4000

echo "Starting Crunchtime server..."
node /Users/mcotse/Developer/crunchtime/dist/server/index.js &
SERVER_PID=$!

echo "Starting Cloudflare tunnel..."
cloudflared tunnel --config ~/.cloudflared/crunchtime.yml run crunchtime &
TUNNEL_PID=$!

echo "Server PID: $SERVER_PID | Tunnel PID: $TUNNEL_PID"
echo "Press Ctrl+C to stop both"

trap "kill $SERVER_PID $TUNNEL_PID" SIGINT SIGTERM
wait
```

**Step 2: Make it executable**

```bash
chmod +x scripts/start-prod.sh
```

**Step 3: Run it**

```bash
./scripts/start-prod.sh
```

---

## Summary of Env Vars

| Variable | Example | Purpose |
|---|---|---|
| `DB_PATH` | `/Users/mcotse/Developer/crunchtime/crunchtime.db` | Absolute path to SQLite DB (avoids dist/ resolution issue) |
| `CF_TEAM_DOMAIN` | `yourteam` | Enables Cloudflare Access JWT validation |
| `PORT` | `4000` (prod) / `3000` (dev default) | Prod uses 4000 so dev server can stay on 3000 |

## Quick Reference

```bash
# Build
npm run build

# Run prod server (port 4000, prod DB, with auth)
DB_PATH=$(pwd)/crunchtime.db CF_TEAM_DOMAIN=yourteam PORT=4000 node dist/server/index.js

# Run tunnel (separate terminal)
cloudflared tunnel --config ~/.cloudflared/crunchtime.yml run crunchtime

# Run dev server alongside (port 3000, dev DB, no auth)
DB_PATH=$(pwd)/crunchtime-dev.db npm run dev:server
npm run dev:client   # Vite proxies to localhost:3000 — works as-is
```

## Running Both at Once

```
Terminal 1: DB_PATH=$(pwd)/crunchtime.db CF_TEAM_DOMAIN=yourteam PORT=4000 node dist/server/index.js
Terminal 2: cloudflared tunnel --config ~/.cloudflared/crunchtime.yml run crunchtime
Terminal 3: DB_PATH=$(pwd)/crunchtime-dev.db npm run dev:server   ← port 3000
Terminal 4: npm run dev:client                                      ← Vite on 5173, proxies to :3000
```
