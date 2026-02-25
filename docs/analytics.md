# Crunchtime — Analytics Feature

> **Status:** The Analytics tab has been removed from the bottom navigation. The `AnalyticsTab` component remains in the codebase and may be surfaced as a CTA within the Activity (Recent Activity) tab in a future iteration.

The analytics feature provides a group balance over time chart and a per-member contribution leaderboard. Balances are derived entirely from transactions — there is no stored balance column.

---

## Balance Computation

### No Stored Balance

The `members` table has no `balance` column. Balance is computed on read via a correlated subquery in `server/routes/members.ts`:

```sql
SELECT
  m.id, m.name, m.initials, m.phone, m.email, m.color,
  COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
FROM members m
```

Each member's balance is `SUM(transactions.amount)` where `amount > 0` is income and `amount < 0` is an expense. Members with no transactions get `0` via `COALESCE`.

### Total Balance

Computed client-side in `BudgetApp.tsx`:

```typescript
const totalBalance = members.reduce((sum, m) => sum + m.balance, 0)
```

This is passed to `BalanceHeader` and the `HomeTab`.

---

## Data Model

### Database Tables

**members** (balance-relevant columns)

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT NOT NULL | |
| color | TEXT NOT NULL | Used for avatar in leaderboard |

**transactions**

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| description | TEXT NOT NULL | |
| amount | REAL NOT NULL | Positive = income, negative = expense |
| member_id | TEXT FK &rarr; members | Who created the transaction |
| date | TEXT NOT NULL | ISO timestamp; used for chart ordering |
| category | TEXT NOT NULL | Default `General` |
| edit_history | TEXT NOT NULL | JSON array, default `[]` |

### TypeScript Types (`src/data/mockData.ts`)

```typescript
interface Member {
  id: string
  name: string
  initials: string
  phone: string
  email: string
  color: string
  balance: number // positive = owed money, negative = owes money
}

interface Transaction {
  id: string
  description: string
  amount: number // positive = income, negative = expense
  memberId: string
  date: string // ISO string
  category: string
  editHistory?: Array<{
    editedBy: string
    editedAt: string
    change: string
  }>
}
```

---

## Frontend Components

| Component | File | Role |
|-----------|------|------|
| BalanceHeader | `src/components/BalanceHeader.tsx` | Sticky header showing total group balance and "Add Transaction" button |
| AnalyticsTab | `src/components/AnalyticsTab.tsx` | Full analytics view — balance chart + contribution leaderboard |

### BalanceHeader

- Displays total balance as a large 44px bold number, formatted with `Intl.NumberFormat` (USD currency).
- Negative balances render in red (`text-red-600`) with a leading minus sign.
- Non-negative balances render in black (light) / white (dark).
- Sticky-positioned at the top of the viewport (`sticky top-0 z-30`).
- Contains an "Add Transaction" button (black on light, white on dark).

### AnalyticsTab

Receives `members`, `transactions`, and `isDark` as props. Contains two sections.

---

## Group Balance Over Time Chart

### Data Derivation

Transactions are sorted ascending by `date`, then reduced into a running sum:

```typescript
const sorted = [...transactions].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
)
let running = 0
const balanceOverTime = sorted.map((t) => {
  running += t.amount
  return {
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(t.date)),
    balance: parseFloat(running.toFixed(2))
  }
})
```

Each data point is one transaction. The x-axis label is the formatted date (`"Oct 1"`, `"Oct 5"`, etc.). The y-axis value is the cumulative balance at that point.

### Chart Implementation

Built with Recharts (`AreaChart`, `Area`, `ResponsiveContainer`).

| Property | Value |
|----------|-------|
| Chart type | `AreaChart` with `type="monotone"` |
| Height | 192px (`h-48`) |
| Container | `ResponsiveContainer` — 100% width, 100% height |
| X-axis | `date` key, no axis/tick lines, 10px gray text, `interval="preserveStartEnd"` |
| Y-axis | No axis/tick lines, 10px gray text |
| Tooltip | Rounded corners, shadow, 12px font, formats value as USD currency |
| Dots | Disabled; active dot is 4px radius solid circle |
| Fill | Linear gradient from top to bottom, fading to transparent |
| Margins | `top: 4, right: 4, left: -28, bottom: 0` (negative left margin to reclaim Y-axis space) |

### Dark Mode Handling

| Token | Light | Dark |
|-------|-------|------|
| Stroke color | `#000000` | `#ffffff` |
| Gradient color | `#000000` | `#ffffff` |
| Gradient start opacity | `0.08` | `0.15` (higher to remain visible on dark bg) |
| Gradient end opacity | `0` | `0` |
| Chart background | `bg-gray-50` | `bg-gray-900` |

The `isDark` prop drives color selection. Axis tick fill (`#9ca3af`) and tooltip cursor stroke (`#e5e7eb`) are static.

---

## Contribution Leaderboard

### Data Derivation

For each member, net contribution is `SUM(amount)` across their transactions:

```typescript
const leaderboard = members
  .map((m) => {
    const net = transactions
      .filter((t) => t.memberId === m.id)
      .reduce((sum, t) => sum + t.amount, 0)
    return { ...m, net }
  })
  .sort((a, b) => b.net - a.net)
```

Sorted descending by `net` — highest contributor first.

### Bar Widths

Each row has a horizontal progress bar. Width is proportional to the max absolute net value:

```typescript
const maxAbsNet = Math.max(...leaderboard.map((m) => Math.abs(m.net)), 1)
const barWidth = Math.abs(member.net) / maxAbsNet * 100
```

The floor of `1` prevents division by zero.

### Row Layout

Each row contains (left to right):

1. **Rank** — 1-indexed, gray text, right-aligned in a 20px column.
2. **Avatar** — 32px circle with the member's `color` as background and `initials` as white text.
3. **Name + bar** — Member name (truncated), followed by a 4px-tall progress bar on a gray track.
4. **Net amount** — USD-formatted with a `+` prefix for non-negative values. Positive values are black/white; negative values are gray.

### Bar Colors

| Condition | Light | Dark |
|-----------|-------|------|
| Net >= 0 | `bg-black` | `bg-white` |
| Net < 0 | `bg-gray-300` | `bg-gray-600` |

### Animations

Uses Framer Motion (`motion.div` and `motion.div`).

**Row entrance:**
- `opacity: 0 → 1`, `x: -6 → 0`
- Duration: 250ms, easing: `easeOut`
- Staggered delay: `index * 40ms`

**Bar fill:**
- `width: 0 → barWidth%`
- Duration: 500ms, easing: `easeOut`
- Staggered delay: `index * 40ms + 100ms` (starts after row appears)

---

## Real-Time Updates

Transaction mutations (`POST /api/transactions`, `PATCH /api/transactions/:id`) broadcast a `transaction_added` SSE event via `GET /api/events`. The client refetches data on these events, which updates both the balance chart and leaderboard.
