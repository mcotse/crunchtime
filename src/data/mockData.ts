export interface Member {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  color: string;
  balance: number; // positive = owed money, negative = owes money
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // positive = income, negative = expense
  memberId: string;
  date: string; // ISO string
  category: string;
  editHistory?: Array<{
    editedBy: string;
    editedAt: string;
    change: string;
  }>;
}

export const MEMBERS: Member[] = [
{
  id: 'm1',
  name: 'Alex Rivera',
  initials: 'AR',
  phone: '555-0101',
  email: 'alex@example.com',
  color: '#E85D4A',
  balance: 1250.5
},
{
  id: 'm2',
  name: 'Sarah Chen',
  initials: 'SC',
  phone: '555-0102',
  email: 'sarah@example.com',
  color: '#4A90D9',
  balance: -450.25
},
{
  id: 'm3',
  name: 'Mike Johnson',
  initials: 'MJ',
  phone: '555-0103',
  email: 'mike@example.com',
  color: '#2ECC71',
  balance: 320.0
},
{
  id: 'm4',
  name: 'Emily Davis',
  initials: 'ED',
  phone: '555-0104',
  email: 'emily@example.com',
  color: '#9B59B6',
  balance: -120.5
},
{
  id: 'm5',
  name: 'David Kim',
  initials: 'DK',
  phone: '555-0105',
  email: 'david@example.com',
  color: '#F39C12',
  balance: 85.75
},
{
  id: 'm6',
  name: 'Jessica Wu',
  initials: 'JW',
  phone: '555-0106',
  email: 'jessica@example.com',
  color: '#1ABC9C',
  balance: -890.0
},
{
  id: 'm7',
  name: 'Tom Wilson',
  initials: 'TW',
  phone: '555-0107',
  email: 'tom@example.com',
  color: '#E74C3C',
  balance: 45.0
},
{
  id: 'm8',
  name: 'Lisa Brown',
  initials: 'LB',
  phone: '555-0108',
  email: 'lisa@example.com',
  color: '#3498DB',
  balance: -230.0
},
{
  id: 'm9',
  name: 'Chris Lee',
  initials: 'CL',
  phone: '555-0109',
  email: 'chris@example.com',
  color: '#27AE60',
  balance: 1200.0
},
{
  id: 'm10',
  name: 'Anna White',
  initials: 'AW',
  phone: '555-0110',
  email: 'anna@example.com',
  color: '#8E44AD',
  balance: -50.0
},
{
  id: 'm11',
  name: 'James Green',
  initials: 'JG',
  phone: '555-0111',
  email: 'james@example.com',
  color: '#E67E22',
  balance: 675.5
},
{
  id: 'm12',
  name: 'Maria Garcia',
  initials: 'MG',
  phone: '555-0112',
  email: 'maria@example.com',
  color: '#16A085',
  balance: -150.0
}];


export const TRANSACTIONS: Transaction[] = [
{
  id: 't1',
  description: 'Grocery Run',
  amount: -156.42,
  memberId: 'm2',
  date: '2023-10-25T14:30:00Z',
  category: 'Food',
  editHistory: []
},
{
  id: 't2',
  description: 'Rent Payment',
  amount: -2400.0,
  memberId: 'm1',
  date: '2023-10-01T09:00:00Z',
  category: 'Housing',
  editHistory: [
  {
    editedBy: 'Alex Rivera',
    editedAt: '2023-10-01T10:00:00Z',
    change: 'Updated amount from 2300 to 2400'
  }]

},
{
  id: 't3',
  description: 'Utility Bill',
  amount: -145.2,
  memberId: 'm3',
  date: '2023-10-15T11:15:00Z',
  category: 'Utilities',
  editHistory: []
},
{
  id: 't4',
  description: 'Movie Night',
  amount: -85.5,
  memberId: 'm4',
  date: '2023-10-20T19:45:00Z',
  category: 'Entertainment',
  editHistory: []
},
{
  id: 't5',
  description: 'Freelance Project',
  amount: 1200.0,
  memberId: 'm1',
  date: '2023-10-22T16:00:00Z',
  category: 'Income',
  editHistory: []
},
{
  id: 't6',
  description: "Dinner at Mario's",
  amount: -210.0,
  memberId: 'm6',
  date: '2023-10-24T20:00:00Z',
  category: 'Food',
  editHistory: []
},
{
  id: 't7',
  description: 'Internet Bill',
  amount: -89.99,
  memberId: 'm5',
  date: '2023-10-18T10:00:00Z',
  category: 'Utilities',
  editHistory: []
},
{
  id: 't8',
  description: 'Gas Station',
  amount: -45.0,
  memberId: 'm2',
  date: '2023-10-26T08:30:00Z',
  category: 'Transport',
  editHistory: []
},
{
  id: 't9',
  description: 'Consulting Fee',
  amount: 500.0,
  memberId: 'm9',
  date: '2023-10-21T14:00:00Z',
  category: 'Income',
  editHistory: []
},
{
  id: 't10',
  description: 'Coffee Run',
  amount: -24.5,
  memberId: 'm10',
  date: '2023-10-27T09:15:00Z',
  category: 'Food',
  editHistory: []
},
{
  id: 't11',
  description: 'Gym Membership',
  amount: -60.0,
  memberId: 'm11',
  date: '2023-10-05T07:00:00Z',
  category: 'Health',
  editHistory: []
},
{
  id: 't12',
  description: 'Uber Ride',
  amount: -32.4,
  memberId: 'm12',
  date: '2023-10-23T23:00:00Z',
  category: 'Transport',
  editHistory: []
}];