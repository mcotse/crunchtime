import { Hono } from 'hono'
import db from '../db.js'

export const meRouter = new Hono()

// V1 stub: returns first member. Replaced by real JWT lookup in V2.
meRouter.get('/', (c) => {
  const member = db.prepare(`
    SELECT
      m.id, m.name, m.initials, m.phone, m.email, m.color,
      COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
    FROM members m LIMIT 1
  `).get()
  if (!member) return c.json({ error: 'No members found' }, 404)
  return c.json(member)
})
