export const MEMBERS = [
    { id: 'm1', name: 'Alice Osei', initials: 'AO', phone: '+1-555-0101', email: 'alice@example.com', color: '#6366f1', balance: 120 },
    { id: 'm2', name: 'Ben Kwame', initials: 'BK', phone: '+1-555-0102', email: 'ben@example.com', color: '#f59e0b', balance: -45 },
    { id: 'm3', name: 'Clara Mensah', initials: 'CM', phone: '+1-555-0103', email: 'clara@example.com', color: '#10b981', balance: 80 },
    { id: 'm4', name: 'David Asante', initials: 'DA', phone: '+1-555-0104', email: 'david@example.com', color: '#ef4444', balance: -30 },
];
export const TRANSACTIONS = [
    { id: 't1', description: 'Groceries', amount: -60, memberId: 'm1', date: '2025-01-15T10:00:00Z', category: 'Food' },
    { id: 't2', description: 'Monthly contribution', amount: 200, memberId: 'm2', date: '2025-01-14T09:00:00Z', category: 'Income' },
    { id: 't3', description: 'Utilities', amount: -45, memberId: 'm3', date: '2025-01-13T14:00:00Z', category: 'Bills' },
    { id: 't4', description: 'Transport', amount: -30, memberId: 'm4', date: '2025-01-12T08:00:00Z', category: 'Transport' },
];
