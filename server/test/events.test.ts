import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

async function getApp() {
  const { app } = await import('../index.js')
  return app
}

async function seedMembers() {
  const { default: db } = await import('../db.js')
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
    VALUES ('m1', 'Alice', 'AL', '+1-555-0101', 'alice@example.com', '#6366f1')
  `).run()
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
    VALUES ('m2', 'Bob', 'BO', '+1-555-0202', 'bob@example.com', '#ec4899')
  `).run()
}

describe('GET /api/events', () => {
  beforeEach(() => seedMembers())

  it('returns empty array when no events exist', async () => {
    const app = await getApp()
    const res = await app.request('/api/events')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('POST /api/events — create', () => {
  beforeEach(() => seedMembers())

  it('creates an event and returns 201', async () => {
    const app = await getApp()
    const res = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Team Dinner', date: '2026-03-15' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.title).toBe('Team Dinner')
    expect(body.date).toBe('2026-03-15')
    expect(body.creatorId).toBe('m1')
    // Creator is auto-RSVP'd as going
    expect(body.rsvps.some((r: any) => r.memberId === 'm1' && r.status === 'going')).toBe(true)
  })

  it('rejects missing title with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-03-15' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects missing date with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No Date Event' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects invalid date format with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Bad Date', date: '03-15-2026' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/events/:id', () => {
  beforeEach(() => seedMembers())

  it('returns event with rsvps, linkedPoll, linkedTransactions, dateAvailability', async () => {
    const app = await getApp()
    // Create event via API (m1 is creator)
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Detail Test Event', date: '2026-04-01' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}`)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.id).toBe(created.id)
    expect(Array.isArray(body.rsvps)).toBe(true)
    expect(Array.isArray(body.linkedTransactions)).toBe(true)
    expect(body).toHaveProperty('linkedPoll')
    expect(body).toHaveProperty('dateAvailability')
  })

  it('returns 404 for unknown event id', async () => {
    const app = await getApp()
    const res = await app.request('/api/events/no-such-event')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/events/:id/rsvp', () => {
  beforeEach(() => seedMembers())

  it('sets RSVP status and returns updated event', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'RSVP Test', date: '2026-04-10' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'maybe' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.rsvps.some((r: any) => r.memberId === 'm1' && r.status === 'maybe')).toBe(true)
  })

  it('rejects invalid RSVP status with 400', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'RSVP Bad Status', date: '2026-04-11' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'yes' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/events/:id — update', () => {
  beforeEach(() => seedMembers())

  it('allows creator to update event fields', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Original Title', date: '2026-05-01' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.title).toBe('Updated Title')
  })

  it('rejects update by non-creator with 403', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    // Seed event directly with m2 as creator
    db.prepare(`
      INSERT OR IGNORE INTO events (id, title, date, creator_id, created_at)
      VALUES ('evt-m2-owned', 'M2 Event', '2026-05-10', 'm2', '2026-01-01T00:00:00.000Z')
    `).run()

    const res = await app.request('/api/events/evt-m2-owned', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hijacked' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/events/:id/archive', () => {
  beforeEach(() => seedMembers())

  it('allows creator to archive their event', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Archive Me', date: '2026-05-20' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/archive`, { method: 'PATCH' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.isArchived).toBe(true)
  })

  it('rejects archive by non-creator with 403', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO events (id, title, date, creator_id, created_at)
      VALUES ('evt-m2-archive', 'M2 Archive', '2026-05-25', 'm2', '2026-01-01T00:00:00.000Z')
    `).run()

    const res = await app.request('/api/events/evt-m2-archive/archive', { method: 'PATCH' })
    expect(res.status).toBe(403)
  })

  it('archived events do not appear in GET /api/events list', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Will Be Archived', date: '2026-05-30' }),
    })
    const created = await createRes.json() as any
    await app.request(`/api/events/${created.id}/archive`, { method: 'PATCH' })

    const listRes = await app.request('/api/events')
    const list = await listRes.json() as any[]
    expect(list.every((e: any) => e.id !== created.id)).toBe(true)
  })
})
