import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import type { Variables } from '../middleware/auth.js'
import { broadcastSSE } from './events.js'

export const transactionsRouter = new Hono<{ Variables: Variables }>()

transactionsRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT id, description, amount, member_id as memberId, date, category, edit_history as editHistory
    FROM transactions ORDER BY date DESC
  `).all()
  return c.json(rows)
})

transactionsRouter.post('/', async (c) => {
  const body = await c.req.json<{ amount: unknown; description: unknown; memberId: unknown; date: unknown; category: unknown }>()

  if (typeof body.amount !== 'number' || isNaN(body.amount)) {
    return c.json({ error: 'amount must be a number' }, 400)
  }
  if (typeof body.description !== 'string' || !body.description.trim()) {
    return c.json({ error: 'description must be a non-empty string' }, 400)
  }
  if (typeof body.memberId !== 'string' || !body.memberId) {
    return c.json({ error: 'memberId required' }, 400)
  }

  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(body.memberId)
  if (!member) return c.json({ error: 'memberId not found' }, 400)

  const id = randomUUID()
  const date = typeof body.date === 'string' ? body.date : new Date().toISOString()
  const category = typeof body.category === 'string' ? body.category : 'General'

  db.prepare(`
    INSERT INTO transactions (id, description, amount, member_id, date, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.description.trim(), body.amount, body.memberId, date, category)

  const tx = { id, description: body.description.trim(), amount: body.amount, memberId: body.memberId, date, category }
  broadcastSSE('transaction_added', tx)
  return c.json(tx, 201)
})
