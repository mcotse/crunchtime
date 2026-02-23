import db from './db.ts'
import { MEMBERS, TRANSACTIONS } from '../data/mockData.ts'

// Clear existing data
db.exec('DELETE FROM transactions; DELETE FROM members;')

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

console.log(`Seeded ${MEMBERS.length} members, ${TRANSACTIONS.length} transactions.`)
