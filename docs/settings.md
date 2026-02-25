# Crunchtime — Settings Feature

Group settings let members rename the group, toggle dark mode, view members, and log out.

---

## Data Model

### Database Table

**settings**

| Column | Type | Notes |
|--------|------|-------|
| key | TEXT PK | Setting identifier |
| value | TEXT NOT NULL | Setting value |

Seeded with a single row: `('group_name', 'Crunch Fund')`.

### Current Keys

| Key | Default | Description |
|-----|---------|-------------|
| group_name | `Crunch Fund` | Display name shown in the home header and settings |

---

## API Endpoints

All routes are mounted at `/api/settings`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get current settings |
| PATCH | `/` | Update settings |

### GET `/` — Read

Response:

```json
{
  "groupName": "Crunch Fund"
}
```

Falls back to `"Crunch Fund"` if no row exists.

### PATCH `/` — Update

Request:

```json
{
  "groupName": "New Group Name"
}
```

Response:

```json
{
  "groupName": "New Group Name"
}
```

Returns `400` if `groupName` is missing or blank. The value is trimmed before storage. Uses `INSERT OR REPLACE` so the row is created if it doesn't exist.

---

## Real-Time Updates

Mutations broadcast a `settings_updated` SSE event (via `GET /api/events`) with the updated settings object:

```json
{
  "groupName": "New Group Name"
}
```

The client listens for this event and updates `groupName` state directly from the payload — no refetch needed.

---

## Frontend Component

| Component | File | Role |
|-----------|------|------|
| SettingsTab | `src/components/SettingsTab.tsx` | Full-screen overlay with group name, appearance, members, and support sections |

### Props

```typescript
interface SettingsTabProps {
  members: Member[]
  groupName: string
  onGroupNameChange: (name: string) => void
  isDark: boolean
  onToggleDark: () => void
  onClose?: () => void
}
```

### UI Behavior

- **Group name editing** — Tap the pencil icon to enter inline edit mode. An autofocused text input replaces the label. Press Enter or tap the check icon to save; press Escape to cancel. Empty names are rejected (client-side trim check). The parent calls `PATCH /api/settings` optimistically.
- **Dark mode toggle** — A toggle switch under the Appearance section. State is persisted to `localStorage` under `darkMode`. On first load, falls back to `window.matchMedia('(prefers-color-scheme: dark)')`. Toggling also sets `document.body.style.backgroundColor` to match.
- **Member list** — Renders all group members with colored avatar circles, name, email, and current balance (green for positive, red for negative).
- **Log out button** — Listed under the Support section with a red icon/label.
- **Version footer** — Displays `Version {__APP_VERSION__} * Built {__BUILD_DATE__}` centered at the bottom. These values are injected at build time via Vite define.
