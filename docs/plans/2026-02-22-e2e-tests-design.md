# Crunchtime E2E Tests Design

**Date:** 2026-02-22
**Tool:** [agent-browser](https://github.com/vercel-labs/agent-browser)
**Runner:** Vitest (separate config)

---

## Goal

Add end-to-end browser tests that exercise the full Crunchtime stack — React frontend, Hono API, SQLite persistence, and SSE — using agent-browser as the headless browser automation tool.

---

## Approach

**Separate vitest config + AgentBrowser wrapper class.**

E2e tests live in `e2e/` with their own `vitest.e2e.config.ts`. A `AgentBrowser` helper class wraps the `agent-browser` CLI so test code reads cleanly rather than raw `execSync` everywhere. `npm run test:e2e` runs only e2e tests; `npm test` continues to run only unit/API tests.

---

## Architecture

```
e2e/
  helpers/
    AgentBrowser.ts    # Wrapper around agent-browser CLI
    server.ts          # Starts/stops Hono + Vite dev servers
  crunchtime.e2e.ts   # Test suite
vitest.e2e.config.ts  # Separate vitest config (globalSetup, 30s timeout)
```

---

## Server Setup

Two processes started in `globalSetup`, killed in `globalTeardown`:

1. **Hono API server** on a fixed test port (3099) with `DB_PATH=/tmp/crunchtime-e2e.db` and no `CF_TEAM_DOMAIN` (dev-mode auth bypass)
2. **Vite dev server** using the existing `vite.config.ts` (proxies `/api` → port 3000 by default)

Since Vite's proxy is hardcoded to port 3000, the Hono test server runs on port 3000. Vite serves the frontend at port 5173. Tests hit `http://localhost:5173`.

The test DB is seeded via `npm run seed` after the server starts and torn down (file deleted) after tests complete.

---

## AgentBrowser Wrapper

```ts
class AgentBrowser {
  constructor(private session: string) {}

  open(url: string): void
  snapshot(opts?: { interactive?: boolean; compact?: boolean }): string  // raw text
  click(ref: string): void
  fill(ref: string, value: string): void
  select(ref: string, value: string): void
  getText(selector: string): string
  waitFor(selector: string, timeout?: number): void
  close(): void
}
```

- Each test creates an instance with `new AgentBrowser(randomUUID())`
- Commands run via `execSync('npx agent-browser <cmd> --session <name>', { encoding: 'utf-8' })`
- `close()` calls `agent-browser session delete <name>` to clean up

---

## Test Suite

### Home tab
- App mounts, renders group name "Crunch Fund" and total balance
- Recent transactions section visible

### Tab navigation
- Clicking Activity, Members, Analytics, Settings tabs renders correct content

### Add Transaction flow
- Click + button → sheet opens
- Fill amount and description → submit
- Navigate to Activity tab → new transaction is in the feed

### Settings: edit group name
- Navigate to Settings → click pencil edit → type new name → save
- Home tab shows updated name

---

## DB Isolation

Tests share one seeded DB. Write tests (Add Transaction, group name change) assert only on data they created, not on total counts. Read tests assert on seeded data from `mockData.ts`.

---

## Dependencies

- `agent-browser` (devDependency) — `npm install agent-browser` + `npx agent-browser install`
- Vitest (already installed)

---

## npm Script

```json
"test:e2e": "vitest run --config vitest.e2e.config.ts"
```
