import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import type { Variables } from '../middleware/auth.js'
import { broadcastSSE } from './sse.js'

export const eventsRouter = new Hono<{ Variables: Variables }>()

type EventRow = {
  id: string
  emoji: string
  title: string
  description: string
  date: string
  time: string | null
  creator_id: string
  created_at: string
  is_archived: number
}

type RsvpRow = {
  event_id: string
  member_id: string
  status: string
}

function serializeEvent(row: EventRow) {
  const rsvps = db.prepare(
    'SELECT event_id, member_id, status FROM event_rsvps WHERE event_id = ?'
  ).all(row.id) as RsvpRow[]

  return {
    id: row.id,
    emoji: row.emoji,
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    creatorId: row.creator_id,
    createdAt: row.created_at,
    isArchived: !!row.is_archived,
    rsvps: rsvps.map(r => ({ memberId: r.member_id, status: r.status })),
  }
}

// GET /api/events — list non-archived events sorted by date ASC
eventsRouter.get('/', (c) => {
  const rows = db.prepare(
    'SELECT * FROM events WHERE is_archived = 0 ORDER BY date ASC, created_at ASC'
  ).all() as EventRow[]
  return c.json(rows.map(serializeEvent))
})

// GET /api/events/:id — single event with linked data
eventsRouter.get('/:id', (c) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(c.req.param('id')) as EventRow | undefined
  if (!row) return c.json({ error: 'event not found' }, 404)

  const event = serializeEvent(row)

  const linkedTransactions = db.prepare(
    'SELECT id, description, amount, member_id as memberId, date FROM transactions WHERE event_id = ?'
  ).all(row.id) as Array<{ id: string; description: string; amount: number; memberId: string; date: string }>

  const linkedPollRow = db.prepare(
    'SELECT id, emoji, title FROM polls WHERE event_id = ?'
  ).get(row.id) as { id: string; emoji: string; title: string } | undefined

  const availRows = db.prepare(
    'SELECT member_id, slot FROM calendar_availability WHERE date = ?'
  ).all(row.date) as Array<{ member_id: string; slot: string }>

  let dateAvailability: { morning: string[]; evening: string[] } | null = null
  if (availRows.length > 0) {
    dateAvailability = { morning: [], evening: [] }
    for (const a of availRows) {
      if (a.slot === 'morning') dateAvailability.morning.push(a.member_id)
      else if (a.slot === 'evening') dateAvailability.evening.push(a.member_id)
    }
  }

  return c.json({
    ...event,
    linkedTransactions,
    linkedPoll: linkedPollRow ?? null,
    dateAvailability,
  })
})

// POST /api/events — create event
eventsRouter.post('/', async (c) => {
  const body = await c.req.json<{
    title?: string
    emoji?: string
    description?: string
    date?: string
    time?: string
    linkedPollId?: string
  }>()

  if (!body.title?.trim()) return c.json({ error: 'title is required' }, 400)
  if (!body.date) return c.json({ error: 'date is required' }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return c.json({ error: 'invalid date format' }, 400)

  const member = c.get('member')
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO events (id, emoji, title, description, date, time, creator_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.emoji || '🎉',
    body.title.trim(),
    body.description?.trim() || '',
    body.date,
    body.time || null,
    member.id,
    now,
  )

  // Auto-RSVP creator as going
  db.prepare(
    'INSERT INTO event_rsvps (event_id, member_id, status) VALUES (?, ?, ?)'
  ).run(id, member.id, 'going')

  // Link poll if provided
  if (body.linkedPollId) {
    db.prepare('UPDATE polls SET event_id = ? WHERE id = ?').run(id, body.linkedPollId)
  }

  const event = serializeEvent(
    db.prepare('SELECT * FROM events WHERE id = ?').get(id) as EventRow
  )
  broadcastSSE('event_updated', event)
  return c.json(event, 201)
})

// POST /api/events/:id/rsvp — set RSVP
eventsRouter.post('/:id/rsvp', async (c) => {
  const eventId = c.req.param('id')
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow | undefined
  if (!row) return c.json({ error: 'event not found' }, 404)

  const body = await c.req.json<{ status: string }>()
  if (!['going', 'maybe', 'cant_go'].includes(body.status)) {
    return c.json({ error: 'status must be going, maybe, or cant_go' }, 400)
  }

  const member = c.get('member')

  db.prepare(`
    INSERT INTO event_rsvps (event_id, member_id, status)
    VALUES (?, ?, ?)
    ON CONFLICT(event_id, member_id)
    DO UPDATE SET status = excluded.status
  `).run(eventId, member.id, body.status)

  const event = serializeEvent(
    db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow
  )
  broadcastSSE('event_updated', event)
  return c.json(event)
})

// PATCH /api/events/:id — update event (creator only)
eventsRouter.patch('/:id', async (c) => {
  const eventId = c.req.param('id')
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow | undefined
  if (!row) return c.json({ error: 'event not found' }, 404)

  const member = c.get('member')
  if (row.creator_id !== member.id) return c.json({ error: 'only the creator can edit' }, 403)

  const body = await c.req.json<{
    title?: string
    emoji?: string
    description?: string
    date?: string
    time?: string | null
  }>()

  const newTitle = body.title?.trim() ?? row.title
  const newEmoji = body.emoji ?? row.emoji
  const newDescription = body.description?.trim() ?? row.description
  const newDate = body.date ?? row.date
  const newTime = body.time !== undefined ? body.time : row.time

  db.prepare(`
    UPDATE events SET title = ?, emoji = ?, description = ?, date = ?, time = ? WHERE id = ?
  `).run(newTitle, newEmoji, newDescription, newDate, newTime, eventId)

  const event = serializeEvent(
    db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow
  )
  broadcastSSE('event_updated', event)
  return c.json(event)
})

// PATCH /api/events/:id/archive — archive event (creator only)
eventsRouter.patch('/:id/archive', (c) => {
  const eventId = c.req.param('id')
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow | undefined
  if (!row) return c.json({ error: 'event not found' }, 404)

  const member = c.get('member')
  if (row.creator_id !== member.id) return c.json({ error: 'only the creator can archive' }, 403)

  db.prepare('UPDATE events SET is_archived = 1 WHERE id = ?').run(eventId)

  const event = serializeEvent(
    db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow
  )
  broadcastSSE('event_updated', event)
  return c.json(event)
})
