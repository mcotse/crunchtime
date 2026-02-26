import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PollsTab } from '../PollsTab'
import { Poll } from '../../data/pollsData'
import { Member } from '../../data/mockData'

const members: Member[] = [
  { id: 'u1', name: 'Alice', initials: 'AL', color: '#e74c3c', phone: '', email: '', balance: 0 },
]

const futureDateStr = new Date(Date.now() + 86400000 * 7).toISOString()
const pastDateStr   = new Date(Date.now() - 86400000).toISOString()

const activePoll: Poll = {
  id: 'p1',
  emoji: '🍕',
  title: 'Active Poll',
  creatorId: 'u1',
  createdAt: new Date().toISOString(),
  expiresAt: futureDateStr,
  isArchived: false,
  allowMembersToAddOptions: true,
  allowMultiSelect: false,
  options: [
    { id: 'o1', text: 'Option A', voterIds: ['u1'] },
    { id: 'o2', text: 'Option B', voterIds: [] },
  ],
  comments: [],
}

const archivedPoll: Poll = {
  id: 'p2',
  emoji: '🎲',
  title: 'Archived Poll',
  creatorId: 'u1',
  createdAt: pastDateStr,
  isArchived: true,
  allowMembersToAddOptions: false,
  allowMultiSelect: false,
  options: [
    { id: 'o3', text: 'Option X', voterIds: ['u1'] },
  ],
  comments: [],
}

const expiredPoll: Poll = {
  id: 'p3',
  emoji: '⏰',
  title: 'Expired Poll',
  creatorId: 'u1',
  createdAt: pastDateStr,
  expiresAt: pastDateStr,
  isArchived: false,
  allowMembersToAddOptions: false,
  allowMultiSelect: false,
  options: [
    { id: 'o4', text: 'Option Y', voterIds: [] },
  ],
  comments: [],
}

const noop = () => {}

describe('PollsTab', () => {
  it('renders the Create Poll button', () => {
    render(
      <PollsTab polls={[]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    expect(screen.getByRole('button', { name: /create poll/i })).toBeInTheDocument()
  })

  it('calls onCreatePoll when Create Poll is clicked', async () => {
    const handler = vi.fn()
    render(
      <PollsTab polls={[]} members={members} currentUserId="u1"
        onCreatePoll={handler} onOpenPoll={noop} onVote={noop} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /create poll/i }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when there are no active polls', () => {
    render(
      <PollsTab polls={[]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    expect(screen.getByText(/no active polls/i)).toBeInTheDocument()
  })

  it('renders active poll title', () => {
    render(
      <PollsTab polls={[activePoll]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    expect(screen.getByText('Active Poll')).toBeInTheDocument()
  })

  it('does not render active poll in archived section', () => {
    render(
      <PollsTab polls={[activePoll]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    // No archived section when no archived polls
    expect(screen.queryByText(/archived/i)).not.toBeInTheDocument()
  })

  it('shows Archived toggle button when archived polls exist', () => {
    render(
      <PollsTab polls={[archivedPoll]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    expect(screen.getByText(/archived \(1\)/i)).toBeInTheDocument()
  })

  it('archived section is collapsed by default', () => {
    render(
      <PollsTab polls={[archivedPoll]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    expect(screen.queryByText('Archived Poll')).not.toBeInTheDocument()
  })

  it('expands archived section when toggle is clicked', async () => {
    render(
      <PollsTab polls={[archivedPoll]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    await userEvent.click(screen.getByText(/archived \(1\)/i))
    expect(await screen.findByText('Archived Poll')).toBeInTheDocument()
  })

  it('treats an expired poll (expiresAt in past) as archived', () => {
    render(
      <PollsTab polls={[expiredPoll]} members={members} currentUserId="u1"
        onCreatePoll={noop} onOpenPoll={noop} onVote={noop} />,
    )
    // Expired poll should not appear in active section
    expect(screen.getByText(/no active polls/i)).toBeInTheDocument()
    // Should show in archived count
    expect(screen.getByText(/archived \(1\)/i)).toBeInTheDocument()
  })
})
