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

describe('POST /api/transactions — validation', () => {
  beforeEach(() => seedMember())

  it('rejects non-existent memberId with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -10, description: 'Test', memberId: 'does-not-exist' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/memberId not found/i)
  })

  it('rejects whitespace-only description with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -10, description: '   ', memberId: 'm1' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/transactions — editHistory safety', () => {
  beforeEach(() => seedMember())

  it('does not crash when editHistory is corrupted', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO transactions (id, description, amount, member_id, date, category, edit_history)
      VALUES ('tx-corrupt', 'Bad History', -5, 'm1', '2026-01-01', 'General', 'NOT-JSON')
    `).run()

    const res = await app.request('/api/transactions')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    const corrupt = body.find((t: any) => t.id === 'tx-corrupt')
    expect(corrupt).toBeDefined()
    expect(Array.isArray(corrupt.editHistory)).toBe(true)
  })
})

describe('PATCH /api/transactions/:id', () => {
  beforeEach(() => seedMember())

  it('updates a transaction and returns 200', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-patch-1', 'Original', -10, 'm1', '2026-01-01', 'General')
    `).run()

    const res = await app.request('/api/transactions/tx-patch-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Updated', amount: -20 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.description).toBe('Updated')
    expect(body.amount).toBe(-20)
  })

  it('returns 404 for unknown transaction id', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions/no-such-tx', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Updated' }),
    })
    expect(res.status).toBe(404)
  })

  it('rejects non-number amount with 400', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-patch-2', 'Test', -10, 'm1', '2026-01-01', 'General')
    `).run()

    const res = await app.request('/api/transactions/tx-patch-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 'not-a-number' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects empty description with 400', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-patch-3', 'Test', -10, 'm1', '2026-01-01', 'General')
    `).run()

    const res = await app.request('/api/transactions/tx-patch-3', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects non-existent memberId with 400', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    db.prepare(`
      INSERT OR IGNORE INTO transactions (id, description, amount, member_id, date, category)
      VALUES ('tx-patch-4', 'Test', -10, 'm1', '2026-01-01', 'General')
    `).run()

    const res = await app.request('/api/transactions/tx-patch-4', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: 'ghost-member' }),
    })
    expect(res.status).toBe(400)
  })
})
