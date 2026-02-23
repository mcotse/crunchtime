import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
  // No CF_TEAM_DOMAIN set → dev mode (no auth)
  delete process.env.CF_TEAM_DOMAIN
})

describe('authMiddleware (dev mode)', () => {
  it('passes through when CF_TEAM_DOMAIN is not set', async () => {
    const { app } = await import('../index.js')
    const res = await app.request('/api/me')
    // In-memory DB has no members → 404
    expect(res.status).toBe(404)
  })
})
