import { Hono } from 'hono'

const TEAM_DOMAIN = process.env.CF_TEAM_DOMAIN ?? ''
const LOGOUT_URL = TEAM_DOMAIN 
  ? `https://${TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/logout`
  : null

export const logoutRouter = new Hono()

logoutRouter.get('/', (c) => {
  return c.json({ url: LOGOUT_URL })
})
