import db from './db.ts'
import { MEMBERS, TRANSACTIONS } from '../src/data/mockData.ts'
import { SEED_POLLS } from './seed-polls.ts'

// Clear existing data
db.exec('DELETE FROM poll_votes; DELETE FROM poll_options; DELETE FROM polls; DELETE FROM transactions; DELETE FROM members;')

// Seed members (without balance — computed from transactions)
const insertMember = db.prepare(`
  INSERT OR REPLACE INTO members (id, name, initials, phone, email, color)
  VALUES (@id, @name, @initials, @phone, @email, @color)
`)
for (const m of MEMBERS) {
  insertMember.run(m)
}

// Seed transactions
const insertTx = db.prepare(`
  INSERT OR REPLACE INTO transactions (id, description, amount, member_id, date, category)
  VALUES (@id, @description, @amount, @memberId, @date, @category)
`)
for (const tx of TRANSACTIONS) {
  insertTx.run(tx)
}

// Seed polls
const insertPoll = db.prepare(`
  INSERT OR REPLACE INTO polls (id, emoji, title, creator_id, created_at, expires_at, is_archived, archived_at, allow_members_to_add_options, allow_multi_select)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const insertOption = db.prepare('INSERT OR REPLACE INTO poll_options (id, poll_id, text) VALUES (?, ?, ?)')
const insertVote = db.prepare('INSERT OR IGNORE INTO poll_votes (option_id, member_id) VALUES (?, ?)')

for (const p of SEED_POLLS) {
  insertPoll.run(p.id, p.emoji, p.title, p.creatorId, p.createdAt, p.expiresAt ?? null, p.isArchived ? 1 : 0, p.archivedAt ?? null, p.allowMembersToAddOptions ? 1 : 0, p.allowMultiSelect ? 1 : 0)
  for (const o of p.options) {
    insertOption.run(o.id, p.id, o.text)
    for (const voterId of o.voterIds) {
      insertVote.run(o.id, voterId)
    }
  }
}

console.log(`Seeded ${MEMBERS.length} members, ${TRANSACTIONS.length} transactions, ${SEED_POLLS.length} polls.`)
