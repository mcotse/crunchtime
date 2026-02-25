import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

describe('GET /api/sse', () => {
  it('responds with SSE content-type and 200', async () => {
    const { app } = await import('../index.js')
    const res = await app.request('/api/sse')
    // Cancel body immediately so the stream doesn't hold the test open
    await res.body?.cancel()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
  })
})
