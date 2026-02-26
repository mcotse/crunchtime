import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { sendPushToAll } from '../push.js'

export const sseRouter = new Hono()

// Store active streams
const activeStreams = new Set<{ write: (s: string) => Promise<unknown>; close: () => unknown }>()

function sendPushForEvent(event: string, data: unknown): void {
  const d = data as Record<string, unknown>

  if (event === 'transaction_added' && d.description && d.amount != null) {
    const amt = typeof d.amount === 'number' ? `$${Math.abs(d.amount).toFixed(2)}` : ''
    sendPushToAll('New Expense', `${amt} - ${d.description}`, {
      tag: `transaction-${d.id}`,
    })
  } else if (event === 'poll_updated' && d.title) {
    sendPushToAll('Poll Update', String(d.title), {
      tag: `poll-${d.id}`,
    })
  } else if (event === 'event_updated' && d.title) {
    sendPushToAll('Event Update', String(d.title), {
      tag: `event-${d.id}`,
    })
  }
}

export function broadcastSSE(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const s of activeStreams) {
    s.write(payload).catch(() => {
      activeStreams.delete(s)
    })
  }

  sendPushForEvent(event, data)
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
