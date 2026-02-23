import { Hono } from 'hono'
import type { Variables } from '../middleware/auth.js'

export const meRouter = new Hono<{ Variables: Variables }>()

meRouter.get('/', (c) => {
  const member = c.get('member')
  if (!member) return c.json({ error: 'Not authenticated' }, 404)
  return c.json(member)
})
