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
    VALUES ('m1', 'Alice', 'AO', '+1-555-0101', 'alice@example.com', '#6366f1')
  `).run()
}

describe('POST /api/transactions', () => {
  beforeEach(() => seedMember())

  it('creates a transaction and returns 201', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -50, description: 'Groceries', memberId: 'm1', category: 'Food', date: '2025-01-15T10:00:00Z' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.id).toBeTruthy()
    expect(body.amount).toBe(-50)
    expect(body.description).toBe('Groceries')
  })

  it('rejects missing description with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -50, description: '', memberId: 'm1' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects non-number amount with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 'fifty', description: 'Test', memberId: 'm1' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/settings', () => {
  it('returns default group name', async () => {
    const app = await getApp()
    const res = await app.request('/api/settings')
    expect(res.status).toBe(200)
    const body = await res.json() as { groupName: string }
    expect(body.groupName).toBe('Crunch Fund')
  })
})

describe('PATCH /api/settings', () => {
  it('updates group name', async () => {
    const app = await getApp()
    const res = await app.request('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: 'Weekend Fund' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { groupName: string }
    expect(body.groupName).toBe('Weekend Fund')
  })

  it('rejects empty group name with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: '   ' }),
    })
    expect(res.status).toBe(400)
  })
})
