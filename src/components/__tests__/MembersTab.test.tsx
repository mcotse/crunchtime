import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MembersTab } from '../MembersTab'
import { Member } from '../../data/mockData'

const members: Member[] = [
  { id: 'm1', name: 'Alice Rivera', initials: 'AR', color: '#E85D4A', phone: '', email: 'alice@example.com', balance: 1250.50 },
  { id: 'm2', name: 'Bob Chen', initials: 'BC', color: '#4A90D9', phone: '', email: 'bob@example.com', balance: -450.25 },
  { id: 'm3', name: 'Carol Smith', initials: 'CS', color: '#2ECC71', phone: '', email: 'carol@example.com', balance: 0 },
]

describe('MembersTab', () => {
  it('renders heading with member count', () => {
    render(<MembersTab members={members} />)
    expect(screen.getByText('Group Members (3)')).toBeInTheDocument()
  })

  it('renders all member names', () => {
    render(<MembersTab members={members} />)
    expect(screen.getByText('Alice Rivera')).toBeInTheDocument()
    expect(screen.getByText('Bob Chen')).toBeInTheDocument()
    expect(screen.getByText('Carol Smith')).toBeInTheDocument()
  })

  it('renders member initials', () => {
    render(<MembersTab members={members} />)
    expect(screen.getByText('AR')).toBeInTheDocument()
    expect(screen.getByText('BC')).toBeInTheDocument()
  })

  it('shows + prefix for positive balance', () => {
    render(<MembersTab members={members} />)
    expect(screen.getByText('+1250.50')).toBeInTheDocument()
  })

  it('shows negative balance without + prefix', () => {
    render(<MembersTab members={members} />)
    expect(screen.getByText('-450.25')).toBeInTheDocument()
  })

  it('displays actual email addresses, not placeholder text', () => {
    render(<MembersTab members={members} />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    expect(screen.getByText('carol@example.com')).toBeInTheDocument()
  })

  it('renders correctly with zero members', () => {
    render(<MembersTab members={[]} />)
    expect(screen.getByText('Group Members (0)')).toBeInTheDocument()
  })
})
