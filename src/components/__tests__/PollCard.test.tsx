import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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

const defaultProps = {
  poll: basePoll,
  members,
  currentUserId: 'u1',
  onTap: vi.fn(),
  onVote: vi.fn(),
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

describe('PollCard — design system unification', () => {
  it('header uses px-4 instead of px-5', () => {
    const { container } = render(<PollCard {...defaultProps} />)
    const header = container.querySelector('button.w-full.text-left')
    expect(header).not.toBeNull()
    expect(header!.className).toContain('px-4')
    expect(header!.className).not.toContain('px-5')
  })

  it('options section uses px-4 instead of px-5', () => {
    const { container } = render(<PollCard {...defaultProps} />)
    // The options container has pb-4 and space-y-2
    const optionsDiv = container.querySelector('.pb-4.space-y-2')
    expect(optionsDiv).not.toBeNull()
    expect(optionsDiv!.className).toContain('px-4')
    expect(optionsDiv!.className).not.toContain('px-5')
  })

  it('footer uses px-4 instead of px-5', () => {
    const { container } = render(<PollCard {...defaultProps} />)
    const footerBtn = container.querySelector('button.w-full.flex.items-center.justify-between')
    expect(footerBtn).not.toBeNull()
    expect(footerBtn!.className).toContain('px-4')
    expect(footerBtn!.className).not.toContain('px-5')
  })

  it('header button has hover and transition-colors', () => {
    const { container } = render(<PollCard {...defaultProps} />)
    const header = container.querySelector('button.w-full.text-left')
    expect(header).not.toBeNull()
    expect(header!.className).toContain('hover:bg-gray-50')
    expect(header!.className).toContain('transition-colors')
  })

  it('footer button has hover and transition-colors', () => {
    const { container } = render(<PollCard {...defaultProps} />)
    const footer = container.querySelector('button.w-full.flex.items-center.justify-between')
    expect(footer).not.toBeNull()
    expect(footer!.className).toContain('hover:bg-gray-50')
    expect(footer!.className).toContain('transition-colors')
  })

  it('poll title h3 has line-clamp-2', () => {
    const { container } = render(<PollCard {...defaultProps} />)
    const title = container.querySelector('h3')
    expect(title).not.toBeNull()
    expect(title!.className).toContain('line-clamp-2')
  })
})
