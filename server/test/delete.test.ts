import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

async function getApp() {
  const { app } = await import('../index.js')
  return app
}

async function getDb() {
  const { default: db } = await import('../db.js')
  return db
}

async function seedMembers() {
  const db = await getDb()
  // m1 is admin (first member = authenticated user in dev mode)
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color, is_admin)
    VALUES ('m1', 'Alice', 'AL', '+1-555-0101', 'alice@example.com', '#6366f1', 1)
  `).run()
  // m2 is NOT admin
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color, is_admin)
    VALUES ('m2', 'Bob', 'BO', '+1-555-0202', 'bob@example.com', '#ec4899', 0)
  `).run()
}

// ── Transactions ─────────────────────────────────────────────

describe('DELETE /api/transactions/:id', () => {
  beforeEach(() => seedMembers())

  it('allows admin to delete a transaction', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-del-1', 'Test Expense', -50, 'm2', '2026-01-01', 'General')
    `).run()

    const res = await app.request('/api/transactions/tx-del-1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)

    // Verify it's actually deleted
    const row = db.prepare('SELECT id FROM transactions WHERE id = ?').get('tx-del-1')
    expect(row).toBeUndefined()
  })

  it('returns 404 for non-existent transaction', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions/no-such-tx', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('rejects delete by non-admin with 403', async () => {
    const db = await getDb()
    // Make m1 a non-admin temporarily
    db.prepare('UPDATE members SET is_admin = 0 WHERE id = ?').run('m1')
    db.prepare(`
      INSERT OR IGNORE INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-del-nonadmin', 'Protected', -10, 'm1', '2026-01-01', 'General')
    `).run()

    const app = await getApp()
    const res = await app.request('/api/transactions/tx-del-nonadmin', { method: 'DELETE' })
    expect(res.status).toBe(403)

    // Restore admin
    db.prepare('UPDATE members SET is_admin = 1 WHERE id = ?').run('m1')
  })

  it('deleted transaction no longer appears in GET /api/transactions', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-del-list', 'Will Be Deleted', -20, 'm1', '2026-01-01', 'General')
    `).run()

    await app.request('/api/transactions/tx-del-list', { method: 'DELETE' })
    const listRes = await app.request('/api/transactions')
    const list = await listRes.json() as any[]
    expect(list.every((t: any) => t.id !== 'tx-del-list')).toBe(true)
  })
})

// ── Polls ────────────────────────────────────────────────────

describe('DELETE /api/polls/:id', () => {
  beforeEach(() => seedMembers())

  it('allows admin to delete a poll', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT OR IGNORE INTO polls (id, emoji, title, creator_id, created_at)
      VALUES ('poll-del-1', '📊', 'Delete Me', 'm2', '2026-01-01T00:00:00.000Z')
    `).run()
    db.prepare(`INSERT OR IGNORE INTO poll_options (id, poll_id, text) VALUES ('po-1', 'poll-del-1', 'A')`).run()
    db.prepare(`INSERT OR IGNORE INTO poll_options (id, poll_id, text) VALUES ('po-2', 'poll-del-1', 'B')`).run()

    const res = await app.request('/api/polls/poll-del-1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)

    // Verify cascading delete of options
    const options = db.prepare('SELECT id FROM poll_options WHERE poll_id = ?').all('poll-del-1')
    expect(options).toHaveLength(0)
  })

  it('returns 404 for non-existent poll', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls/no-such-poll', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('rejects delete by non-admin with 403', async () => {
    const db = await getDb()
    db.prepare('UPDATE members SET is_admin = 0 WHERE id = ?').run('m1')
    db.prepare(`
      INSERT OR IGNORE INTO polls (id, emoji, title, creator_id, created_at)
      VALUES ('poll-del-nonadmin', '📊', 'Protected', 'm1', '2026-01-01T00:00:00.000Z')
    `).run()

    const app = await getApp()
    const res = await app.request('/api/polls/poll-del-nonadmin', { method: 'DELETE' })
    expect(res.status).toBe(403)

    db.prepare('UPDATE members SET is_admin = 1 WHERE id = ?').run('m1')
  })

  it('deleted poll no longer appears in GET /api/polls', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT OR IGNORE INTO polls (id, emoji, title, creator_id, created_at)
      VALUES ('poll-del-list', '📊', 'Vanish', 'm1', '2026-01-01T00:00:00.000Z')
    `).run()

    await app.request('/api/polls/poll-del-list', { method: 'DELETE' })
    const listRes = await app.request('/api/polls')
    const list = await listRes.json() as any[]
    expect(list.every((p: any) => p.id !== 'poll-del-list')).toBe(true)
  })
})

// ── Events ───────────────────────────────────────────────────

describe('DELETE /api/events/:id', () => {
  beforeEach(() => seedMembers())

  it('allows admin to delete an event', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT OR IGNORE INTO events (id, emoji, title, date, creator_id, created_at)
      VALUES ('evt-del-1', '🎉', 'Delete Me', '2026-03-01', 'm2', '2026-01-01T00:00:00.000Z')
    `).run()
    db.prepare(`INSERT OR IGNORE INTO event_rsvps (event_id, member_id, status) VALUES ('evt-del-1', 'm2', 'going')`).run()

    const res = await app.request('/api/events/evt-del-1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)

    // Verify cascading delete of RSVPs
    const rsvps = db.prepare('SELECT * FROM event_rsvps WHERE event_id = ?').all('evt-del-1')
    expect(rsvps).toHaveLength(0)
  })

  it('returns 404 for non-existent event', async () => {
    const app = await getApp()
    const res = await app.request('/api/events/no-such-event', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('rejects delete by non-admin with 403', async () => {
    const db = await getDb()
    db.prepare('UPDATE members SET is_admin = 0 WHERE id = ?').run('m1')
    db.prepare(`
      INSERT OR IGNORE INTO events (id, emoji, title, date, creator_id, created_at)
      VALUES ('evt-del-nonadmin', '🎉', 'Protected', '2026-03-01', 'm1', '2026-01-01T00:00:00.000Z')
    `).run()

    const app = await getApp()
    const res = await app.request('/api/events/evt-del-nonadmin', { method: 'DELETE' })
    expect(res.status).toBe(403)

    db.prepare('UPDATE members SET is_admin = 1 WHERE id = ?').run('m1')
  })

  it('deleted event no longer appears in GET /api/events', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT OR IGNORE INTO events (id, emoji, title, date, creator_id, created_at)
      VALUES ('evt-del-list', '🎉', 'Vanish', '2026-03-01', 'm1', '2026-01-01T00:00:00.000Z')
    `).run()

    await app.request('/api/events/evt-del-list', { method: 'DELETE' })
    const listRes = await app.request('/api/events')
    const list = await listRes.json() as any[]
    expect(list.every((e: any) => e.id !== 'evt-del-list')).toBe(true)
  })

  it('unlinking: deleting event nullifies event_id on linked transactions', async () => {
    const app = await getApp()
    const db = await getDb()
    db.prepare(`
      INSERT OR IGNORE INTO events (id, emoji, title, date, creator_id, created_at)
      VALUES ('evt-del-unlink', '🎉', 'Unlink Test', '2026-04-01', 'm1', '2026-01-01T00:00:00.000Z')
    `).run()
    db.prepare(`
      INSERT INTO transactions (id, description, amount, member_id, date, category, event_id)
      VALUES ('tx-linked', 'Linked Expense', -30, 'm1', '2026-04-01', 'General', 'evt-del-unlink')
    `).run()

    await app.request('/api/events/evt-del-unlink', { method: 'DELETE' })

    const tx = db.prepare('SELECT event_id FROM transactions WHERE id = ?').get('tx-linked') as any
    expect(tx.event_id).toBeNull()
  })
})
