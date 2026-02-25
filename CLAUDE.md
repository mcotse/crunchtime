# Crunchtime

Mobile-first group expense tracker. React 18 + Vite + TypeScript frontend, Hono + SQLite backend, real-time sync via SSE, Cloudflare Access auth.

Features: shared transactions, per-member balances, group polls, spending analytics, dark mode.

Docs: `docs/` (shaping.md, slices.md, polls.md, plans/)

## Best Practices

- IMPORTANT: When you add, change, or remove functionality for a feature, update the corresponding doc in `docs/` to reflect those changes. Every feature has a doc (e.g. `docs/polls.md`, `docs/transactions.md`). Keep them in sync with the code.
