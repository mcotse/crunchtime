import { Hono } from 'hono'
import db from '../db.js'
import { getVapidPublicKey, sendPushToAll } from '../push.js'
import type { Variables } from '../middleware/auth.js'

export const pushRouter = new Hono<{ Variables: Variables }>()

pushRouter.get('/vapid-public-key', (c) => {
  return c.json({ key: getVapidPublicKey() })
})

pushRouter.post('/subscribe', async (c) => {
  const member = c.get('member')
  const body = await c.req.json<{
    endpoint: string
    keys: { p256dh: string; auth: string }
  }>()

  db.prepare(`
    INSERT INTO push_subscriptions (member_id, endpoint, keys_p256dh, keys_auth)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(member_id, endpoint) DO UPDATE SET
      keys_p256dh = excluded.keys_p256dh,
      keys_auth = excluded.keys_auth
  `).run(member.id, body.endpoint, body.keys.p256dh, body.keys.auth)

  return c.json({ ok: true })
})


pushRouter.post('/send', async (c) => {
  const member = c.get('member')
  if (!member.is_admin) return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json<{ title?: string; body: string }>()
  await sendPushToAll(body.title ?? 'Crunchtime', body.body, {
    tag: 'broadcast-' + Date.now(),
  })
  return c.json({ ok: true })
})

pushRouter.delete('/unsubscribe', async (c) => {
  const member = c.get('member')
  const body = await c.req.json<{ endpoint: string }>()

  db.prepare('DELETE FROM push_subscriptions WHERE member_id = ? AND endpoint = ?')
    .run(member.id, body.endpoint)

  return c.json({ ok: true })
})
