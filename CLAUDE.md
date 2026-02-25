# Crunchtime

Mobile-first group expense tracker. React 18 + Vite + TypeScript frontend, Hono + SQLite backend, real-time sync via SSE, Cloudflare Access auth.

Features: shared transactions, per-member balances, group polls, spending analytics, dark mode.

Docs: `docs/` (shaping.md, slices.md, polls.md, plans/)

## Best Practices

- IMPORTANT: When you add, change, or remove functionality for a feature, update the corresponding doc in `docs/` to reflect those changes. Every feature has a doc (e.g. `docs/polls.md`, `docs/transactions.md`). Keep them in sync with the code.
- Fixed-position bottom sheets must use `max-w-md mx-auto` to stay within the app container width, not span the full viewport.
- Tabs without a BalanceHeader (home, polls, calendar, settings) use `pt-4` top padding. There is no longer an absolute-positioned settings icon to clear.
- When SSE events trigger data refetches, prefer using the SSE event payload directly (`JSON.parse(e.data)`) instead of firing a new GET request. A refetch can race with optimistic updates and overwrite them with stale data.
- When adding a new tab, make sure ALL tabs that share the same layout constraints are updated consistently (e.g., padding, header visibility). Don't just fix the new tab in isolation.
- When implementing from design code/mockups, don't use hardcoded mock data or local-only state for data that should persist. Always back features with the database (SQLite table + API route + seed data) following existing patterns in `server/`.
