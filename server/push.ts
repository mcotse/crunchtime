import webpush from 'web-push'
import db from './db.js'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? 'BGk1uJwKwkskIw3RQZ3_GabRcomIHM71I4AQSNCA28bO7ylHpyPnIqCP5Up2nsSCZJ_BTcmhY_OSPyZ03M-hKxI'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:crunchtime@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

interface PushSubscriptionRow {
  id: number
  member_id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY
}

export async function sendPushToAll(
  title: string,
  body: string,
  data?: { tag?: string; url?: string }
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

  const subs = db.prepare('SELECT * FROM push_subscriptions').all() as PushSubscriptionRow[]

  const payload = JSON.stringify({
    title,
    body,
    tag: data?.tag,
    data: { url: data?.url || '/' },
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        payload
      )
    )
  )

  // Clean up expired subscriptions (410 Gone)
  const deleteStmt = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err.statusCode === 410 || err.statusCode === 404) {
        deleteStmt.run(subs[i].endpoint)
      }
    }
  })
}
