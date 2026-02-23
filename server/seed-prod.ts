import db from './db'

// Clear existing data
db.exec('DELETE FROM transactions; DELETE FROM members;')

const insertMember = db.prepare(`
  INSERT OR REPLACE INTO members (id, name, initials, phone, email, color)
  VALUES (@id, @name, @initials, @phone, @email, @color)
`)

const insertTx = db.prepare(`
  INSERT OR REPLACE INTO transactions (id, description, amount, member_id, date, category)
  VALUES (@id, @description, @amount, @memberId, @date, @category)
`)

const members = [
  { id: 'm1',  name: 'Angel Jiao',       initials: 'AJ', phone: '', email: 'angelxjiao@gmail.com',      color: '#E85D4A' },
  { id: 'm2',  name: 'Bingjie Jiang',    initials: 'BJ', phone: '', email: 'bingjie@crunchtime.app',    color: '#9B59B6' },
  { id: 'm3',  name: 'Huang Xue',        initials: 'HX', phone: '', email: 'huangxue@meta.com',         color: '#F39C12' },
  { id: 'm4',  name: 'Jeffrey Chen',     initials: 'JC', phone: '', email: 'ultimatedbz@gmail.com',     color: '#2ECC71' },
  { id: 'm5',  name: 'Jon Tan',          initials: 'JT', phone: '', email: 'jonathan.tan.13@gmail.com', color: '#1ABC9C' },
  { id: 'm6',  name: 'Matthew Tse',      initials: 'MT', phone: '', email: 'mtse9779@gmail.com',        color: '#3498DB' },
  { id: 'm7',  name: 'Michelle Song Vo', initials: 'MS', phone: '', email: 'msongvo@gmail.com',         color: '#E74C3C' },
  { id: 'm8',  name: 'Mike Luo',         initials: 'ML', phone: '', email: 'mike.luo1122@gmail.com',    color: '#27AE60' },
  { id: 'm9',  name: 'Sandy Feng',       initials: 'SF', phone: '', email: 'sandyfeng32@gmail.com',     color: '#E67E22' },
  { id: 'm10', name: 'Simon Fan',        initials: 'SF', phone: '', email: 'simon.xmfan@gmail.com',     color: '#8E44AD' },
  { id: 'm11', name: 'Yana Liu',         initials: 'YL', phone: '', email: 'lyna1223liu@gmail.com',     color: '#16A085' },
]

// Fund contributions (positive = paid into fund, negative = withdrew from fund)
// Sandy: 500 - 85 = 415, Simon: 500, Yana: 500, Bingjie/Jenny: 250, Huang: 250 - 50 = 200
const transactions = [
  { id: 't1', description: 'Fund Contribution', amount:  500, memberId: 'm9',  date: '2025-01-01T00:00:00Z', category: 'Contribution' },
  { id: 't2', description: 'Withdrawal',         amount:  -85, memberId: 'm9',  date: '2025-01-15T00:00:00Z', category: 'Withdrawal'   },
  { id: 't3', description: 'Fund Contribution', amount:  500, memberId: 'm10', date: '2025-01-01T00:00:00Z', category: 'Contribution' },
  { id: 't4', description: 'Fund Contribution', amount:  500, memberId: 'm11', date: '2025-01-01T00:00:00Z', category: 'Contribution' },
  { id: 't5', description: 'Fund Contribution', amount:  250, memberId: 'm2',  date: '2025-01-01T00:00:00Z', category: 'Contribution' },
  { id: 't6', description: 'Fund Contribution', amount:  250, memberId: 'm3',  date: '2025-01-01T00:00:00Z', category: 'Contribution' },
  { id: 't7', description: 'Withdrawal',         amount:  -50, memberId: 'm3',  date: '2025-01-15T00:00:00Z', category: 'Withdrawal'   },
]

for (const m of members) insertMember.run(m)
for (const tx of transactions) insertTx.run(tx)

console.log(`Seeded ${members.length} members, ${transactions.length} transactions.`)
