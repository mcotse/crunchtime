# Crunchtime — Polls Feature

Group polls let members vote on shared decisions (dinner spots, streaming services, budget changes, etc.).

---

## Data Model

### Database Tables

**polls**

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | Random alphanumeric |
| emoji | TEXT NOT NULL | Default `📊` |
| title | TEXT NOT NULL | The poll question |
| creator_id | TEXT FK → members | Who created the poll |
| created_at | TEXT | ISO timestamp |
| expires_at | TEXT | Optional; poll auto-closes after this |
| is_archived | INTEGER | 0 or 1 |
| archived_at | TEXT | Optional; when it was archived |
| allow_members_to_add_options | INTEGER | Default 1 |
| allow_multi_select | INTEGER | Default 0 |

**poll_options**

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | Random alphanumeric |
| poll_id | TEXT FK → polls | CASCADE on delete |
| text | TEXT NOT NULL | Option label |

**poll_votes**

| Column | Type | Notes |
|--------|------|-------|
| option_id | TEXT FK → poll_options | CASCADE on delete |
| member_id | TEXT FK → members | |
| | | Composite PK (option_id, member_id) |

### TypeScript Types (`src/data/pollsData.ts`)

```typescript
interface PollOption {
  id: string
  text: string
  voterIds: string[]
}

interface Poll {
  id: string
  emoji: string
  title: string
  options: PollOption[]
  creatorId: string
  createdAt: string
  expiresAt?: string
  isArchived: boolean
  archivedAt?: string
  allowMembersToAddOptions: boolean
  allowMultiSelect: boolean
}
```

---

## API Endpoints

All routes are mounted at `/api/polls`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all polls |
| GET | `/:id` | Get a single poll (404 if missing) |
| POST | `/` | Create a poll |
| POST | `/:id/vote` | Cast or update votes |
| POST | `/:id/options` | Add a new option |
| PATCH | `/:id/archive` | Archive a poll (creator only) |
| PATCH | `/:id/unarchive` | Unarchive a poll (creator only) |

### POST `/` — Create

```json
{
  "title": "Where should we eat?",
  "emoji": "🍽️",
  "options": ["Italian", "Japanese", "Mexican"],
  "expiresAt": "2026-03-01T23:59:59.000Z",
  "allowMembersToAddOptions": true,
  "allowMultiSelect": false
}
```

Requires `title` and at least 2 `options`. `emoji` defaults to `📊`.

### POST `/:id/vote`

```json
{
  "optionIds": ["p1o2"]
}
```

Replaces the current user's previous votes atomically. Validates multi-select rules and poll expiration.

### POST `/:id/options`

```json
{
  "text": "New option"
}
```

Only works if `allowMembersToAddOptions` is true and the poll hasn't expired.

---

## Real-Time Updates

All mutations broadcast a `poll_updated` SSE event (via `GET /api/events`) with the full updated poll object. The client listens for this event and refetches the poll list.

---

## Frontend Components

| Component | File | Role |
|-----------|------|------|
| PollsTab | `src/components/PollsTab.tsx` | Main tab view — active polls (newest first) + collapsible archived section |
| PollCard | `src/components/PollCard.tsx` | Inline-votable card with progress bars, emoji, stacked voter avatars |
| PollDetailSheet | `src/components/PollDetailSheet.tsx` | Bottom sheet with full voter names, winner banner, add-option input, archive controls |
| CreatePollSheet | `src/components/CreatePollSheet.tsx` | Bottom sheet form — emoji picker, question, dynamic options, multi-select toggle, expiration date (default: +7 days) |

### UI Behavior

- **Active polls** are sorted newest-first by `createdAt`.
- **Closed polls** show a winner banner (or "Tie") at the top of the detail sheet.
- **Inline voting** on PollCard — tap an option to vote without opening the detail sheet.
- **Voter avatars** on PollCard show stacked colored circles (icons only, no names). Detail sheet shows full names.
- **Emoji picker** in CreatePollSheet offers 18 preset emojis.
- **Unsaved changes warning** when closing CreatePollSheet with content.

---

## Seed Data

`server/seed-polls.ts` provides 6 sample polls covering common use cases: team dinner, streaming services, meeting schedule, budget increase, vacation destination, and group fund naming.
