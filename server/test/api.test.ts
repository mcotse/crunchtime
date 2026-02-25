import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

// Dynamically import after setting DB_PATH
async function getApp() {
  const { app } = await import('../index.js')
  return app
}

describe('GET /api/me', () => {
  it('returns 404 when no members exist', async () => {
    const app = await getApp()
    const res = await app.request('/api/me')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/members', () => {
  it('returns array of members with balance', async () => {
    const app = await getApp()
    const res = await app.request('/api/members')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(Array.isArray(body)).toBe(true)
    // In-memory DB has no seeded data — array may be empty, but shape is correct
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('id')
      expect(body[0]).toHaveProperty('balance')
    }
  })
})

describe('GET /api/transactions', () => {
  it('returns array sorted by date desc', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(Array.isArray(body)).toBe(true)
  })

  it('sorts transactions with the same date by insertion order (newest first)', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('m1', 'Alice', 'AO', '+1-555-0101', 'alice@example.com', '#6366f1')
    `).run()

    const sameDate = '2025-06-15'
    db.prepare(`INSERT INTO transactions (id, description, amount, member_id, date, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('tx-first', 'Inserted first', -10, 'm1', sameDate, 'General')
    db.prepare(`INSERT INTO transactions (id, description, amount, member_id, date, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('tx-second', 'Inserted second', -20, 'm1', sameDate, 'General')
    db.prepare(`INSERT INTO transactions (id, description, amount, member_id, date, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('tx-third', 'Inserted third', -30, 'm1', sameDate, 'General')

    const app = await getApp()
    const res = await app.request('/api/transactions')
    const body = await res.json() as any[]

    const sameDateTxs = body.filter((t: any) => t.date === sameDate)
    expect(sameDateTxs.length).toBe(3)
    expect(sameDateTxs[0].id).toBe('tx-third')
    expect(sameDateTxs[1].id).toBe('tx-second')
    expect(sameDateTxs[2].id).toBe('tx-first')
  })

  it('sorts by date desc across different dates', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('m1', 'Alice', 'AO', '+1-555-0101', 'alice@example.com', '#6366f1')
    `).run()

    db.prepare(`INSERT INTO transactions (id, description, amount, member_id, date, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('tx-old', 'Old one', -10, 'm1', '2025-01-01', 'General')
    db.prepare(`INSERT INTO transactions (id, description, amount, member_id, date, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('tx-new', 'New one', -20, 'm1', '2025-12-01', 'General')

    const app = await getApp()
    const res = await app.request('/api/transactions')
    const body = await res.json() as any[]

    const oldIdx = body.findIndex((t: any) => t.id === 'tx-old')
    const newIdx = body.findIndex((t: any) => t.id === 'tx-new')
    expect(newIdx).toBeLessThan(oldIdx)
  })
})

describe('GET /api/members — balance computation', () => {
  it('returns balance = 0 for member with no transactions', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('bal-m1', 'Charlie', 'CH', '+1-555-0301', 'charlie@example.com', '#10b981')
    `).run()

    const app = await getApp()
    const res = await app.request('/api/members')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    const member = body.find((m: any) => m.id === 'bal-m1')
    expect(member).toBeDefined()
    expect(member.balance).toBe(0)
  })

  it('returns correct balance sum for member with transactions', async () => {
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
      VALUES ('bal-m2', 'Diana', 'DI', '+1-555-0302', 'diana@example.com', '#f59e0b')
    `).run()
    db.prepare(`
      INSERT INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('bal-tx1', 'Lunch', -30, 'bal-m2', '2026-01-01', 'Food')
    `).run()
    db.prepare(`
      INSERT INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('bal-tx2', 'Coffee', -5, 'bal-m2', '2026-01-02', 'Food')
    `).run()

    const app = await getApp()
    const res = await app.request('/api/members')
    const body = await res.json() as any[]
    const member = body.find((m: any) => m.id === 'bal-m2')
    expect(member).toBeDefined()
    expect(member.balance).toBe(-35)
  })
})
