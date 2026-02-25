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
