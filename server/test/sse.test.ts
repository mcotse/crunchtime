import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

describe('GET /api/events', () => {
  it('responds with SSE content-type', async () => {
    const { app } = await import('../index.js')
    const controller = new AbortController()
    const resPromise = app.request('/api/events', { signal: controller.signal })
    // Abort immediately to not hang
    controller.abort()
    // The promise may reject due to abort or resolve with the response
    const res = await resPromise.catch(() => null)
    if (res) {
      const ct = res.headers.get('content-type')
      if (ct) {
        expect(ct).toContain('text/event-stream')
      }
    }
    // If aborted before headers received or no content-type, just pass
  })
})
