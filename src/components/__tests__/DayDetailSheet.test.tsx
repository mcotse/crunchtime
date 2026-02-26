import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DayDetailSheet } from '../DayDetailSheet'
import { Member } from '../../data/mockData'

// Mock isPast to return false for our test date
vi.mock('../../data/calendarData', async () => {
  const actual = await vi.importActual('../../data/calendarData')
  return {
    ...actual,
    isPast: (dateStr: string) => dateStr === '2020-01-01',
  }
})

const members: Member[] = [
  { id: 'm1', name: 'Alice', initials: 'AL', color: '#E85D4A', phone: '', email: '', balance: 0 },
  { id: 'm2', name: 'Bob', initials: 'BO', color: '#4A90D9', phone: '', email: '', balance: 0 },
]

const defaultProps = {
  dateStr: '2025-06-15',
  isOpen: true,
  onClose: vi.fn(),
  availability: {
    '2025-06-15': { morning: ['m1'], evening: ['m1', 'm2'] },
  },
  members,
  currentUserId: 'm1',
  onToggle: vi.fn(),
  onCreateEvent: vi.fn(),
}

describe('DayDetailSheet — design system unification', () => {
  it('sheet has z-[51] while backdrop has z-50', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const backdrop = container.querySelector('.fixed.inset-0.bg-black')
    expect(backdrop).not.toBeNull()
    expect(backdrop!.className).toContain('z-50')
    const sheet = container.querySelector('.fixed.bottom-0')
    expect(sheet).not.toBeNull()
    expect(sheet!.className).toContain('z-[51]')
  })

  it('header uses px-6 instead of px-5', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const header = container.querySelector('.flex.items-center.justify-between')
    expect(header).not.toBeNull()
    expect(header!.className).toContain('px-6')
    expect(header!.className).not.toContain('px-5')
  })

  it('content area uses px-6 and space-y-5 for breathing room', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const content = container.querySelector('.flex-1.overflow-y-auto')
    expect(content).not.toBeNull()
    expect(content!.className).toContain('px-6')
    expect(content!.className).not.toContain('px-5')
    expect(content!.className).toContain('space-y-5')
  })

  it('Create Event button has mt-4 margin from content above', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const createBtn = screen.getByText(/Create Event/).closest('button')
    expect(createBtn).not.toBeNull()
    expect(createBtn!.className).toContain('mt-4')
  })

  it('section header uses font-medium and tracking-widest', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const sectionHeader = screen.getByText('Your availability')
    expect(sectionHeader.className).toContain('font-medium')
    expect(sectionHeader.className).not.toContain('font-semibold')
    expect(sectionHeader.className).toContain('tracking-widest')
    // tracking-widest contains substring 'tracking-wide', so check it's not exactly 'tracking-wide ' (without 'st')
    expect(sectionHeader.className).not.toMatch(/tracking-wide(?!st)/)
  })

  it('toggle uses h-6 w-11 instead of h-7 w-12', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    // Find the toggle buttons
    const toggles = container.querySelectorAll('button[aria-label*="Toggle"]')
    expect(toggles.length).toBeGreaterThan(0)
    const firstToggle = toggles[0]
    expect(firstToggle.className).toContain('h-6')
    expect(firstToggle.className).toContain('w-11')
    expect(firstToggle.className).not.toContain('h-7')
    expect(firstToggle.className).not.toContain('w-12')
  })

  it('toggle thumb uses h-4 w-4 instead of h-5 w-5', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const toggles = container.querySelectorAll('button[aria-label*="Toggle"]')
    expect(toggles.length).toBeGreaterThan(0)
    const thumb = toggles[0].querySelector('span')
    expect(thumb).not.toBeNull()
    expect(thumb!.className).toContain('h-4')
    expect(thumb!.className).toContain('w-4')
    expect(thumb!.className).not.toContain('h-5')
    expect(thumb!.className).not.toContain('w-5')
  })

  it('Create Event button uses rounded-full and h-12', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} />)
    const createBtn = screen.getByText(/Create Event/)
    const btn = createBtn.closest('button')
    expect(btn).not.toBeNull()
    expect(btn!.className).toContain('rounded-full')
    expect(btn!.className).not.toContain('rounded-2xl')
    expect(btn!.className).toContain('h-12')
    expect(btn!.className).not.toContain('py-3')
  })

  it('Past label uses text-gray-400 dark:text-gray-500', () => {
    const pastProps = {
      ...defaultProps,
      dateStr: '2020-01-01',
      availability: {
        '2020-01-01': { morning: ['m1'], evening: [] },
      },
    }
    const { container } = render(<DayDetailSheet {...pastProps} />)
    // Use getAllByText since "Past" appears in multiple places, then find the slot section one
    const pastLabels = screen.getAllByText('Past')
    // Find the one that is a <span> with font-medium (the slot section label)
    const pastLabel = pastLabels.find(el => el.tagName === 'SPAN' && el.className.includes('font-medium'))
    expect(pastLabel).not.toBeUndefined()
    expect(pastLabel!.className).toContain('text-gray-400')
    expect(pastLabel!.className).toContain('dark:text-gray-500')
    expect(pastLabel!.className).not.toContain('text-gray-300')
    expect(pastLabel!.className).not.toContain('dark:text-gray-600')
  })
})
