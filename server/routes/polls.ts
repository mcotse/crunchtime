import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import type { Variables } from '../middleware/auth.js'
import { broadcastSSE } from './events.js'

export const pollsRouter = new Hono<{ Variables: Variables }>()

type PollRow = {
  id: string
  emoji: string
  title: string
  creator_id: string
  created_at: string
  expires_at: string | null
  is_archived: number
  archived_at: string | null
  allow_members_to_add_options: number
  allow_multi_select: number
}

type OptionRow = {
  id: string
  poll_id: string
  text: string
}

type VoteRow = {
  option_id: string
  member_id: string
}

function serializePoll(row: PollRow) {
  const options = db.prepare('SELECT id, text FROM poll_options WHERE poll_id = ?').all(row.id) as OptionRow[]
  const votes = db.prepare(
    'SELECT option_id, member_id FROM poll_votes WHERE option_id IN (SELECT id FROM poll_options WHERE poll_id = ?)'
  ).all(row.id) as VoteRow[]

  const votesByOption = new Map<string, string[]>()
  for (const v of votes) {
    const arr = votesByOption.get(v.option_id) ?? []
    arr.push(v.member_id)
    votesByOption.set(v.option_id, arr)
  }

  return {
    id: row.id,
    emoji: row.emoji,
    title: row.title,
    creatorId: row.creator_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? undefined,
    isArchived: !!row.is_archived,
    archivedAt: row.archived_at ?? undefined,
    allowMembersToAddOptions: !!row.allow_members_to_add_options,
    allowMultiSelect: !!row.allow_multi_select,
    options: options.map((o) => ({
      id: o.id,
      text: o.text,
      voterIds: votesByOption.get(o.id) ?? [],
    })),
  }
}

// GET /api/polls — list all polls
pollsRouter.get('/', (c) => {
  const rows = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all() as PollRow[]
  return c.json(rows.map(serializePoll))
})

// GET /api/polls/:id — single poll
pollsRouter.get('/:id', (c) => {
  const row = db.prepare('SELECT * FROM polls WHERE id = ?').get(c.req.param('id')) as PollRow | undefined
  if (!row) return c.json({ error: 'poll not found' }, 404)
  return c.json(serializePoll(row))
})

// POST /api/polls — create a poll
pollsRouter.post('/', async (c) => {
  const body = await c.req.json<{
    title?: string
    emoji?: string
    options?: string[]
    expiresAt?: string
    allowMembersToAddOptions?: boolean
    allowMultiSelect?: boolean
  }>()

  if (!body.title?.trim()) return c.json({ error: 'title is required' }, 400)
  if (!body.options || body.options.length < 2) return c.json({ error: 'at least 2 options required' }, 400)
  if (body.options.some((o) => !o.trim())) return c.json({ error: 'options cannot be empty' }, 400)

  const member = c.get('member')
  const pollId = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO polls (id, emoji, title, creator_id, created_at, expires_at, allow_members_to_add_options, allow_multi_select)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pollId,
    body.emoji || '📊',
    body.title.trim(),
    member.id,
    now,
    body.expiresAt ?? null,
    body.allowMembersToAddOptions !== false ? 1 : 0,
    body.allowMultiSelect ? 1 : 0,
  )

  const insertOption = db.prepare('INSERT INTO poll_options (id, poll_id, text) VALUES (?, ?, ?)')
  for (const text of body.options) {
    insertOption.run(randomUUID(), pollId, text.trim())
  }

  const poll = serializePoll(db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow)
  broadcastSSE('poll_updated', poll)
  return c.json(poll, 201)
})

// POST /api/polls/:id/vote — set current user's votes (replaces previous votes)
pollsRouter.post('/:id/vote', async (c) => {
  const pollId = c.req.param('id')
  const row = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow | undefined
  if (!row) return c.json({ error: 'poll not found' }, 404)

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return c.json({ error: 'poll is closed' }, 400)
  }

  const body = await c.req.json<{ optionIds: string[] }>()
  if (!Array.isArray(body.optionIds)) return c.json({ error: 'optionIds must be an array' }, 400)

  const member = c.get('member')
  const pollOptionIds = (db.prepare('SELECT id FROM poll_options WHERE poll_id = ?').all(pollId) as { id: string }[]).map((o) => o.id)

  for (const oid of body.optionIds) {
    if (!pollOptionIds.includes(oid)) return c.json({ error: `option ${oid} not in this poll` }, 400)
  }

  if (!row.allow_multi_select && body.optionIds.length > 1) {
    return c.json({ error: 'poll does not allow multiple selections' }, 400)
  }

  // Remove existing votes for this user on this poll, then insert new ones
  const deleteStmt = db.prepare('DELETE FROM poll_votes WHERE option_id IN (SELECT id FROM poll_options WHERE poll_id = ?) AND member_id = ?')
  const insertStmt = db.prepare('INSERT INTO poll_votes (option_id, member_id) VALUES (?, ?)')

  db.transaction(() => {
    deleteStmt.run(pollId, member.id)
    for (const oid of body.optionIds) {
      insertStmt.run(oid, member.id)
    }
  })()

  const poll = serializePoll(db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow)
  broadcastSSE('poll_updated', poll)
  return c.json(poll)
})

// POST /api/polls/:id/options — add an option
pollsRouter.post('/:id/options', async (c) => {
  const pollId = c.req.param('id')
  const row = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow | undefined
  if (!row) return c.json({ error: 'poll not found' }, 404)
  if (!row.allow_members_to_add_options) return c.json({ error: 'adding options not allowed' }, 403)

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return c.json({ error: 'poll is closed' }, 400)
  }

  const body = await c.req.json<{ text?: string }>()
  if (!body.text?.trim()) return c.json({ error: 'text is required' }, 400)

  const optionId = randomUUID()
  db.prepare('INSERT INTO poll_options (id, poll_id, text) VALUES (?, ?, ?)').run(optionId, pollId, body.text.trim())

  const poll = serializePoll(db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow)
  broadcastSSE('poll_updated', poll)
  return c.json(poll)
})

// PATCH /api/polls/:id/archive — archive a poll
pollsRouter.patch('/:id/archive', (c) => {
  const pollId = c.req.param('id')
  const row = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow | undefined
  if (!row) return c.json({ error: 'poll not found' }, 404)

  const member = c.get('member')
  if (row.creator_id !== member.id) return c.json({ error: 'only the creator can archive' }, 403)

  db.prepare('UPDATE polls SET is_archived = 1, archived_at = ? WHERE id = ?').run(new Date().toISOString(), pollId)

  const poll = serializePoll(db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow)
  broadcastSSE('poll_updated', poll)
  return c.json(poll)
})

// PATCH /api/polls/:id/unarchive — unarchive a poll
pollsRouter.patch('/:id/unarchive', (c) => {
  const pollId = c.req.param('id')
  const row = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow | undefined
  if (!row) return c.json({ error: 'poll not found' }, 404)

  const member = c.get('member')
  if (row.creator_id !== member.id) return c.json({ error: 'only the creator can unarchive' }, 403)

  db.prepare('UPDATE polls SET is_archived = 0, archived_at = NULL WHERE id = ?').run(pollId)

  const poll = serializePoll(db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as PollRow)
  broadcastSSE('poll_updated', poll)
  return c.json(poll)
})
