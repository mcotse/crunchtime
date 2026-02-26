# Events

Partiful-inspired event feature for the group. Members can create events with emoji, title, date/time, description and RSVP (Going / Maybe / Can't Go). Events appear in a sub-tab of the Calendar tab alongside Availability.

## Database Schema

### `events` table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| emoji | TEXT | Event emoji (default '🎉') |
| title | TEXT | Event title |
| description | TEXT | Optional description |
| date | TEXT | YYYY-MM-DD |
| time | TEXT | HH:MM or null (all-day) |
| creator_id | TEXT FK | References members(id) |
| created_at | TEXT | ISO timestamp |
| is_archived | INTEGER | 0 or 1 |

### `event_rsvps` table
| Column | Type | Description |
|--------|------|-------------|
| event_id | TEXT FK | References events(id) ON DELETE CASCADE |
| member_id | TEXT FK | References members(id) |
| status | TEXT | 'going', 'maybe', or 'cant_go' |

Primary key: (event_id, member_id)

### Cross-feature links
- `transactions.event_id` — optional FK to events(id)
- `polls.event_id` — optional FK to events(id)

## API Endpoints

All under `/api/events`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List non-archived events, sorted by date ASC |
| GET | `/:id` | Single event with linked transactions, poll, and date availability |
| POST | `/` | Create event (auto-RSVPs creator as "going") |
| POST | `/:id/rsvp` | Set RSVP: `{ status: 'going' \| 'maybe' \| 'cant_go' }` |
| PATCH | `/:id` | Update event (creator only) |
| PATCH | `/:id/archive` | Archive event (creator only) |
| DELETE | `/:id` | Delete event (admin only) |

### GET `/:id` enriched response
Returns the event plus:
- `linkedTransactions` — transactions where event_id matches
- `linkedPoll` — poll where event_id matches (at most one)
- `dateAvailability` — calendar availability for the event's date

### DELETE `/:id` — Delete (admin only)

Permanently removes the event. Linked transactions have their `event_id` set to NULL (unlinked, not deleted). Linked polls are also unlinked. RSVPs are cascade-deleted. Returns `403` if not admin, `404` if not found. Broadcasts `event_updated` SSE event.

### POST `/` body
```json
{
  "title": "Pizza Night",
  "emoji": "🍕",
  "description": "BYOB!",
  "date": "2026-03-01",
  "time": "19:00",
  "linkedPollId": "p1"
}
```

## Real-Time Updates

All mutations broadcast `event_updated` SSE event. The SSE endpoint was renamed from `/api/events` to `/api/sse` to free up the `/api/events` path.

## Frontend Components

### Sub-Tab System
The Calendar tab has two sub-tabs: **Availability** (existing calendar) and **Events** (new). Pill buttons switch between them.

### EventsTab
List view with upcoming events grouped by month and a collapsible "Past" section. Create Event button at top.

### EventCard
Compact card showing emoji, title, formatted date/time, RSVP summary with stacked avatars, and user's RSVP status pill.

### EventDetailSheet
Full-screen Partiful-style takeover (not a bottom sheet). Renders inside the max-w-md container with `absolute inset-0 z-50`:
- Hero section with gradient background, large centered emoji (7xl) with spring animation, title, date/time with icons
- 3 RSVP buttons in column layout with emoji labels (Going 🎉 / Maybe 🤔 / Can't Go 😢), selected state uses filled colors
- Attendee chips with backdrop-blur grouped by RSVP status
- Description section
- Expenses section with "Add Expense" button — tapping opens AddTransactionSheet pre-linked to the event. Shows total spend and individual transactions.
- Linked poll section (tap to open PollDetailSheet)
- Date availability section showing who's free morning/evening
- Staggered entrance animations via framer-motion
- Admin overflow menu (three-dot icon, top-right) with "Delete Event" option — opens confirmation modal

### CreateEventSheet
Form with emoji picker (18 presets), title, date, time, description. Also shows:
- **Availability for selected date**: displays member avatars for morning/evening slots, updates when date changes
- **Poll linker**: list of active (non-archived) polls to optionally connect to the event
- Supports pre-filled date from DayDetailSheet and pre-linked poll ID
- Unsaved changes warning on close

### DayDetailSheet update
"Create Event" button at bottom that opens CreateEventSheet with the date pre-filled.

### AddTransactionSheet update
Rich event linker (replaces plain dropdown):
- When event selected: card showing emoji, title, date, going count, with "Remove" button. Auto-fills the transaction date from the event.
- When no event: dashed-border "Tap to link an event..." button that expands an animated picker list
- Supports `prefillEventId` prop for pre-linking when opened from EventDetailSheet's "Add Expense" button

### CalendarTab update
Event emoji indicators appear on calendar date cells that have events.

## Seed Data

6 sample events (seed-events.ts):
- ev1: Pizza Night (5 days out)
- ev2: Game Tournament (12 days out)
- ev3: Beach Day (20 days out)
- ev4: Team Dinner (8 days out, linked to poll p1)
- ev5: Sarah's Birthday (25 days out)
- ev6: Movie Night (7 days ago, past event with linked transaction t4)
