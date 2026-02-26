import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PollDetailSheet } from '../PollDetailSheet'
import { Poll } from '../../data/pollsData'
import { Member } from '../../data/mockData'

const members: Member[] = [
  { id: 'm1', name: 'Alice', initials: 'AL', color: '#E85D4A', phone: '', email: '', balance: 0 },
  { id: 'm2', name: 'Bob', initials: 'BO', color: '#4A90D9', phone: '', email: '', balance: 0 },
]

const basePoll: Poll = {
  id: 'p1',
  emoji: '🍕',
  title: 'Pizza or Sushi?',
  options: [
    { id: 'o1', text: 'Pizza', voterIds: ['m1', 'm2'] },
    { id: 'o2', text: 'Sushi', voterIds: ['m1'] },
  ],
  comments: [
    { id: 'c1', memberId: 'm1', text: 'I love pizza!', createdAt: '2025-01-01T00:00:00Z' },
  ],
  creatorId: 'm1',
  createdAt: '2025-01-01T00:00:00Z',
  isArchived: false,
  allowMembersToAddOptions: true,
  allowMultiSelect: false,
}

const closedPoll: Poll = {
  ...basePoll,
  expiresAt: '2020-01-01T00:00:00Z',
}

const archivedPoll: Poll = {
  ...basePoll,
  isArchived: true,
}

const defaultProps = {
  poll: basePoll,
  members,
  currentUserId: 'm1',
  isOpen: true,
  onClose: vi.fn(),
  onVote: vi.fn(),
  onAddOption: vi.fn(),
  onArchive: vi.fn(),
  onUnarchive: vi.fn(),
  onAddComment: vi.fn(),
  onEditComment: vi.fn(),
  onDeleteComment: vi.fn(),
}

describe('PollDetailSheet — design system unification', () => {
  it('sheet container uses left-0 right-0 mx-auto instead of left-1/2 with transform', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} />)
    // The main sheet div (fixed bottom-0)
    const sheet = container.querySelector('.fixed.bottom-0')
    expect(sheet).not.toBeNull()
    expect(sheet!.className).toContain('left-0')
    expect(sheet!.className).toContain('right-0')
    expect(sheet!.className).toContain('mx-auto')
    expect(sheet!.className).not.toContain('left-1/2')
    // Should not have style x: '-50%'
    expect(sheet!.getAttribute('style')).not.toContain('-50%')
  })

  it('sheet has z-[51] while backdrop has z-50', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} />)
    const backdrop = container.querySelector('.fixed.inset-0.bg-black')
    expect(backdrop).not.toBeNull()
    expect(backdrop!.className).toContain('z-50')
    const sheet = container.querySelector('.fixed.bottom-0')
    expect(sheet).not.toBeNull()
    expect(sheet!.className).toContain('z-[51]')
  })

  it('open badge uses text-xs instead of text-[11px]', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} />)
    const openBadge = screen.getByText('Open').closest('span')
    expect(openBadge).not.toBeNull()
    expect(openBadge!.className).toContain('text-xs')
    expect(openBadge!.className).not.toContain('text-[11px]')
  })

  it('closed badge uses text-xs instead of text-[11px]', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} poll={closedPoll} />)
    const closedBadge = screen.getByText('Closed').closest('span')
    expect(closedBadge).not.toBeNull()
    expect(closedBadge!.className).toContain('text-xs')
    expect(closedBadge!.className).not.toContain('text-[11px]')
  })

  it('archived badge uses text-xs instead of text-[11px]', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} poll={archivedPoll} />)
    const archivedBadge = screen.getByText('Archived').closest('span')
    expect(archivedBadge).not.toBeNull()
    expect(archivedBadge!.className).toContain('text-xs')
    expect(archivedBadge!.className).not.toContain('text-[11px]')
  })

  it('section headers have px-2 class', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} />)
    // "Choose one" or "Select all that apply" header
    const votingHeader = screen.getByText('Choose one')
    expect(votingHeader.className).toContain('px-2')
    // Comments header
    const commentsHeader = screen.getByText(/Comments/)
    expect(commentsHeader.className).toContain('px-2')
  })

  it('winner label uses font-medium and tracking-widest', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} poll={closedPoll} />)
    const winnerLabel = screen.getByText('Winner')
    expect(winnerLabel.className).toContain('font-medium')
    expect(winnerLabel.className).not.toContain('font-semibold')
    expect(winnerLabel.className).toContain('tracking-widest')
    expect(winnerLabel.className).not.toContain('tracking-wider')
  })

  it('winner option text uses font-semibold instead of font-bold', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} poll={closedPoll} />)
    // The winner banner contains the text in a <p> inside the winner banner <div>
    const winnerBanner = container.querySelector('.bg-black.dark\\:bg-white.rounded-2xl')
    expect(winnerBanner).not.toBeNull()
    const winnerPs = winnerBanner!.querySelectorAll('p')
    // Second <p> is the winner text
    const winnerP = winnerPs[1]
    expect(winnerP).not.toBeUndefined()
    expect(winnerP!.className).toContain('font-semibold')
    expect(winnerP!.className).not.toContain('font-bold')
  })

  it('comment body text uses text-gray-600 dark:text-gray-400', () => {
    const { container } = render(<PollDetailSheet {...defaultProps} />)
    const commentBody = screen.getByText('I love pizza!')
    expect(commentBody.className).toContain('text-gray-600')
    expect(commentBody.className).toContain('dark:text-gray-400')
    expect(commentBody.className).not.toContain('text-gray-700')
    expect(commentBody.className).not.toContain('dark:text-gray-300')
  })

  it('edit comment input uses rounded-xl instead of rounded-lg', async () => {
    const user = userEvent.setup()
    const { container } = render(<PollDetailSheet {...defaultProps} />)
    // Trigger edit mode by clicking the Edit button
    const editButton = screen.getByText('Edit')
    await user.click(editButton)
    // After clicking edit, the inline edit input appears (the one with bg-gray-50 and border)
    // There's also the comment input at the bottom (rounded-full), so look specifically
    // for the one with border-gray-200 (the edit input) vs the comment input
    const allInputs = container.querySelectorAll('input')
    const edInput = Array.from(allInputs).find(inp =>
      inp.className.includes('border-gray-200') && inp.className.includes('bg-gray-50')
    )
    expect(edInput).not.toBeUndefined()
    expect(edInput!.className).toContain('rounded-xl')
    expect(edInput!.className).not.toContain('rounded-lg')
  })
})
