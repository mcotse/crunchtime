import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Member } from '../../data/mockData.js'
import db from '../db.js'

const TEAM_DOMAIN = process.env.CF_TEAM_DOMAIN ?? ''

// Lazily instantiate the JWKS fetcher
let getJWKS: ReturnType<typeof createRemoteJWKSet> | null = null
function jwks() {
  if (!getJWKS) {
    getJWKS = createRemoteJWKSet(
      new URL(`https://${TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`),
    )
  }
  return getJWKS
}

export type Variables = { member: Member & { balance: number } }

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const token = c.req.header('CF-Access-Jwt-Assertion')

  // In development (no CF_TEAM_DOMAIN set), skip auth and use first member
  if (!TEAM_DOMAIN) {
    const member = db.prepare(`
      SELECT m.id, m.name, m.initials, m.phone, m.email, m.color,
             COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
      FROM members m LIMIT 1
    `).get() as (Member & { balance: number }) | undefined
    if (member) c.set('member', member)
    return next()
  }

  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  let email: string
  try {
    const { payload } = await jwtVerify(token, jwks())
    email = payload.email as string
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const member = db.prepare(`
    SELECT m.id, m.name, m.initials, m.phone, m.email, m.color,
           COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
    FROM members m WHERE m.email = ?
  `).get(email) as (Member & { balance: number }) | undefined

  if (!member) return c.json({ error: 'Forbidden' }, 403)

  c.set('member', member)
  return next()
})
