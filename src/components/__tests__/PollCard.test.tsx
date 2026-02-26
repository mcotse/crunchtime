import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PollCard } from '../PollCard'
import { Poll } from '../../data/pollsData'
import { Member } from '../../data/mockData'

const members: Member[] = [
  { id: 'u1', name: 'Alice', initials: 'AL', color: '#e74c3c', phone: '', email: '', balance: 0 },
  { id: 'u2', name: 'Bob',   initials: 'BO', color: '#3498db', phone: '', email: '', balance: 0 },
]

const basePoll: Poll = {
  id: 'poll1',
  emoji: '🍕',
  title: 'Where should we eat?',
  creatorId: 'u1',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  isArchived: false,
  allowMembersToAddOptions: true,
  allowMultiSelect: false,
  options: [
    { id: 'o1', text: 'Italian', voterIds: ['u1'] },
    { id: 'o2', text: 'Japanese', voterIds: ['u2'] },
  ],
  comments: [],
}

describe('PollCard – own vote "You" pill', () => {
  it('shows "You" on the option the current user voted for', () => {
    render(
      <PollCard
        poll={basePoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('does not show "You" on options the current user did not vote for', () => {
    render(
      <PollCard
        poll={basePoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    // Only one "You" pill — on Italian, not Japanese
    expect(screen.getAllByText('You')).toHaveLength(1)
  })

  it('shows no "You" pill when the current user has not voted', () => {
    const unvotedPoll: Poll = {
      ...basePoll,
      options: [
        { id: 'o1', text: 'Italian', voterIds: [] },
        { id: 'o2', text: 'Japanese', voterIds: [] },
      ],
    }
    render(
      <PollCard
        poll={unvotedPoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })

  it('shows "You" on multiple options when multi-select is on and user voted for both', () => {
    const multiPoll: Poll = {
      ...basePoll,
      allowMultiSelect: true,
      options: [
        { id: 'o1', text: 'Italian',  voterIds: ['u1'] },
        { id: 'o2', text: 'Japanese', voterIds: ['u1'] },
      ],
    }
    render(
      <PollCard
        poll={multiPoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    expect(screen.getAllByText('You')).toHaveLength(2)
  })
})
