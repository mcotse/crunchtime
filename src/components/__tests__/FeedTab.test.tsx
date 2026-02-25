import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FeedTab } from '../FeedTab'
import { Member, Transaction } from '../../data/mockData'

const members: Member[] = [
  { id: 'm1', name: 'Alice Rivera', initials: 'AR', color: '#E85D4A', phone: '', email: '', balance: 0 },
  { id: 'm2', name: 'Bob Chen', initials: 'BC', color: '#4A90D9', phone: '', email: '', balance: 0 },
]

const transactions: Transaction[] = [
  {
    id: 't1',
    description: 'Grocery Run',
    amount: -156.42,
    memberId: 'm1',
    date: '2023-10-25T14:30:00Z',
    category: 'Food',
    editHistory: [],
  },
  {
    id: 't2',
    description: 'Freelance Income',
    amount: 500,
    memberId: 'm2',
    date: '2023-10-22T16:00:00Z',
    category: 'Income',
    editHistory: [
      { editedBy: 'Alice Rivera', editedAt: '2023-10-22T17:00:00Z', change: 'Updated amount from 450 to 500' },
    ],
  },
]

describe('FeedTab', () => {
  it('renders the Recent Activity heading', () => {
    render(<FeedTab transactions={transactions} members={members} onEdit={() => {}} />)
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })

  it('renders each transaction description', () => {
    render(<FeedTab transactions={transactions} members={members} onEdit={() => {}} />)
    expect(screen.getByText('Grocery Run')).toBeInTheDocument()
    expect(screen.getByText('Freelance Income')).toBeInTheDocument()
  })

  it('shows + prefix on income transactions', () => {
    render(<FeedTab transactions={transactions} members={members} onEdit={() => {}} />)
    // income row has + prefix
    expect(screen.getByText(/\+/)).toBeInTheDocument()
  })

  it('renders the member name for each transaction', () => {
    render(<FeedTab transactions={transactions} members={members} onEdit={() => {}} />)
    expect(screen.getByText('Alice Rivera')).toBeInTheDocument()
    expect(screen.getByText('Bob Chen')).toBeInTheDocument()
  })

  it('shows edit history badge when editHistory is non-empty', () => {
    render(<FeedTab transactions={transactions} members={members} onEdit={() => {}} />)
    expect(screen.getByText(/Edited by Alice Rivera/)).toBeInTheDocument()
  })

  it('does not show edit history badge when editHistory is empty', () => {
    const noHistoryTx: Transaction[] = [
      { ...transactions[0], editHistory: [] },
    ]
    render(<FeedTab transactions={noHistoryTx} members={members} onEdit={() => {}} />)
    expect(screen.queryByText(/Edited by/)).not.toBeInTheDocument()
  })

  it('calls onEdit with the correct transaction when edit button is clicked', async () => {
    const handler = vi.fn()
    render(<FeedTab transactions={transactions} members={members} onEdit={handler} />)
    const editButtons = screen.getAllByRole('button', { name: /edit transaction/i })
    await userEvent.click(editButtons[0])
    expect(handler).toHaveBeenCalledWith(transactions[0])
  })
})
