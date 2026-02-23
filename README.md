# Crunchtime

A mobile-first group expense tracker and shared budget manager. Track contributions, see who owes what, and get real-time updates when transactions are added.

<!-- TODO: Add hero screenshot or demo GIF of the dashboard. Recommended: 1200x800px, showing the home tab. -->

## Features

- **Shared balances** — per-member balance computed from transaction history
- **Real-time sync** — Server-Sent Events push new transactions to all open clients instantly
- **Activity feed** — full transaction history with categories (Food, Bills, Transport, Income, etc.)
- **Analytics** — charts and spending insights via Recharts
- **Expense / income toggle** — amounts flip sign based on transaction type
- **Dark mode** — theme toggle in settings
- **Group settings** — rename the group from the UI
- **Cloudflare Access auth** — member identity tied to email; dev mode skips auth automatically

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
```

Seed the database with sample members and transactions:

```bash
npm run seed
```

### Running locally

Open two terminals:

```bash
# Terminal 1 — API server (port 3000)
npm run dev:server

# Terminal 2 — Vite dev server (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173). In dev mode, auth is skipped and the first seeded member is used as the current user.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: `3000`) |
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

1. Build the client bundle and compile the server:

   ```bash
   npm run build
   ```

2. Set `CF_TEAM_DOMAIN` to your Cloudflare Access team domain.

3. Run the compiled server:

   ```bash
   node dist/server/index.js
   ```

   The server serves the built client from `dist/client` and exposes the API on the same port.

Members are looked up by the email in the Cloudflare Access JWT. Add members to the database with matching emails before deploying.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start API server with hot reload |
| `npm run dev:client` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
