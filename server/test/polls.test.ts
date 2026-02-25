import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

async function getApp() {
  const { app } = await import('../index.js')
  return app
}

async function seedMembers() {
  const { default: db } = await import('../db.js')
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
    VALUES ('m1', 'Alice', 'AL', '+1-555-0101', 'alice@example.com', '#6366f1')
  `).run()
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
    VALUES ('m2', 'Bob', 'BO', '+1-555-0202', 'bob@example.com', '#ec4899')
  `).run()
}

async function seedPoll({
  id,
  creatorId,
  allowMembersToAddOptions = 1,
}: {
  id: string
  creatorId: string
  allowMembersToAddOptions?: number
}) {
  const { default: db } = await import('../db.js')
  db.prepare(`
    INSERT OR IGNORE INTO polls (id, emoji, title, creator_id, created_at, allow_members_to_add_options, allow_multi_select)
    VALUES (?, '📊', 'Test Poll', ?, ?, ?, 0)
  `).run(id, creatorId, new Date().toISOString(), allowMembersToAddOptions)

  const opt1Id = `${id}-opt1`
  const opt2Id = `${id}-opt2`
  db.prepare(`INSERT OR IGNORE INTO poll_options (id, poll_id, text) VALUES (?, ?, 'Option 1')`).run(opt1Id, id)
  db.prepare(`INSERT OR IGNORE INTO poll_options (id, poll_id, text) VALUES (?, ?, 'Option 2')`).run(opt2Id, id)

  return { optionIds: [opt1Id, opt2Id] }
}

// In dev mode (no CF_TEAM_DOMAIN), auth middleware uses the first member in the DB.
// m1 is inserted first, so all requests are authenticated as m1.

describe('POST /api/polls/:id/vote', () => {
  beforeEach(() => seedMembers())

  it('allows the poll creator to vote on their own poll', async () => {
    const app = await getApp()
    const { optionIds } = await seedPoll({ id: 'poll-vote-own', creatorId: 'm1' })

    const res = await app.request('/api/polls/poll-vote-own/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds: [optionIds[0]] }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.options[0].voterIds).toContain('m1')
  })

  it('allows a member to vote on a poll created by another member', async () => {
    const app = await getApp()
    const { optionIds } = await seedPoll({ id: 'poll-vote-other', creatorId: 'm2' })

    const res = await app.request('/api/polls/poll-vote-other/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds: [optionIds[0]] }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.options[0].voterIds).toContain('m1')
  })
})

describe('POST /api/polls/:id/options', () => {
  beforeEach(() => seedMembers())

  it('allows a member to add an option to a poll they did not create', async () => {
    const app = await getApp()
    await seedPoll({ id: 'poll-addopt-other', creatorId: 'm2', allowMembersToAddOptions: 1 })

    const res = await app.request('/api/polls/poll-addopt-other/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'My New Option' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.options.some((o: any) => o.text === 'My New Option')).toBe(true)
  })

  it('rejects adding an option when allowMembersToAddOptions is false', async () => {
    const app = await getApp()
    await seedPoll({ id: 'poll-addopt-locked', creatorId: 'm2', allowMembersToAddOptions: 0 })

    const res = await app.request('/api/polls/poll-addopt-locked/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Blocked Option' }),
    })

    expect(res.status).toBe(403)
  })
})

describe('POST /api/polls — create', () => {
  beforeEach(() => seedMembers())

  it('creates a poll and returns 201', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Dinner spot?', options: ['Tacos', 'Pizza'] }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.title).toBe('Dinner spot?')
    expect(body.options).toHaveLength(2)
    expect(body.creatorId).toBe('m1')
  })

  it('rejects missing title with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: ['A', 'B'] }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects fewer than 2 options with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Solo', options: ['Only one'] }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects empty option text with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Empty opts', options: ['Valid', ''] }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/polls', () => {
  beforeEach(() => seedMembers())

  it('returns an array of polls', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls')
    expect(res.status).toBe(200)
    const body = (await res.json()) as any[]
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('GET /api/polls/:id', () => {
  beforeEach(() => seedMembers())

  it('returns a single poll with options and voterIds', async () => {
    const app = await getApp()
    await seedPoll({ id: 'poll-get-single', creatorId: 'm1' })
    const res = await app.request('/api/polls/poll-get-single')
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.id).toBe('poll-get-single')
    expect(body.options).toHaveLength(2)
    expect(body.options[0]).toHaveProperty('voterIds')
  })

  it('returns 404 for unknown poll id', async () => {
    const app = await getApp()
    const res = await app.request('/api/polls/no-such-poll')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/polls/:id/archive and /unarchive', () => {
  beforeEach(() => seedMembers())

  it('allows creator to archive their poll', async () => {
    const app = await getApp()
    await seedPoll({ id: 'poll-archive', creatorId: 'm1' })
    const res = await app.request('/api/polls/poll-archive/archive', { method: 'PATCH' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.isArchived).toBe(true)
  })

  it('rejects archive by non-creator with 403', async () => {
    const app = await getApp()
    await seedPoll({ id: 'poll-archive-reject', creatorId: 'm2' })
    const res = await app.request('/api/polls/poll-archive-reject/archive', { method: 'PATCH' })
    expect(res.status).toBe(403)
  })

  it('allows creator to unarchive their poll', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    await seedPoll({ id: 'poll-unarchive', creatorId: 'm1' })
    db.prepare('UPDATE polls SET is_archived = 1 WHERE id = ?').run('poll-unarchive')

    const res = await app.request('/api/polls/poll-unarchive/unarchive', { method: 'PATCH' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.isArchived).toBe(false)
  })
})

describe('POST /api/polls/:id/vote — validation', () => {
  beforeEach(() => seedMembers())

  it('rejects voting on expired poll with 400', async () => {
    const app = await getApp()
    const { default: db } = await import('../db.js')
    await seedPoll({ id: 'poll-expired', creatorId: 'm1' })
    db.prepare('UPDATE polls SET expires_at = ? WHERE id = ?')
      .run('2020-01-01T00:00:00.000Z', 'poll-expired')

    const opts = db.prepare('SELECT id FROM poll_options WHERE poll_id = ?').all('poll-expired') as { id: string }[]
    const res = await app.request('/api/polls/poll-expired/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds: [opts[0].id] }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as any
    expect(body.error).toMatch(/closed/i)
  })

  it('rejects multi-select vote when not allowed with 400', async () => {
    const app = await getApp()
    const { optionIds } = await seedPoll({ id: 'poll-no-multi', creatorId: 'm1' })
    // allow_multi_select defaults to 0 in seedPoll
    const res = await app.request('/api/polls/poll-no-multi/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as any
    expect(body.error).toMatch(/multiple/i)
  })

  it('rejects vote with invalid option id with 400', async () => {
    const app = await getApp()
    await seedPoll({ id: 'poll-bad-opt', creatorId: 'm1' })
    const res = await app.request('/api/polls/poll-bad-opt/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds: ['not-a-real-option'] }),
    })
    expect(res.status).toBe(400)
  })
})
