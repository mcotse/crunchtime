import { Hono } from 'hono'
import db from '../db.js'

export const membersRouter = new Hono()

membersRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT
      m.id, m.name, m.initials, m.phone, m.email, m.color,
      COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
    FROM members m
  `).all()
  return c.json(rows)
})
