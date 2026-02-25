import { Hono } from 'hono'
import { stream } from 'hono/streaming'

export const sseRouter = new Hono()

// Store active streams
const activeStreams = new Set<{ write: (s: string) => Promise<unknown>; close: () => unknown }>()

export function broadcastSSE(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const s of activeStreams) {
    s.write(payload).catch(() => {
      activeStreams.delete(s)
    })
  }
}

sseRouter.get('/', (c) => {
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')
  return stream(c, async (s) => {
    const client = {
      write: (payload: string) => s.write(payload),
      close: () => s.close(),
    }
    activeStreams.add(client)
    s.onAbort(() => { activeStreams.delete(client) })

    // Keep alive
    await s.write(': connected\n\n')
    // Hold the stream open indefinitely
    await new Promise<void>((resolve) => {
      s.onAbort(resolve)
    })
  })
})
