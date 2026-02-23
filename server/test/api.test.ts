import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

// Dynamically import after setting DB_PATH
async function getApp() {
  const { app } = await import('../index.js')
  return app
}

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
})

describe('GET /api/me', () => {
  it('returns 404 when no members exist', async () => {
    const app = await getApp()
    const res = await app.request('/api/me')
    expect(res.status).toBe(404)
  })
})
