import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

describe('db schema', () => {
  it('creates members table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='members'").get()
    expect(row).toBeTruthy()
  })

  it('creates transactions table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get()
    expect(row).toBeTruthy()
  })

  it('creates polls table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='polls'").get()
    expect(row).toBeTruthy()
  })

  it('creates poll_options table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='poll_options'").get()
    expect(row).toBeTruthy()
  })

  it('creates poll_votes table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='poll_votes'").get()
    expect(row).toBeTruthy()
  })

  it('creates calendar_availability table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='calendar_availability'").get()
    expect(row).toBeTruthy()
  })

  it('creates events table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").get()
    expect(row).toBeTruthy()
  })

  it('creates event_rsvps table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='event_rsvps'").get()
    expect(row).toBeTruthy()
  })

  it('seeds group_name setting', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT value FROM settings WHERE key='group_name'").get() as { value: string }
    expect(row.value).toBe('Crunch Fund')
  })

  it('rejects invalid slot in calendar_availability', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('db-m1', 'Alice', 'AL', '+1-555-0001', 'db-alice@example.com', '#6366f1')
    `).run()
    expect(() => {
      db.prepare(
        "INSERT INTO calendar_availability (member_id, date, slot) VALUES (?, ?, ?)"
      ).run('db-m1', '2026-01-01', 'afternoon')
    }).toThrow()
  })

  it('rejects invalid status in event_rsvps', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('db-m1', 'Alice', 'AL', '+1-555-0001', 'db-alice@example.com', '#6366f1')
    `).run()
    db.prepare(`
      INSERT OR IGNORE INTO events (id, title, date, creator_id, created_at)
      VALUES ('db-evt1', 'Test', '2026-01-01', 'db-m1', '2026-01-01T00:00:00.000Z')
    `).run()
    expect(() => {
      db.prepare(
        "INSERT INTO event_rsvps (event_id, member_id, status) VALUES (?, ?, ?)"
      ).run('db-evt1', 'db-m1', 'attending')
    }).toThrow()
  })

  it('cascade-deletes poll_options when poll is deleted', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('db-m1', 'Alice', 'AL', '+1-555-0001', 'db-alice@example.com', '#6366f1')
    `).run()
    db.prepare(`
      INSERT OR IGNORE INTO polls (id, title, creator_id, created_at)
      VALUES ('db-poll1', 'P', 'db-m1', '2026-01-01T00:00:00.000Z')
    `).run()
    db.prepare(`
      INSERT OR IGNORE INTO poll_options (id, poll_id, text) VALUES ('db-opt1', 'db-poll1', 'A')
    `).run()

    db.prepare('DELETE FROM polls WHERE id = ?').run('db-poll1')

    const opt = db.prepare('SELECT id FROM poll_options WHERE id = ?').get('db-opt1')
    expect(opt).toBeUndefined()
  })

  it('cascade-deletes poll_votes when poll_option is deleted', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('db-m1', 'Alice', 'AL', '+1-555-0001', 'db-alice@example.com', '#6366f1')
    `).run()
    db.prepare(`
      INSERT OR IGNORE INTO polls (id, title, creator_id, created_at)
      VALUES ('db-poll2', 'P2', 'db-m1', '2026-01-01T00:00:00.000Z')
    `).run()
    db.prepare(`
      INSERT OR IGNORE INTO poll_options (id, poll_id, text) VALUES ('db-opt2', 'db-poll2', 'A')
    `).run()
    db.prepare(`
      INSERT OR IGNORE INTO poll_votes (option_id, member_id) VALUES ('db-opt2', 'db-m1')
    `).run()

    db.prepare('DELETE FROM poll_options WHERE id = ?').run('db-opt2')

    const vote = db.prepare('SELECT * FROM poll_votes WHERE option_id = ?').get('db-opt2')
    expect(vote).toBeUndefined()
  })
})
