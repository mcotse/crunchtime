# New Frontend Integration Design

**Date:** 2026-02-22
**Status:** Approved

## Overview

Replace the existing React frontend (`src/`) with a richer UI from an external source, wiring it to the existing Hono + SQLite backend. The new frontend is a purely client-side React SPA with no API calls — all data is currently hardcoded mock data. The integration replaces mock data with real API calls, adds SSE for real-time sync, and seeds the database with the 12 mock members.

## Tech Stack (unchanged)

- **Backend:** Hono.js + better-sqlite3 (SQLite WAL mode), Cloudflare Access JWT auth, SSE
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide React
- **New deps added to frontend:** `recharts@^2.12.7`, `@emotion/react@^11.13.3`

## File Changes

| File | Action |
|---|---|
| `src/index.tsx` | Fix: `render()` → `createRoot()` (React 18 API) |
| `src/pages/BudgetApp.tsx` | Wire: fetch + SSE on mount, fix handlers to call API |
| `src/components/AddTransactionSheet.tsx` | Fix: strip client-generated `id` from POST body |
| `src/components/SettingsTab.tsx` | Copy as-is (props interface unchanged) |
| `src/components/HomeTab.tsx` | Copy as-is |
| `src/components/FeedTab.tsx` | Copy as-is |
| `src/components/MembersTab.tsx` | Copy as-is |
| `src/components/AnalyticsTab.tsx` | Copy as-is |
| `src/components/BalanceHeader.tsx` | Copy as-is |
| `src/components/TabBar.tsx` | Copy as-is |
| `src/components/ui/*` | Copy as-is |
| `src/data/mockData.ts` | Keep for type definitions only; `MEMBERS`/`TRANSACTIONS` exports removed |
| `src/App.tsx` | Copy as-is |
| `src/index.css` | Copy as-is |
| `server/seed.ts` | Update: insert 12 mock members (idempotent — skip if ID exists) |
| `package.json` | Add `recharts`, `@emotion/react` deps |

## Data Flow

### On Mount (BudgetApp.tsx)

```
GET /api/members      → members[]        (with server-calculated balances)
GET /api/transactions → transactions[]   (sorted by date DESC)
GET /api/settings     → { groupName }
GET /api/me           → currentUser      (for default member in AddTransactionSheet)
GET /api/events       → EventSource SSE  (real-time updates)
```

### SSE Events

| Event | Action |
|---|---|
| `transaction_added` | Refetch transactions + members (or append + recalc) |
| `settings_updated` | Update `groupName` state |

### User Actions

| Action | API Call |
|---|---|
| Submit AddTransactionSheet | `POST /api/transactions` `{ amount, description, memberId, date, category }` — no `id` field (server generates UUID) |
| Save group name in SettingsTab | `PATCH /api/settings` `{ groupName }` — called from BudgetApp's `onGroupNameChange` handler |

## State Structure (BudgetApp.tsx)

```typescript
const [activeTab, setActiveTab] = useState('home')
const [isSheetOpen, setIsSheetOpen] = useState(false)
const [transactions, setTransactions] = useState<Transaction[]>([])
const [members, setMembers] = useState<Member[]>([])
const [groupName, setGroupName] = useState('Crunch Fund')
const [isDark, setIsDark] = useState(false)
const [currentUser, setCurrentUser] = useState<Member | null>(null)
const totalBalance = members.reduce((sum, m) => sum + m.balance, 0)
```

## DB Seed Script (`server/seed.ts`)

Insert the 12 mock members from the new frontend's `mockData.ts`. Idempotent: uses `INSERT OR IGNORE` so re-running is safe. Members are inserted without a balance field (balance is calculated dynamically from transactions).

```
m1  Alex Rivera    AR  #E85D4A  alex@example.com
m2  Sarah Chen     SC  #4A90D9  sarah@example.com
m3  Mike Johnson   MJ  #2ECC71  mike@example.com
m4  Emily Davis    ED  #9B59B6  emily@example.com
m5  David Kim      DK  #F39C12  david@example.com
m6  Jessica Wu     JW  #1ABC9C  jessica@example.com
m7  Tom Wilson     TW  #E74C3C  tom@example.com
m8  Lisa Brown     LB  #3498DB  lisa@example.com
m9  Chris Lee      CL  #27AE60  chris@example.com
m10 Anna White     AW  #8E44AD  anna@example.com
m11 James Green    JG  #E67E22  james@example.com
m12 Maria Garcia   MG  #16A085  maria@example.com
```

## React Entry Point Fix

The new frontend uses the deprecated React 17 `render()` API. Update to React 18:

```tsx
// Before
import { render } from 'react-dom';
render(<App />, document.getElementById('root'));

// After
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<App />);
```

## What Does NOT Change

- `server/` directory — all backend code untouched
- `vite.config.ts` — proxy already configured (`/api` → `localhost:3000`)
- `tsconfig.json` — no changes needed
- `tailwind.config.js` — will be replaced with new frontend's version (content paths stay the same)
- Build output dir (`dist/client`) — unchanged

## Out of Scope

- Backend auth changes (Cloudflare Access)
- Adding new API endpoints
- Dark mode persistence (stays ephemeral in React state)
- The "Notifications", "Privacy & Security", "Payment Methods" menu items in Settings (UI only, no backend)
