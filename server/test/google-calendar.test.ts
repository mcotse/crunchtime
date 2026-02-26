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
}

describe('GET /api/events/:id/ics — ICS file download', () => {
  beforeEach(() => seedMembers())

  it('returns a valid .ics file for an event', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'ICS Test Event', date: '2026-05-01', time: '14:00', description: 'A test event' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/ics`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/calendar; charset=utf-8')
    expect(res.headers.get('content-disposition')).toContain('.ics')

    const text = await res.text()
    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toContain('BEGIN:VEVENT')
    expect(text).toContain('ICS Test Event')
    expect(text).toContain('END:VCALENDAR')
  })

  it('returns 404 for unknown event', async () => {
    const app = await getApp()
    const res = await app.request('/api/events/nonexistent/ics')
    expect(res.status).toBe(404)
  })

  it('generates all-day event for events without time', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'All Day Event', date: '2026-05-02' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/ics`)
    const text = await res.text()
    expect(text).toContain('DTSTART;VALUE=DATE:20260502')
  })

  it('includes description in ICS output', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Described Event', date: '2026-05-03', description: 'Bring snacks' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/ics`)
    const text = await res.text()
    expect(text).toContain('DESCRIPTION:Bring snacks')
  })

  it('handles 23:00 events without producing invalid 24:00 end time', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Late Night', date: '2026-05-04', time: '23:00' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/ics`)
    const text = await res.text()
    expect(text).toContain('DTSTART:20260504T230000Z')
    // End time should roll over to next day 00:00, not invalid 24:00
    expect(text).not.toContain('T240000Z')
    expect(text).toContain('DTEND:20260505T000000Z')
  })

  it('uses CRLF line endings throughout', async () => {
    const app = await getApp()
    const createRes = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'CRLF Test', date: '2026-05-05' }),
    })
    const created = await createRes.json() as any

    const res = await app.request(`/api/events/${created.id}/ics`)
    const text = await res.text()
    // Every line should end with \r\n, and the file should end with \r\n
    const lines = text.split('\r\n')
    // Last element after split should be empty (trailing CRLF)
    expect(lines[lines.length - 1]).toBe('')
    // No bare \n without preceding \r
    expect(text.replace(/\r\n/g, '')).not.toContain('\n')
  })
})
