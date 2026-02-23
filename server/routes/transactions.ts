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
  `).all() as Array<Record<string, unknown>>
  return c.json(rows.map(r => ({ ...r, editHistory: JSON.parse(r.editHistory as string) })))
})

transactionsRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = db.prepare('SELECT id, amount FROM transactions WHERE id = ?').get(id) as { id: string; amount: number } | undefined
  if (!existing) return c.json({ error: 'transaction not found' }, 404)

  const body = await c.req.json<{ amount?: unknown; description?: unknown; memberId?: unknown; category?: unknown; date?: unknown }>()

  if (body.amount !== undefined && (typeof body.amount !== 'number' || isNaN(body.amount as number))) {
    return c.json({ error: 'amount must be a number' }, 400)
  }
  if (body.description !== undefined && (typeof body.description !== 'string' || !(body.description as string).trim())) {
    return c.json({ error: 'description must be a non-empty string' }, 400)
  }
  if (body.memberId !== undefined) {
    const member = db.prepare('SELECT id FROM members WHERE id = ?').get(body.memberId as string)
    if (!member) return c.json({ error: 'memberId not found' }, 400)
  }

  const current = db.prepare(`
    SELECT id, description, amount, member_id as memberId, date, category, edit_history as editHistory
    FROM transactions WHERE id = ?
  `).get(id) as Record<string, unknown>

  const newAmount = body.amount !== undefined ? body.amount as number : current.amount as number
  const newDescription = body.description !== undefined ? (body.description as string).trim() : current.description as string
  const newMemberId = body.memberId !== undefined ? body.memberId as string : current.memberId as string
  const newCategory = body.category !== undefined ? body.category as string : current.category as string
  const newDate = typeof body.date === 'string' ? body.date : current.date as string

  db.prepare(`
    UPDATE transactions SET description = ?, amount = ?, member_id = ?, category = ?, date = ? WHERE id = ?
  `).run(newDescription, newAmount, newMemberId, newCategory, newDate, id)

  const updated = db.prepare(`
    SELECT id, description, amount, member_id as memberId, date, category, edit_history as editHistory
    FROM transactions WHERE id = ?
  `).get(id) as Record<string, unknown>

  const result = { ...updated, editHistory: JSON.parse(updated.editHistory as string) }
  broadcastSSE('transaction_added', result)
  return c.json(result)
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
