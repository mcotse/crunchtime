import db from './db.ts'
import { MEMBERS, TRANSACTIONS } from '../src/data/mockData.ts'
import { SEED_POLLS } from './seed-polls.ts'

// Clear existing data
db.exec('DELETE FROM calendar_availability; DELETE FROM poll_votes; DELETE FROM poll_options; DELETE FROM polls; DELETE FROM transactions; DELETE FROM members;')

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

// Seed calendar availability
const insertAvail = db.prepare(
  'INSERT OR IGNORE INTO calendar_availability (member_id, date, slot) VALUES (?, ?, ?)'
)

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const baseDate = new Date()
baseDate.setHours(0, 0, 0, 0)

const calendarScenarios: Array<{ offset: number; morning: string[]; evening: string[] }> = [
  { offset: 0, morning: ['m1', 'm2', 'm3'], evening: ['m1', 'm4', 'm5', 'm6'] },
  { offset: 1, morning: ['m2', 'm5', 'm7', 'm8'], evening: ['m2', 'm3'] },
  { offset: 2, morning: ['m1', 'm3', 'm9'], evening: ['m1', 'm2', 'm3', 'm9', 'm10'] },
  { offset: 3, morning: ['m4', 'm6', 'm11', 'm12'], evening: ['m4', 'm6'] },
  { offset: 5, morning: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'], evening: ['m1', 'm2', 'm3', 'm7'] },
  { offset: 6, morning: ['m7', 'm8', 'm9'], evening: ['m5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11'] },
  { offset: 8, morning: ['m1', 'm11'], evening: ['m1', 'm2', 'm11', 'm12'] },
  { offset: 9, morning: ['m3', 'm5', 'm6', 'm8'], evening: ['m3', 'm5'] },
  { offset: 10, morning: ['m2', 'm4', 'm9', 'm10'], evening: ['m2', 'm4', 'm9', 'm10', 'm11', 'm12'] },
  { offset: 12, morning: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'], evening: ['m1', 'm2', 'm3', 'm4'] },
  { offset: 15, morning: ['m1', 'm3', 'm5', 'm7', 'm9', 'm11'], evening: ['m2', 'm4', 'm6', 'm8', 'm10', 'm12'] },
  { offset: 20, morning: ['m1', 'm5', 'm6'], evening: ['m1', 'm2', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'] },
  { offset: 25, morning: ['m1', 'm2', 'm3', 'm4', 'm5'], evening: ['m6', 'm7', 'm8'] },
  { offset: 30, morning: ['m1', 'm2', 'm6', 'm7'], evening: ['m1', 'm2', 'm3', 'm6', 'm7', 'm8'] },
  { offset: 35, morning: ['m1', 'm3', 'm5', 'm7', 'm9', 'm11', 'm12'], evening: ['m2', 'm4', 'm6', 'm8', 'm10'] },
  { offset: 40, morning: ['m7', 'm8', 'm9', 'm10'], evening: ['m7', 'm8'] },
  { offset: 45, morning: ['m2', 'm3', 'm5', 'm6', 'm10', 'm11'], evening: ['m2', 'm3', 'm5', 'm6'] },
  { offset: 55, morning: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'], evening: ['m1', 'm2', 'm3'] },
]

let calendarCount = 0
for (const s of calendarScenarios) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + s.offset)
  const key = dateKey(d)
  for (const memberId of s.morning) {
    insertAvail.run(memberId, key, 'morning')
    calendarCount++
  }
  for (const memberId of s.evening) {
    insertAvail.run(memberId, key, 'evening')
    calendarCount++
  }
}

console.log(`Seeded ${MEMBERS.length} members, ${TRANSACTIONS.length} transactions, ${SEED_POLLS.length} polls, ${calendarCount} calendar entries.`)
