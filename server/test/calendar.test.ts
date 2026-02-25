import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

async function getApp() {
  const { app } = await import('../index.js')
  return app
}

async function seedMember() {
  const { default: db } = await import('../db.js')
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
    VALUES ('m1', 'Alice', 'AL', '+1-555-0101', 'alice@example.com', '#6366f1')
  `).run()
}

describe('GET /api/calendar', () => {
  beforeEach(() => seedMember())

  it('returns empty object when no availability is set', async () => {
    const app = await getApp()
    const res = await app.request('/api/calendar')
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(typeof body).toBe('object')
  })
})

describe('POST /api/calendar/:date/:slot — toggle', () => {
  beforeEach(() => seedMember())

  it('adds availability when not set', async () => {
    const app = await getApp()
    const res = await app.request('/api/calendar/2026-06-15/morning', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body['2026-06-15'].morning).toContain('m1')
  })

  it('removes availability when already set (toggle off)', async () => {
    const app = await getApp()
    // First toggle on
    await app.request('/api/calendar/2026-07-01/evening', { method: 'POST' })
    // Second toggle off
    const res = await app.request('/api/calendar/2026-07-01/evening', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    const eveningMembers: string[] = body['2026-07-01']?.evening ?? []
    expect(eveningMembers).not.toContain('m1')
  })

  it('rejects invalid date format with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/calendar/not-a-date/morning', { method: 'POST' })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid date/i)
  })

  it('rejects invalid slot with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/calendar/2026-06-15/afternoon', { method: 'POST' })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/slot/i)
  })
})
