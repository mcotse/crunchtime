# Crunchtime — Transactions Feature

Transactions track all income and expenses for the group, attributed to individual members.

---

## Data Model

### Database Table

**transactions**

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID (generated server-side) |
| description | TEXT NOT NULL | What the transaction is for |
| amount | REAL NOT NULL | Positive = income, negative = expense |
| member_id | TEXT FK → members | Who made the transaction |
| date | TEXT NOT NULL | ISO timestamp |
| category | TEXT NOT NULL | Default `'General'` |
| edit_history | TEXT NOT NULL | JSON array, default `'[]'` |

### TypeScript Types (`src/data/mockData.ts`)

```typescript
interface Transaction {
  id: string
  description: string
  amount: number        // positive = income, negative = expense
  memberId: string
  date: string          // ISO string
  category: string
  editHistory?: Array<{
    editedBy: string    // member name
    editedAt: string    // ISO timestamp
    change: string      // human-readable description of the change
  }>
}
```

---

## API Endpoints

All routes are mounted at `/api/transactions`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all transactions (newest first) |
| POST | `/` | Create a transaction |
| PATCH | `/:id` | Update a transaction (partial) |

### GET `/` — List

Returns all transactions ordered by `date DESC, rowid DESC`. The `edit_history` JSON column is parsed into an array before returning.

```json
[
  {
    "id": "abc-123",
    "description": "Grocery Run",
    "amount": -156.42,
    "memberId": "m2",
    "date": "2023-10-25T14:30:00Z",
    "category": "Food",
    "editHistory": []
  }
]
```

### POST `/` — Create

```json
{
  "amount": -85.50,
  "description": "Movie Night",
  "memberId": "m4",
  "date": "2023-10-20T19:45:00Z",
  "category": "Entertainment"
}
```

- `amount` (number, required) — must not be `NaN`.
- `description` (string, required) — trimmed; must be non-empty.
- `memberId` (string, required) — must reference an existing member.
- `date` (string, optional) — defaults to `new Date().toISOString()`.
- `category` (string, optional) — defaults to `'General'`.

Returns `201` with the created transaction object.

### PATCH `/:id` — Update

All fields are optional; only provided fields are updated.

```json
{
  "amount": -90.00,
  "description": "Movie Night (updated)",
  "memberId": "m4",
  "date": "2023-10-20T20:00:00Z",
  "category": "Entertainment"
}
```

**Validation:**
- `amount` — must be a number if provided.
- `description` — must be a non-empty string if provided.
- `memberId` — must reference an existing member if provided.

Returns `404` if the transaction ID does not exist. Returns `400` for validation failures.

---

## Real-Time Updates

All mutations (POST and PATCH) broadcast a `transaction_added` SSE event (via `GET /api/events`) with the full updated transaction object. The client listens for this event and refetches both `/api/transactions` and `/api/members` to sync balances.

---

## Edit History

The `edit_history` column stores a JSON array of edit records. Each entry contains:

| Field | Type | Description |
|-------|------|-------------|
| editedBy | string | Name of the member who made the edit |
| editedAt | string | ISO timestamp of the edit |
| change | string | Human-readable summary (e.g. "Updated amount from 2300 to 2400") |

The FeedTab displays the most recent edit entry inline beneath the transaction when `editHistory` is non-empty.

---

## Categories

Categories are free-form strings. The default is `'General'`. Categories found in seed data:

| Category | Examples |
|----------|----------|
| Food | Grocery Run, Dinner, Coffee Run |
| Housing | Rent Payment |
| Utilities | Utility Bill, Internet Bill |
| Entertainment | Movie Night |
| Transport | Gas Station, Uber Ride |
| Income | Freelance Project, Consulting Fee |
| Health | Gym Membership |
| General | Fallback when no category is specified |

The AddTransactionSheet currently hardcodes `category: 'General'` for all new transactions.

---

## Frontend Components

| Component | File | Role |
|-----------|------|------|
| FeedTab | `src/components/FeedTab.tsx` | Activity feed — all transactions newest-first with member avatar, amount, date, and inline edit history |
| AddTransactionSheet | `src/components/AddTransactionSheet.tsx` | Bottom sheet form for creating and editing transactions — income/expense toggle, amount, description, date picker, member selector |

### UI Behavior

- **Sort order** — transactions are displayed newest-first by `date`.
- **Amount sign** — the frontend toggles between income (+) and expense (-) via a segmented control; the sign is applied before submission.
- **Amount input** — restricted to decimal numbers only (`/^\d*\.?\d*$/`); displayed with a `+$` or `-$` prefix depending on type.
- **Inline editing** — a pencil icon appears on hover for each transaction row in the FeedTab. Tapping it opens AddTransactionSheet in edit mode with fields pre-populated.
- **Edit mode** — AddTransactionSheet reads `editingTransaction` prop; when present the header changes to "Edit Transaction" and the CTA changes to "Update".
- **Validation** — the form requires a positive amount and a non-empty description. On invalid submit, error states are shown and the first empty field is focused.
- **Edit history badge** — when a transaction has edit history entries, the FeedTab shows a compact badge with the most recent edit's `editedBy` and `change` text.
- **Member selector** — members are listed alphabetically with colored avatar circles; the selected member is highlighted.
- **Date default** — new transactions default to today's date; edits preserve the existing date.

---

## Validation Rules

| Rule | Where |
|------|-------|
| `amount` must be a number, not NaN | Server (POST, PATCH) |
| `description` must be a non-empty string (trimmed) | Server (POST, PATCH) + Client |
| `memberId` must exist in the members table | Server (POST, PATCH) |
| Amount must be > 0 (absolute value) | Client only |
| Description must be non-empty | Client + Server |
