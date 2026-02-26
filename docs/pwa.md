# PWA Support & Push Notifications

## Overview

Crunchtime is a Progressive Web App (PWA) — installable on iOS/Android home screens with offline shell caching and Web Push notifications.

## PWA Configuration

- **Plugin**: `vite-plugin-pwa` with `injectManifest` strategy
- **Service Worker**: `src/sw.ts` — custom SW with Workbox precaching + push event handlers
- **Manifest**: Auto-generated with app name, theme color `#111827`, standalone display
- **Register**: `autoUpdate` — SW updates silently without user prompt
- **Icons**: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon-180x180.png`

## iOS Meta Tags

In `index.html`:
- `viewport-fit=cover` for edge-to-edge display
- `apple-mobile-web-app-capable` for standalone mode
- `apple-mobile-web-app-status-bar-style: black-translucent`
- `apple-touch-icon` for home screen icon

## Push Notifications

### VAPID Key Setup

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Set environment variables:
```bash
export VAPID_PUBLIC_KEY="BL..."
export VAPID_PRIVATE_KEY="..."
```

When VAPID keys are not set (local dev), push is silently disabled.

### Data Model

```sql
CREATE TABLE push_subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id   TEXT NOT NULL REFERENCES members(id),
  endpoint    TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(member_id, endpoint)
);
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/push/vapid-public-key` | Returns VAPID public key |
| POST | `/api/push/subscribe` | Store push subscription (upsert) |
| DELETE | `/api/push/unsubscribe` | Remove push subscription by endpoint |

### Push Events

Push notifications are sent alongside SSE broadcasts for high-value events:

| SSE Event | Notification | Tag |
|-----------|-------------|-----|
| `transaction_added` | "New Expense: $X - description" | `transaction-{id}` |
| `poll_updated` | "Poll Update: title" | `poll-{id}` |
| `event_updated` | "Event Update: title" | `event-{id}` |

Skipped: `settings_updated`, `calendar_updated` (low value / too frequent).

Tags enable notification dedup — a new notification for the same entity replaces the previous one.

### Frontend

- **`src/lib/pushNotifications.ts`** — `subscribeToPush()`, `unsubscribeFromPush()`, `isPushSubscribed()`, `isPushSupported()`
- **Settings toggle** — "Push Notifications" toggle in SettingsTab (Notifications section), only shown when PushManager is supported

### Service Worker Push Handling

In `src/sw.ts`:
- `push` event — parses JSON payload, calls `showNotification()` with icon/badge/tag
- `notificationclick` event — focuses existing app window or opens a new one

### Expired Subscription Cleanup

When `web-push` receives a 410 (Gone) or 404 response, the subscription is automatically deleted from the database.
