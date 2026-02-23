import { Hono } from 'hono'
import db from '../db.js'
import { broadcastSSE } from './events.js'

export const settingsRouter = new Hono()

settingsRouter.get('/', (c) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'group_name'").get() as { value: string } | undefined
  return c.json({ groupName: row?.value ?? 'Crunch Fund' })
})

settingsRouter.patch('/', async (c) => {
  const body = await c.req.json<{ groupName: unknown }>()
  if (typeof body.groupName !== 'string' || !body.groupName.trim()) {
    return c.json({ error: 'groupName must be a non-empty string' }, 400)
  }
  const name = body.groupName.trim()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('group_name', ?)").run(name)
  broadcastSSE('settings_updated', { groupName: name })
  return c.json({ groupName: name })
})
