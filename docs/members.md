# Crunchtime — Members

Members represent the people in a shared group. Each member has a profile (name, contact info, avatar color) and a computed balance derived from their transactions.

---

## Data Model

### Database Table

**members**

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. `m1`, `m2` |
| name | TEXT NOT NULL | Full display name |
| initials | TEXT NOT NULL | Two-letter avatar label |
| phone | TEXT NOT NULL | Phone number |
| email | TEXT NOT NULL UNIQUE | Email address |
| color | TEXT NOT NULL | Hex color for avatar background |

Balance is **not** stored on the members table. It is computed at query time from the `transactions` table (see API section).

### TypeScript Type (`src/data/mockData.ts`)

```typescript
interface Member {
  id: string
  name: string
  initials: string
  phone: string
  email: string
  color: string
  balance: number // positive = net contributor, negative = net debtor
}
```

---

## API Endpoint

All routes are mounted at `/api/members`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all members with computed balances |

### GET `/` — List Members

Returns every member with a `balance` field computed via:

```sql
SELECT
  m.id, m.name, m.initials, m.phone, m.email, m.color,
  COALESCE(
    (SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id),
    0
  ) AS balance
FROM members m
```

`COALESCE` ensures members with no transactions return `0` instead of `NULL`.

---

## Balance Semantics

- **Positive balance** — the member is a net contributor (more income than expenses).
- **Negative balance** — the member is a net debtor (more expenses than income).
- **Zero** — the member has no transactions or their income and expenses cancel out.
- Balances are always computed from the sum of `transactions.amount` for that member. There is no stored balance column; edits to transactions are immediately reflected.

---

## Frontend Components

| Component | File | Role |
|-----------|------|------|
| MembersTab | `src/components/MembersTab.tsx` | Full member list with avatar, name, email, and color-coded balance |
| HomeTab | `src/components/HomeTab.tsx` | Dashboard showing aggregate group balance, total income, and total expenses |

### MembersTab

- Displays a header with member count (e.g. "Group Members (12)").
- Each row shows the colored avatar circle, full name, email icon, and balance.
- Balance is color-coded: green (`text-green-600`) for non-negative, red (`text-red-600`) for negative.
- Positive balances display a `+` prefix; all balances are formatted to two decimal places.

### HomeTab

- Shows the group's aggregate balance (sum of all transaction amounts) as a large heading.
- Below that, an income/expenses breakdown in a two-column grid: total positive amounts as "Income" (green) and total negative amounts as "Expenses" (red).
- Includes an "Add Transaction" button.

---

## Color-Coded Avatars

Each member has a `color` hex value (e.g. `#E85D4A`, `#4A90D9`) and two-letter `initials`. The avatar renders as a filled circle with the color as the background and white initials centered inside. Colors are assigned per member in the seed data and do not change.

---

## Seed Data

`server/seed.ts` imports `MEMBERS` from `src/data/mockData.ts` and inserts them via `INSERT OR REPLACE`. There are 12 seed members. Balance is omitted during seeding because it is computed from transactions at query time.

There is no self-registration or sign-up flow. Members are added manually by editing the seed data and re-running the seed script.
