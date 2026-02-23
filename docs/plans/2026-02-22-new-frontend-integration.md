# New Frontend Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing React frontend (`src/`) with a richer UI from `/Users/mcotse/Downloads/172110a1-515e-418a-8fa5-40c432adb9b3`, wiring all mock data to the live Hono/SQLite backend.

**Architecture:** Copy the new frontend's `src/` wholesale into the project, then surgically wire the 3 files that touch data (`BudgetApp.tsx`, `AddTransactionSheet.tsx`, `index.tsx`) to the existing API. The backend is untouched except for `server/seed.ts` (fix import path, already has the right logic). The new UI components that are purely presentational are copied as-is.

**Tech Stack:** React 18, Vite, Hono (backend), better-sqlite3, Tailwind CSS, Framer Motion, Lucide React, recharts, @emotion/react

---

### Task 1: Add new frontend dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add `recharts` and `@emotion/react` to dependencies**

In `package.json`, inside `"dependencies"`, add:

```json
"recharts": "^2.12.7",
"@emotion/react": "^11.13.3"
```

The full dependencies block should look like this (add to existing, don't remove anything):
```json
"dependencies": {
  "@emotion/react": "^11.13.3",
  "@hono/node-server": "^1.13.7",
  "better-sqlite3": "^11.7.0",
  "framer-motion": "^11.15.0",
  "hono": "^4.6.15",
  "jose": "^5.9.6",
  "lucide-react": "^0.477.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "recharts": "^2.12.7"
}
```

**Step 2: Install**

```bash
npm install
```

Expected: no errors. `node_modules/recharts` and `node_modules/@emotion/react` now exist.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add recharts and @emotion/react for new frontend"
```

---

### Task 2: Copy new frontend source files

**Files:**
- Delete: `src/main.tsx` (old entry point — replaced by `src/index.tsx`)
- Delete: `src/pages/BudgetApp.tsx` (will be replaced with wired version)
- Copy (as-is): all other `src/` files from download
- Modify: `index.html` (update entry script + title)
- Replace: `tailwind.config.js`

**Step 1: Remove old `src/` content**

```bash
rm -rf src/
```

**Step 2: Copy new frontend `src/` into project**

```bash
cp -r /Users/mcotse/Downloads/172110a1-515e-418a-8fa5-40c432adb9b3/src ./src
```

Verify the copy:
```bash
ls src/
# Expected: App.tsx  components/  data/  index.css  index.tsx  pages/
ls src/components/
# Expected: AddTransactionSheet.tsx AnalyticsTab.tsx BalanceHeader.tsx FeedTab.tsx HomeTab.tsx MembersTab.tsx SettingsTab.tsx TabBar.tsx ui/
```

**Step 3: Update `index.html`**

The existing `index.html` references `/src/main.tsx`. The new frontend uses `/src/index.tsx`. Update the root `index.html`:

Open `index.html`. It currently contains:
```html
<title>Crunchtime</title>
...
<script type="module" src="/src/main.tsx"></script>
```

Change the script src line to:
```html
<script type="module" src="/src/index.tsx"></script>
```

Keep the title as `Crunchtime` (don't use the downloaded title "12-Member Budget Tracker main").

**Step 4: Replace `tailwind.config.js`**

The existing `tailwind.config.js` has broken content paths (`./pages/**/*.tsx` instead of `./src/**/*.tsx`). Replace with the new frontend's version:

```js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
}
```

**Step 5: Verify Vite can start (don't expect it to work yet — just no crash on config load)**

```bash
npx vite --version
```

Expected: prints version number without error.

**Step 6: Commit**

```bash
git add src/ index.html tailwind.config.js
git commit -m "feat: copy new frontend source files (pre-wiring)"
```

---

### Task 3: Fix `src/index.tsx` entry point

**Files:**
- Modify: `src/index.tsx`

**Context:** The new frontend uses the deprecated React 17 `render()` API. React 18 requires `createRoot`. Without this fix, the app will throw a runtime warning and may not work correctly.

**Step 1: View current `src/index.tsx`**

```bash
cat src/index.tsx
```

Expected current content:
```tsx
import "./index.css";
import React from "react";
import { render } from "react-dom";
import { App } from "./App";

render(<App />, document.getElementById("root"));
```

**Step 2: Replace with React 18 `createRoot`**

Replace the entire file content with:

```tsx
import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

**Step 3: Commit**

```bash
git add src/index.tsx
git commit -m "fix: update entry point to React 18 createRoot API"
```

---

### Task 4: Fix `server/seed.ts` import path

**Files:**
- Modify: `server/seed.ts`

**Context:** `server/seed.ts` imports `MEMBERS` and `TRANSACTIONS` from `'../data/mockData.ts'` — but the file is actually at `src/data/mockData.ts`. After we copied the new frontend's `mockData.ts` to `src/data/mockData.ts`, the correct import path from `server/` is `'../src/data/mockData.ts'`. The new `mockData.ts` still exports `MEMBERS` and `TRANSACTIONS`, so only the path needs to change.

**Step 1: View current `server/seed.ts`**

```bash
cat server/seed.ts
```

Expected: shows `import { MEMBERS, TRANSACTIONS } from '../data/mockData.ts'`

**Step 2: Fix the import path**

Change line 2 from:
```ts
import { MEMBERS, TRANSACTIONS } from '../data/mockData.ts'
```

To:
```ts
import { MEMBERS, TRANSACTIONS } from '../src/data/mockData.ts'
```

**Step 3: Run the seed script**

```bash
npm run seed
```

Expected output:
```
Seeded 12 members, 12 transactions.
```

If you see an error like `Cannot find module '../data/mockData.ts'` — double-check the path is exactly `'../src/data/mockData.ts'`.

If you see `SQLITE_CONSTRAINT: UNIQUE constraint failed: members.email` — the seed has already been run. That's fine; it means the OR REPLACE logic is working. Either delete `crunchtime.db` and re-run, or update the seed to use `INSERT OR IGNORE` if you want it to be idempotent without errors.

**Step 4: Verify members exist in DB**

```bash
sqlite3 crunchtime.db "SELECT id, name FROM members ORDER BY id;"
```

Expected:
```
m1|Alex Rivera
m2|Sarah Chen
m3|Mike Johnson
m4|Emily Davis
m5|David Kim
m6|Jessica Wu
m7|Tom Wilson
m8|Lisa Brown
m9|Chris Lee
m10|Anna White
m11|James Green
m12|Maria Garcia
```

**Step 5: Commit**

```bash
git add server/seed.ts
git commit -m "fix: correct mockData import path in seed script"
```

---

### Task 5: Wire `src/pages/BudgetApp.tsx` to the API

**Files:**
- Modify: `src/pages/BudgetApp.tsx`

**Context:** This is the main wiring task. The new BudgetApp.tsx currently uses hardcoded `MEMBERS` and `TRANSACTIONS` from mockData. We replace that with API fetches + SSE. The JSX render output stays exactly the same — only the data layer changes.

**Key API contracts to know:**
- `GET /api/members` → `Member[]` (each has `{ id, name, initials, phone, email, color, balance }`)
- `GET /api/transactions` → `Transaction[]` (each has `{ id, description, amount, memberId, date, category, editHistory }`)
- `GET /api/settings` → `{ groupName: string }`
- `POST /api/transactions` body: `{ amount, description, memberId, date, category }` (no `id`)
- `PATCH /api/settings` body: `{ groupName: string }`
- `GET /api/events` → SSE stream with events: `transaction_added`, `settings_updated`

**Step 1: Read the current `src/pages/BudgetApp.tsx` to understand the JSX structure**

```bash
cat src/pages/BudgetApp.tsx
```

Note the JSX carefully — especially the wrapping `<div>` className and layout. You will keep this JSX exactly as-is and only change the imports, state initialization, and handler functions.

**Step 2: Replace `src/pages/BudgetApp.tsx`**

Replace the entire file with the following. **Copy the JSX return block verbatim from the file you read in Step 1** — only the imports and logic above it change:

```tsx
import React, { useState, useEffect } from 'react';
import { Member, Transaction } from '../data/mockData';
import { BalanceHeader } from '../components/BalanceHeader';
import { TabBar } from '../components/TabBar';
import { HomeTab } from '../components/HomeTab';
import { FeedTab } from '../components/FeedTab';
import { MembersTab } from '../components/MembersTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { SettingsTab } from '../components/SettingsTab';
import { AddTransactionSheet } from '../components/AddTransactionSheet';

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState('Crunch Fund');
  const [isDark, setIsDark] = useState(false);

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);

  // Fetch all initial data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.json()),
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([membersData, txData, settingsData]) => {
      setMembers(membersData);
      setTransactions(txData);
      setGroupName(settingsData.groupName);
    });
  }, []);

  // SSE: real-time updates from server
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('transaction_added', () => {
      // Refetch both members (balance changes) and transactions
      Promise.all([
        fetch('/api/members').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
      ]).then(([membersData, txData]) => {
        setMembers(membersData);
        setTransactions(txData);
      });
    });

    es.addEventListener('settings_updated', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setGroupName(data.groupName);
    });

    return () => es.close();
  }, []);

  // POST new transaction; SSE will deliver the updated state
  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'editHistory'>) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  // PATCH group name; also update local state optimistically
  const handleGroupNameChange = async (name: string) => {
    setGroupName(name);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: name }),
    });
  };

  // === PASTE THE JSX RETURN BLOCK FROM THE ORIGINAL FILE HERE ===
  // The only change: replace onGroupNameChange={setGroupName} with onGroupNameChange={handleGroupNameChange}
  // Everything else in the JSX stays exactly the same.
  return (
    // ... your pasted JSX from Step 1 ...
    // Make sure SettingsTab receives: onGroupNameChange={handleGroupNameChange}
    // Make sure AddTransactionSheet receives: onAdd={handleAddTransaction}
  );
}
```

**IMPORTANT — two specific prop changes in the JSX:**
1. Find `onGroupNameChange={setGroupName}` and change to `onGroupNameChange={handleGroupNameChange}`
2. `onAdd={handleAddTransaction}` should already be correct (the function name matches)

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `Property 'balance' does not exist on type 'Member'` — check that `src/data/mockData.ts` still exports the `Member` interface with a `balance` field.

If you see `Type '(data: ...) => Promise<void>' is not assignable to type '(transaction: any) => void'` — that's fine, `async` functions return `Promise<void>` which TypeScript accepts for `() => void` prop types. No action needed.

**Step 4: Commit**

```bash
git add src/pages/BudgetApp.tsx
git commit -m "feat: wire BudgetApp to API — fetch + SSE + handlers"
```

---

### Task 6: Fix `AddTransactionSheet.tsx` — strip client-generated `id`

**Files:**
- Modify: `src/components/AddTransactionSheet.tsx`

**Context:** The `handleSubmit` function builds a transaction object and passes it to `onAdd()`. It includes `id: Math.random().toString(36).substr(2, 9)` — a client-generated ID. The backend generates its own UUID and will ignore this field, but it's cleaner to not send it. More importantly, this removes any confusion if the field ever gets used.

**Step 1: Read the relevant section**

```bash
grep -n "id:" src/components/AddTransactionSheet.tsx
```

Expected output — something like:
```
42:      id: Math.random().toString(36).substr(2, 9)
```

Note the line number.

**Step 2: Remove the `id:` line from the `onAdd` call**

In `src/components/AddTransactionSheet.tsx`, find the `handleSubmit` function. The `onAdd(...)` call currently looks like:

```ts
onAdd({
  amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
  description,
  memberId: selectedMember,
  date: new Date().toISOString(),
  category: 'General',
  id: Math.random().toString(36).substr(2, 9)   // ← DELETE THIS LINE
});
```

Remove the `id: Math.random()...` line. Result:

```ts
onAdd({
  amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
  description,
  memberId: selectedMember,
  date: new Date().toISOString(),
  category: 'General',
});
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

**Step 4: Commit**

```bash
git add src/components/AddTransactionSheet.tsx
git commit -m "fix: remove client-generated id from transaction POST body"
```

---

### Task 7: End-to-end smoke test

**Context:** All code changes are done. Now verify the full app works against the real backend.

**Step 1: Make sure the DB is seeded**

```bash
sqlite3 crunchtime.db "SELECT COUNT(*) FROM members;"
```

Expected: `12`. If `0`, run `npm run seed` first.

**Step 2: Start the backend server**

In one terminal:
```bash
npm run dev:server
```

Expected: `Crunchtime server running on http://localhost:3000`

**Step 3: Start the Vite dev client**

In a second terminal:
```bash
npm run dev:client
```

Expected: `Local: http://localhost:5173/` (or similar port)

**Step 4: Open the app and verify**

Open `http://localhost:5173` in a browser.

Check each tab:

| Tab | What to verify |
|-----|---------------|
| Home | Group name shows (not "Crunch Fund" default unless seed didn't set it), member count shows, total balance is a real number |
| Activity | Transaction list loads (12 seeded transactions) |
| Members | 12 members listed with names, avatars, balances |
| Analytics | Charts render with real data |
| Settings | Group name is editable; change it and verify it persists on refresh |

**Step 5: Add a transaction**

1. Tap the "Add Transaction" button
2. Enter amount: `100`, description: `Test`, select any member, type: Income
3. Submit
4. Verify the new transaction appears in Activity tab without page refresh
5. Verify the member's balance changed in Members tab

**Step 6: Test SSE multi-tab sync (optional but good)**

Open a second browser tab at `http://localhost:5173`. Add a transaction in tab 1. Verify tab 2 updates automatically.

**Step 7: Commit any final fixes**

If anything needed fixing during smoke test, commit those fixes now.

```bash
git add -A
git commit -m "fix: smoke test corrections"
```

---

## Reference: File Map

| New frontend source | Destination | Treatment |
|---|---|---|
| `src/index.tsx` | `src/index.tsx` | Copy then fix createRoot |
| `src/App.tsx` | `src/App.tsx` | Copy as-is |
| `src/index.css` | `src/index.css` | Copy as-is |
| `src/pages/BudgetApp.tsx` | `src/pages/BudgetApp.tsx` | Copy then wire API |
| `src/components/*.tsx` | `src/components/*.tsx` | Copy as-is |
| `src/components/AddTransactionSheet.tsx` | same | Copy then strip id |
| `src/components/ui/Button.tsx` | same | Copy as-is |
| `src/components/ui/Input.tsx` | same | Copy as-is |
| `src/data/mockData.ts` | `src/data/mockData.ts` | Copy as-is (types + data used by seed) |
| `tailwind.config.js` | `tailwind.config.js` | Copy as-is |
| `index.html` | `index.html` | Update script src + keep title "Crunchtime" |
| `server/seed.ts` | `server/seed.ts` | Fix import path only |
