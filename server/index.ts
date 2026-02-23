import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { membersRouter } from './routes/members.js'
import { transactionsRouter } from './routes/transactions.js'
import { meRouter } from './routes/me.js'
import { authMiddleware } from './middleware/auth.js'

const app = new Hono()

app.use('/api/*', authMiddleware)

app.route('/api/members', membersRouter)
app.route('/api/transactions', transactionsRouter)
app.route('/api/me', meRouter)

// Serve React build in production
app.use('/*', serveStatic({ root: './dist/client' }))

const PORT = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Crunchtime server running on http://localhost:${PORT}`)
})

export { app }
