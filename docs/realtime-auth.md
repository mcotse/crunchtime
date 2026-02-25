# Crunchtime — Authentication & Real-Time (SSE)

Authentication gates every API request via Cloudflare Access JWTs in production and a dev-mode bypass locally. Real-time updates are pushed to all connected clients over Server-Sent Events.

---

## Authentication

### Cloudflare Access JWT Flow

In production (`CF_TEAM_DOMAIN` is set), every request must include a `CF-Access-Jwt-Assertion` header containing a JWT issued by Cloudflare Access.

1. The middleware reads the `CF-Access-Jwt-Assertion` header.
2. The token is verified against the JWKS endpoint at `https://<CF_TEAM_DOMAIN>.cloudflareaccess.com/cdn-cgi/access/certs` using `jose.jwtVerify`.
3. The JWKS fetcher is lazily instantiated and reused across requests.
4. On success the `email` claim is extracted from the JWT payload.
5. Missing or invalid tokens return `401 Unauthorized`.

### Dev Mode Bypass

When `CF_TEAM_DOMAIN` is not set (local development), the middleware skips JWT verification entirely and resolves the authenticated user to the first member row in the database.

### Member Resolver

The email extracted from the JWT (or the first row in dev mode) is matched against the `members` table:

```sql
SELECT m.id, m.name, m.initials, m.phone, m.email, m.color,
       COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
FROM members m WHERE m.email = ?
```

If no matching member exists, the middleware returns `403 Forbidden`. On success the `member` object (including computed `balance`) is stored in the Hono context via `c.set('member', ...)` and available to all downstream handlers.

### GET `/api/me`

Returns the authenticated member object set by the middleware. Returns `404` with `{ error: 'Not authenticated' }` if no member is resolved.

**Response shape:**

```json
{
  "id": "m1",
  "name": "Alice",
  "initials": "A",
  "phone": "+1234567890",
  "email": "alice@example.com",
  "color": "#6366f1",
  "balance": 150.00
}
```

---

## Real-Time (SSE)

### Architecture

The server maintains an in-memory `Set` of active stream clients. Each client entry exposes a `write` and `close` method. When a client disconnects, the `onAbort` callback removes it from the set. Failed writes also trigger cleanup.

### GET `/api/events`

Opens a persistent SSE connection.

1. A new client object wrapping the Hono stream is added to `activeStreams`.
2. An initial `: connected` comment is written as a keep-alive signal.
3. The stream is held open via a `Promise` that resolves only on abort.
4. On disconnect the client is removed from `activeStreams`.

### `broadcastSSE(event, data)`

Sends a formatted SSE message to every active stream:

```
event: <event>\ndata: <JSON>\n\n
```

If a write fails (client already disconnected), that client is silently removed from the set.

### Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `transaction_added` | POST `/api/transactions` | Transaction object |
| `settings_updated` | PATCH `/api/settings` | `{ groupName }` |
| `poll_updated` | Any poll mutation (create, vote, add option, archive/unarchive) | Full updated poll object |

### Client-Side Listener

`BudgetApp.tsx` opens an `EventSource` to `/api/events` on mount and registers per-event handlers:

| Event | Handler behavior |
|-------|-----------------|
| `transaction_added` | Refetches `/api/members` and `/api/transactions`, updates state |
| `settings_updated` | Parses event data, updates `groupName` state directly |
| `poll_updated` | Refetches `/api/polls`, updates polls state |

The `EventSource` is closed in the effect cleanup function when the component unmounts.

---

## Key Files

| File | Role |
|------|------|
| `server/middleware/auth.ts` | Auth middleware — JWT verification, dev bypass, member resolver |
| `server/routes/me.ts` | `/api/me` endpoint |
| `server/routes/events.ts` | SSE endpoint and `broadcastSSE` function |
| `server/sse.ts` | Re-exports `broadcastSSE` for use by other route modules |
| `src/pages/BudgetApp.tsx` | Client-side `EventSource` setup and event handling |
