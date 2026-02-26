# Crunchtime

A mobile-first group expense tracker and shared budget manager. Track contributions, see who owes what, and get real-time updates when transactions are added.

## Features

- **Shared balances** — per-member balance computed from transaction history
- **Real-time sync** — Server-Sent Events push new transactions to all open clients instantly
- **Activity feed** — full transaction history with categories (Food, Bills, Transport, Income, etc.)
- **Analytics** — charts and spending insights via Recharts
- **Add / edit transactions** — date picker, category, amount, and description with edit support
- **Dark mode** — persisted to localStorage; toggled from settings
- **Group settings** — member list with balances and group rename
- **Cloudflare Access auth** — member identity tied to email; dev mode skips auth automatically
- **E2E tests** — browser-based tests covering home, tabs, add transaction, and settings flows

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Hono on Node.js |
| Database | SQLite (better-sqlite3) |
| Real-time | Server-Sent Events |
| Auth | Cloudflare Access (JWT) |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
git clone <repo>
cd crunchtime
npm install
cp .env.example .env
```

Seed the database with sample members and transactions:

```bash
npm run seed
```

### Running locally

Open two terminals:

```bash
# Terminal 1 — API server (port from PORT in .env; default 3000)
npm run dev:server

# Terminal 2 — Vite dev server (port from CLIENT_PORT in .env; default 5173)
npm run dev:client
```

Set local ports in `.env` before running:

```bash
PORT=3000
CLIENT_PORT=5173
API_PORT=3000
```

- `PORT`: backend API listen port.
- `CLIENT_PORT`: Vite dev server port.
- `API_PORT`: where frontend proxies `/api` during local dev. Defaults to `PORT` if omitted.
- `API_TARGET`: optional full proxy target (overrides `API_PORT`), useful if API runs on another host.

Open `http://localhost:<CLIENT_PORT>`. In dev mode, auth is skipped and the first seeded member is used as the current user.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: `3000`) |
| `CLIENT_PORT` | Vite dev server port | No (default: `5173`) |
| `API_PORT` | Local API proxy target port used by Vite (`/api`) | No (default: `PORT` or `3000`) |
| `API_TARGET` | Full local API proxy target used by Vite (`/api`) | No (default: `http://localhost:<API_PORT>`) |
| `DB_PATH` | Absolute path to the SQLite database file | No (default: `crunchtime.db` in CWD) |
| `CF_TEAM_DOMAIN` | Cloudflare Access team domain — enables JWT auth | No |

When `CF_TEAM_DOMAIN` is not set, the server runs in dev mode (no auth check, first member assumed).

## API

All routes are under `/api` and protected by auth middleware in production.

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/members` | Members with computed balances |
| `GET` | `/api/transactions` | All transactions, newest first |
| `POST` | `/api/transactions` | Add a transaction |
| `GET` | `/api/settings` | Group name |
| `PATCH` | `/api/settings` | Update group name |
| `GET` | `/api/me` | Current user's member profile |
| `GET` | `/api/events` | SSE stream (`transaction_added`, `settings_updated`) |

## Deployment

The Makefile handles the full production lifecycle:

```bash
make deploy   # stop any running instance, build, and start server + Cloudflare tunnel
make build    # build only (tsc + vite)
make stop     # kill the server and tunnel processes
```

`make deploy` runs `scripts/start-prod.sh`, which starts the compiled server and the `cloudflared` tunnel as background processes. Press `Ctrl+C` to stop both.

### First-time setup

1. Configure `scripts/start-prod.sh` with your `DB_PATH`, `CF_TEAM_DOMAIN`, and `PORT`.

2. Seed production members into the database:

   ```bash
   npx tsx server/seed-prod.ts
   ```

3. Deploy:

   ```bash
   make deploy
   ```

Members are looked up by the email in the Cloudflare Access JWT. The DB email list and the Cloudflare Access email whitelist must be kept in sync manually.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start API server with hot reload |
| `npm run dev:client` | Start Vite dev server |
| `npm run build` | Build for production (tsc + vite) |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `make deploy` | Build and start server + Cloudflare tunnel |
| `make build` | Build only |
| `make stop` | Stop server and tunnel |
