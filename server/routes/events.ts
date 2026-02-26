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

// GET /api/events/:id/ics — download ICS calendar file
eventsRouter.get('/:id/ics', (c) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(c.req.param('id')) as EventRow | undefined
  if (!row) return c.json({ error: 'event not found' }, 404)

  const uid = `${row.id}@crunchtime`
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  let dtStart: string
  let dtEnd: string

  if (row.time) {
    const dateClean = row.date.replace(/-/g, '')
    const timeClean = row.time.replace(/:/g, '')
    dtStart = `DTSTART:${dateClean}T${timeClean}00Z`
    // Compute end time by adding 1 hour, handling midnight rollover
    const startDate = new Date(`${row.date}T${row.time}:00Z`)
    startDate.setUTCHours(startDate.getUTCHours() + 1)
    const endStamp = startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    dtEnd = `DTEND:${endStamp}`
  } else {
    const dateClean = row.date.replace(/-/g, '')
    dtStart = `DTSTART;VALUE=DATE:${dateClean}`
    const d = new Date(row.date + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + 1)
    const nextDay = d.toISOString().slice(0, 10).replace(/-/g, '')
    dtEnd = `DTEND;VALUE=DATE:${nextDay}`
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Crunchtime//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    `SUMMARY:${row.title}`,
    row.description ? `DESCRIPTION:${row.description.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n') + '\r\n'

  const filename = `${row.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
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

  if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return c.json({ error: 'invalid date format' }, 400)
  }
  if (body.time !== undefined && body.time !== null && !/^\d{2}:\d{2}$/.test(body.time)) {
    return c.json({ error: 'invalid time format' }, 400)
  }

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

// DELETE /api/events/:id — delete event (admin only)
eventsRouter.delete('/:id', (c) => {
  const member = c.get('member')
  if (!member.is_admin) return c.json({ error: 'admin only' }, 403)

  const eventId = c.req.param('id')
  const row = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId)
  if (!row) return c.json({ error: 'event not found' }, 404)

  // Unlink transactions that reference this event
  db.prepare('UPDATE transactions SET event_id = NULL WHERE event_id = ?').run(eventId)
  // Unlink polls that reference this event
  db.prepare('UPDATE polls SET event_id = NULL WHERE event_id = ?').run(eventId)
  // ON DELETE CASCADE handles event_rsvps
  db.prepare('DELETE FROM events WHERE id = ?').run(eventId)
  broadcastSSE('event_updated', { deleted: eventId })
  return c.json({ ok: true })
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
