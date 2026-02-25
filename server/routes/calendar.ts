import { Hono } from 'hono'
import db from '../db.js'
import type { Variables } from '../middleware/auth.js'
import { broadcastSSE } from './events.js'

export const calendarRouter = new Hono<{ Variables: Variables }>()

type AvailRow = { member_id: string; date: string; slot: string }

type GroupedAvailability = Record<string, { morning: string[]; evening: string[] }>

function getAllAvailability(): GroupedAvailability {
  const rows = db.prepare('SELECT member_id, date, slot FROM calendar_availability').all() as AvailRow[]
  const result: GroupedAvailability = {}
  for (const row of rows) {
    if (!result[row.date]) result[row.date] = { morning: [], evening: [] }
    const slot = row.slot as 'morning' | 'evening'
    result[row.date][slot].push(row.member_id)
  }
  return result
}

// GET /api/calendar — all availability grouped by date
calendarRouter.get('/', (c) => {
  return c.json(getAllAvailability())
})

// POST /api/calendar/:date/:slot — toggle current user's availability
calendarRouter.post('/:date/:slot', (c) => {
  const date = c.req.param('date')
  const slot = c.req.param('slot')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'invalid date format, use YYYY-MM-DD' }, 400)
  }
  if (slot !== 'morning' && slot !== 'evening') {
    return c.json({ error: 'slot must be morning or evening' }, 400)
  }

  const member = c.get('member')

  const existing = db.prepare(
    'SELECT 1 FROM calendar_availability WHERE member_id = ? AND date = ? AND slot = ?'
  ).get(member.id, date, slot)

  if (existing) {
    db.prepare(
      'DELETE FROM calendar_availability WHERE member_id = ? AND date = ? AND slot = ?'
    ).run(member.id, date, slot)
  } else {
    db.prepare(
      'INSERT INTO calendar_availability (member_id, date, slot) VALUES (?, ?, ?)'
    ).run(member.id, date, slot)
  }

  const availability = getAllAvailability()
  broadcastSSE('calendar_updated', availability)
  return c.json(availability)
})
