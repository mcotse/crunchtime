import { Hono } from 'hono'
import db from '../db.js'

export const transactionsRouter = new Hono()

transactionsRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT id, description, amount, member_id as memberId, date, category, edit_history as editHistory
    FROM transactions
    ORDER BY date DESC
  `).all()
  return c.json(rows)
})
