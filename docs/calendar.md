# Crunchtime — Calendar Feature

Group availability calendar. Members mark when they're free (morning/evening slots) and see who else is available. The month view highlights the best overlapping time slots so the group can find a time that works for the most people.

---

## Data Model

### Database Table

**calendar_availability**

| Column | Type | Notes |
|--------|------|-------|
| member_id | TEXT FK → members | Who is available |
| date | TEXT NOT NULL | `YYYY-MM-DD` format |
| slot | TEXT NOT NULL | `morning` or `evening` (CHECK constraint) |

Composite primary key: `(member_id, date, slot)`. A row existing means that member is available for that slot on that date — no row means unavailable.

### TypeScript Types (`src/data/calendarData.ts`)

```typescript
interface DayAvailability {
  morning: string[]   // member IDs
  evening: string[]   // member IDs
}

type CalendarAvailability = Record<string, DayAvailability>
// keyed by "YYYY-MM-DD"
```

### Helper Functions (`src/data/calendarData.ts`)

| Function | Description |
|----------|-------------|
| `dateKey(date)` | Converts a `Date` to `YYYY-MM-DD` string |
| `today()` | Returns today at midnight |
| `isPast(dateStr)` | True if the date is before today |
| `isWithin90Days(dateStr)` | True if the date is between today and 90 days out |
| `getBestSlots(availability, year, month)` | Returns a `Set<string>` of `"YYYY-MM-DD:morning"` / `"YYYY-MM-DD:evening"` keys with the highest member count in the given month |

---

## API Endpoints

All routes are mounted at `/api/calendar`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all availability grouped by date |
| POST | `/:date/:slot` | Toggle current user's availability for a date/slot |

### GET `/`

Returns all availability keyed by date. Each date has `morning` and `evening` arrays of member IDs.

```json
{
  "2026-02-25": {
    "morning": ["m1", "m2", "m3"],
    "evening": ["m1", "m4", "m5"]
  },
  "2026-02-27": {
    "morning": ["m2"],
    "evening": ["m2", "m3"]
  }
}
```

### POST `/:date/:slot`

Toggles the authenticated user's availability. If a row exists for that user/date/slot, it is deleted (opt out); otherwise a row is inserted (opt in).

**Path parameters:**
- `date` — `YYYY-MM-DD` (validated via regex)
- `slot` — `morning` or `evening`

**Validation:**
- 400 if date format is invalid
- 400 if slot is not `morning` or `evening`

Returns the full updated availability (same shape as GET). Broadcasts a `calendar_updated` SSE event to all connected clients.

---

## Real-Time Updates

- Availability toggles use **optimistic UI updates** — the client immediately flips the toggle, then confirms with the server response.
- Server broadcasts `calendar_updated` SSE event on every change (via `GET /api/events`).
- Other connected clients listen for `calendar_updated` and refetch `GET /api/calendar`.

---

## Frontend Components

| Component | File | Role |
|-----------|------|------|
| CalendarTab | `src/components/CalendarTab.tsx` | Monthly grid calendar with availability indicators |
| DayDetailSheet | `src/components/DayDetailSheet.tsx` | Bottom sheet for viewing and toggling a single day's slots |

### CalendarTab

Monthly calendar grid rendered as a 7-column CSS grid. Key behaviors:

- **Month navigation** — left/right chevron buttons to move between months, animated month label.
- **Today indicator** — current date gets a filled black (dark: white) circle behind the number.
- **Availability badges** — days with availability show a pill with a sun emoji and the count of unique available members across both slots.
- **Best-slot highlighting** — days containing the highest-availability slot in the current month get an amber background and ring. The `getBestSlots()` function computes this.
- **Past dates** — dimmed (`opacity-30`) and non-tappable.
- **90-day window** — only dates within 90 days of today are interactive. Dates beyond that are visible but disabled.
- **Empty state** — shown when no availability data exists at all.
- **Staggered entry animation** — grid cells fade/scale in with a small per-cell delay via framer-motion.

### DayDetailSheet

Bottom sheet (max-width `md`, constrained to app container) with two slot sections:

- **Your availability summary** — two pill badges showing your morning/evening status (filled black = available, gray = unavailable). Hidden for past dates.
- **Morning section** — toggle switch + list of available members shown as avatar chips (colored circle + first name).
- **Evening section** — same layout as morning.
- **Past date handling** — toggles are replaced with a "Past" label, and a lock icon message explains editing is disabled.
- **Animated member chips** — members appear/disappear with scale transitions via framer-motion.

---

## Seed Data

`server/seed.ts` populates 18 date entries spread across the next 55 days with varying member availability. Covers a range of scenarios from sparse (2 members) to dense (10 members) availability, giving a realistic calendar view out of the box. Total: ~165 individual availability rows.
