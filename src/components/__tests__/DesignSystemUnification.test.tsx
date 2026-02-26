import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any
  ;(global as any).EventSource = class {
    addEventListener() {}
    close() {}
  }
  // Polyfill ResizeObserver for recharts ResponsiveContainer
  ;(global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'localStorage', {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() },
    writable: true,
  })
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    writable: true,
  })
})

// ─── 1. Button.tsx ────────────────────────────────────────────────
describe('Button — design system unification', () => {
  it('uses rounded-full instead of rounded-lg as base shape', async () => {
    const { Button } = await import('../ui/Button')
    const { container } = render(<Button>Click</Button>)
    const btn = container.firstElementChild as HTMLElement
    expect(btn.className).toContain('rounded-full')
    expect(btn.className).not.toContain('rounded-lg')
  })

  it('primary variant has dark mode classes', async () => {
    const { Button } = await import('../ui/Button')
    const { container } = render(<Button variant="primary">Click</Button>)
    const btn = container.firstElementChild as HTMLElement
    expect(btn.className).toContain('dark:bg-white')
    expect(btn.className).toContain('dark:text-black')
    expect(btn.className).toContain('dark:hover:bg-gray-100')
  })

  it('secondary variant has dark mode classes', async () => {
    const { Button } = await import('../ui/Button')
    const { container } = render(<Button variant="secondary">Click</Button>)
    const btn = container.firstElementChild as HTMLElement
    expect(btn.className).toContain('dark:bg-gray-800')
    expect(btn.className).toContain('dark:text-white')
    expect(btn.className).toContain('dark:hover:bg-gray-700')
  })

  it('outline variant has dark mode classes', async () => {
    const { Button } = await import('../ui/Button')
    const { container } = render(<Button variant="outline">Click</Button>)
    const btn = container.firstElementChild as HTMLElement
    expect(btn.className).toContain('dark:border-gray-800')
    expect(btn.className).toContain('dark:hover:bg-gray-800')
  })

  it('ghost variant has dark mode classes', async () => {
    const { Button } = await import('../ui/Button')
    const { container } = render(<Button variant="ghost">Click</Button>)
    const btn = container.firstElementChild as HTMLElement
    expect(btn.className).toContain('dark:hover:bg-gray-800')
  })

  it('sm size uses h-9 instead of h-8', async () => {
    const { Button } = await import('../ui/Button')
    const { container } = render(<Button size="sm">Click</Button>)
    const btn = container.firstElementChild as HTMLElement
    expect(btn.className).toContain('h-9')
    expect(btn.className).not.toContain('h-8')
  })
})

// ─── 2. Input.tsx ─────────────────────────────────────────────────
describe('Input — design system unification', () => {
  it('uses rounded-xl instead of rounded-lg', async () => {
    const { Input } = await import('../ui/Input')
    const { container } = render(<Input />)
    const input = container.querySelector('input') as HTMLElement
    expect(input.className).toContain('rounded-xl')
    expect(input.className).not.toContain('rounded-lg')
  })
})

// ─── 3. AnalyticsTab.tsx ──────────────────────────────────────────
describe('AnalyticsTab — design system unification', () => {
  const members = [
    { id: 'm1', name: 'Alice', initials: 'AR', color: '#E85D4A', phone: '', email: '', balance: 100 },
  ]
  const transactions = [
    { id: 't1', description: 'Test', amount: 100, memberId: 'm1', date: '2023-10-01', category: 'Food', editHistory: [] },
  ]

  it('root container uses pb-24 instead of pb-32', async () => {
    const { AnalyticsTab } = await import('../AnalyticsTab')
    const { container } = render(
      <AnalyticsTab members={members} transactions={transactions} />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('pb-24')
    expect(root.className).not.toContain('pb-32')
  })

  it('root container uses space-y-6 instead of space-y-8', async () => {
    const { AnalyticsTab } = await import('../AnalyticsTab')
    const { container } = render(
      <AnalyticsTab members={members} transactions={transactions} />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('space-y-6')
    expect(root.className).not.toContain('space-y-8')
  })

  it('section wrappers use space-y-2 instead of space-y-3', async () => {
    const { AnalyticsTab } = await import('../AnalyticsTab')
    const { container } = render(
      <AnalyticsTab members={members} transactions={transactions} />,
    )
    // The two sections: "Group Balance Over Time" and "Contribution Leaderboard"
    const sectionHeaders = container.querySelectorAll('h3')
    sectionHeaders.forEach(h3 => {
      const section = h3.closest('[class*="space-y-"]') as HTMLElement
      expect(section?.className).toContain('space-y-2')
      expect(section?.className).not.toContain('space-y-3')
    })
  })

  it('chart card has border classes', async () => {
    const { AnalyticsTab } = await import('../AnalyticsTab')
    const { container } = render(
      <AnalyticsTab members={members} transactions={transactions} />,
    )
    const chartCard = container.querySelector('.bg-gray-50.dark\\:bg-gray-900.rounded-2xl') as HTMLElement
    expect(chartCard?.className).toContain('border')
    expect(chartCard?.className).toContain('border-gray-100')
    expect(chartCard?.className).toContain('dark:border-gray-800')
  })

  it('leaderboard avatars use h-10 w-10 instead of h-8 w-8', async () => {
    const { AnalyticsTab } = await import('../AnalyticsTab')
    const { container } = render(
      <AnalyticsTab members={members} transactions={transactions} />,
    )
    // Find the avatar inside leaderboard
    const avatars = container.querySelectorAll('[class*="rounded-full"][class*="flex-shrink-0"]')
    const leaderboardAvatar = Array.from(avatars).find(
      el => el.className.includes('text-white') && el.className.includes('text-xs'),
    )
    expect(leaderboardAvatar?.className).toContain('h-10')
    expect(leaderboardAvatar?.className).toContain('w-10')
    expect(leaderboardAvatar?.className).not.toContain('h-8')
    expect(leaderboardAvatar?.className).not.toContain('w-8')
  })
})

// ─── 4. CalendarTab.tsx ───────────────────────────────────────────
describe('CalendarTab — design system unification', () => {
  const defaultProps = {
    availability: {},
    members: [],
    currentUserId: '',
    onDayTap: () => {},
    events: [],
  }

  it('root container has pt-4', async () => {
    const { CalendarTab } = await import('../CalendarTab')
    const { container } = render(<CalendarTab {...defaultProps} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('pt-4')
  })

  it('month title uses text-lg instead of text-base', async () => {
    const { CalendarTab } = await import('../CalendarTab')
    const { container } = render(<CalendarTab {...defaultProps} />)
    const h2 = container.querySelector('h2') as HTMLElement
    expect(h2?.className).toContain('text-lg')
    expect(h2?.className).not.toContain('text-base')
  })

  it('day-of-week headers use text-xs font-medium tracking-widest', async () => {
    const { CalendarTab } = await import('../CalendarTab')
    const { container } = render(<CalendarTab {...defaultProps} />)
    const dayHeaders = container.querySelectorAll('.grid.grid-cols-7.mb-2 > div')
    dayHeaders.forEach(el => {
      expect(el.className).toContain('text-xs')
      expect(el.className).toContain('font-medium')
      expect(el.className).toContain('tracking-widest')
      expect(el.className).toContain('dark:text-gray-500')
      expect(el.className).not.toContain('text-[11px]')
      // Don't check for 'tracking-wide' removal since 'tracking-widest' contains it
      expect(el.className).toMatch(/tracking-widest/)
      expect(el.className).not.toMatch(/tracking-wide\b(?!st)/)
    })
  })

  it('month nav buttons use w-10 h-10 instead of w-9 h-9', async () => {
    const { CalendarTab } = await import('../CalendarTab')
    const { container } = render(<CalendarTab {...defaultProps} />)
    const navButtons = container.querySelectorAll('button[aria-label*="month"]')
    navButtons.forEach(btn => {
      expect(btn.className).toContain('w-10')
      expect(btn.className).toContain('h-10')
      expect(btn.className).not.toContain('w-9')
      expect(btn.className).not.toContain('h-9')
    })
  })

  it('empty state heading uses text-sm font-medium text-gray-500', async () => {
    const { CalendarTab } = await import('../CalendarTab')
    const { container } = render(<CalendarTab {...defaultProps} />)
    const heading = screen.getByText('No availability yet')
    expect(heading.className).toContain('text-sm')
    expect(heading.className).toContain('font-medium')
    expect(heading.className).toContain('text-gray-500')
    expect(heading.className).toContain('dark:text-gray-400')
  })
})

// ─── 5. HomeTab.tsx ───────────────────────────────────────────────
describe('HomeTab — design system unification', () => {
  const defaultProps = {
    members: [],
    transactions: [
      { id: 't1', description: 'Income', amount: 100, memberId: 'm1', date: '2023-01-01', category: 'Income', editHistory: [] },
      { id: 't2', description: 'Expense', amount: -50, memberId: 'm1', date: '2023-01-02', category: 'Food', editHistory: [] },
    ],
    balance: 50,
    onAddTransaction: () => {},
    groupName: 'Test Group',
  }

  it('inner motion wrapper uses space-y-6 instead of space-y-4', async () => {
    const { HomeTab } = await import('../HomeTab')
    const { container } = render(<HomeTab {...defaultProps} />)
    // The motion.div with space-y class
    const motionDiv = container.querySelector('[class*="space-y-"]') as HTMLElement
    expect(motionDiv?.className).toContain('space-y-6')
    expect(motionDiv?.className).not.toContain('space-y-4')
  })

  it('income/expense grid uses gap-4 instead of gap-3', async () => {
    const { HomeTab } = await import('../HomeTab')
    const { container } = render(<HomeTab {...defaultProps} />)
    const grid = container.querySelector('.grid.grid-cols-2') as HTMLElement
    expect(grid?.className).toContain('gap-4')
    expect(grid?.className).not.toContain('gap-3')
  })

  it('stat cards have border classes', async () => {
    const { HomeTab } = await import('../HomeTab')
    const { container } = render(<HomeTab {...defaultProps} />)
    const statCards = container.querySelectorAll('.bg-gray-50.dark\\:bg-gray-900.rounded-2xl')
    statCards.forEach(card => {
      expect(card.className).toContain('border')
      expect(card.className).toContain('border-gray-100')
      expect(card.className).toContain('dark:border-gray-800')
    })
  })

  it('sub-labels use text-xs and tracking-widest', async () => {
    const { HomeTab } = await import('../HomeTab')
    const { container } = render(<HomeTab {...defaultProps} />)
    const incomeLabel = screen.getByText('Income')
    const expensesLabel = screen.getByText('Expenses')
    expect(incomeLabel.className).toContain('text-xs')
    expect(incomeLabel.className).toContain('tracking-widest')
    expect(incomeLabel.className).not.toContain('text-[11px]')
    expect(incomeLabel.className).not.toContain('tracking-wider')
    expect(expensesLabel.className).toContain('text-xs')
    expect(expensesLabel.className).toContain('tracking-widest')
  })

  it('CTA button does not have shadow-none', async () => {
    const { HomeTab } = await import('../HomeTab')
    const { container } = render(<HomeTab {...defaultProps} />)
    const ctaBtn = screen.getByRole('button', { name: /add transaction/i })
    expect(ctaBtn.className).not.toContain('shadow-none')
  })
})

// ─── 6. EventsTab.tsx ─────────────────────────────────────────────
describe('EventsTab — design system unification', () => {
  const defaultProps = {
    events: [] as any[],
    members: [],
    currentUserId: '',
    onCreateEvent: () => {},
    onOpenEvent: () => {},
  }

  it('past events collapse button has hover:opacity-70 transition-opacity', async () => {
    const pastEvent = {
      id: 'e1',
      title: 'Past Event',
      emoji: '🎉',
      description: '',
      date: '2020-01-01',
      time: null,
      createdBy: '',
      rsvps: [],
    }
    const { EventsTab } = await import('../EventsTab')
    const { container } = render(
      <EventsTab {...defaultProps} events={[pastEvent]} />,
    )
    const collapseBtn = container.querySelector('button[class*="justify-between"]') as HTMLElement
    expect(collapseBtn?.className).toContain('hover:opacity-70')
    expect(collapseBtn?.className).toContain('transition-opacity')
  })

  it('event date labels use text-xs instead of text-[11px]', async () => {
    const pastEvent = {
      id: 'e1',
      title: 'Past Event',
      emoji: '🎉',
      description: '',
      date: '2020-01-01',
      time: null,
      createdBy: '',
      rsvps: [{ memberId: 'm1', status: 'going' }],
    }
    const { EventsTab } = await import('../EventsTab')
    const { container } = render(
      <EventsTab {...defaultProps} events={[pastEvent]} />,
    )
    // Click the collapse button to expand past events
    const collapseBtn = container.querySelector('button[class*="justify-between"]') as HTMLElement
    collapseBtn?.click()
    // Wait for animation
    await new Promise(r => setTimeout(r, 50))
    // The "X went" span in past events
    const wentSpan = screen.getByText(/went/)
    expect(wentSpan.className).toContain('text-xs')
    expect(wentSpan.className).not.toContain('text-[11px]')
  })
})

// ─── 7. FeedTab.tsx ───────────────────────────────────────────────
describe('FeedTab — design system unification', () => {
  const members = [
    { id: 'm1', name: 'Alice', initials: 'AR', color: '#E85D4A', phone: '', email: '', balance: 0 },
  ]
  const transactions = [
    { id: 't1', description: 'Grocery Run', amount: -156.42, memberId: 'm1', date: '2023-10-25', category: 'Food', editHistory: [
      { editedBy: 'Alice', editedAt: '2023-10-25', change: 'Updated' },
    ]},
  ]

  it('transaction description uses text-sm instead of text-base', async () => {
    const { FeedTab } = await import('../FeedTab')
    const { container } = render(
      <FeedTab transactions={transactions} members={members} onEdit={() => {}} />,
    )
    const desc = screen.getByText('Grocery Run')
    expect(desc.className).toContain('text-sm')
    expect(desc.className).not.toContain('text-base')
  })

  it('transaction amount uses text-sm and flex-shrink-0', async () => {
    const { FeedTab } = await import('../FeedTab')
    const { container } = render(
      <FeedTab transactions={transactions} members={members} onEdit={() => {}} />,
    )
    const amount = screen.getByText('-156.42')
    expect(amount.className).toContain('text-sm')
    expect(amount.className).toContain('flex-shrink-0')
    expect(amount.className).not.toContain('text-base')
  })

  it('edit/delete icon buttons use rounded-full instead of rounded-md', async () => {
    const { FeedTab } = await import('../FeedTab')
    const { container } = render(
      <FeedTab transactions={transactions} members={members} onEdit={() => {}} isAdmin={true} onDelete={() => {}} />,
    )
    const editBtn = screen.getByRole('button', { name: /edit transaction/i })
    expect(editBtn.className).toContain('rounded-full')
    expect(editBtn.className).not.toContain('rounded-md')
    const deleteBtn = screen.getByRole('button', { name: /delete transaction/i })
    expect(deleteBtn.className).toContain('rounded-full')
    expect(deleteBtn.className).not.toContain('rounded-md')
  })

  it('heading does not have extra pt-2', async () => {
    const { FeedTab } = await import('../FeedTab')
    const { container } = render(
      <FeedTab transactions={transactions} members={members} onEdit={() => {}} />,
    )
    const heading = screen.getByText('Recent Activity')
    expect(heading.className).not.toContain('pt-2')
  })

  it('edit history note has dark:text-gray-500', async () => {
    const { FeedTab } = await import('../FeedTab')
    const { container } = render(
      <FeedTab transactions={transactions} members={members} onEdit={() => {}} />,
    )
    const editNote = screen.getByText(/Edited by/).closest('div') as HTMLElement
    expect(editNote?.className).toContain('dark:text-gray-500')
  })

  it('shows empty state when transactions array is empty', async () => {
    const { FeedTab } = await import('../FeedTab')
    render(
      <FeedTab transactions={[]} members={members} onEdit={() => {}} />,
    )
    expect(screen.getByText(/no.*transactions|no.*activity/i)).toBeInTheDocument()
  })
})

// ─── 8. MembersTab.tsx ────────────────────────────────────────────
describe('MembersTab — design system unification', () => {
  const members = [
    { id: 'm1', name: 'Alice Rivera', initials: 'AR', color: '#E85D4A', phone: '', email: 'alice@test.com', balance: 100 },
  ]

  it('member name uses text-sm instead of text-base', async () => {
    const { MembersTab } = await import('../MembersTab')
    render(<MembersTab members={members} />)
    const name = screen.getByText('Alice Rivera')
    expect(name.className).toContain('text-sm')
    expect(name.className).not.toContain('text-base')
  })

  it('balance text uses text-sm instead of text-base', async () => {
    const { MembersTab } = await import('../MembersTab')
    const { container } = render(<MembersTab members={members} />)
    const balanceEl = container.querySelector('[class*="font-semibold"][class*="text-green-600"], [class*="font-semibold"][class*="text-red-600"]') as HTMLElement
    expect(balanceEl?.className).toContain('text-sm')
    expect(balanceEl?.className).not.toContain('text-base')
  })

  it('balance label has dark:text-gray-500', async () => {
    const { MembersTab } = await import('../MembersTab')
    render(<MembersTab members={members} />)
    const label = screen.getByText('Balance')
    expect(label.className).toContain('dark:text-gray-500')
  })
})

// ─── 9. PollsTab.tsx ──────────────────────────────────────────────
describe('PollsTab — design system unification', () => {
  const defaultProps = {
    polls: [] as any[],
    members: [],
    currentUserId: '',
    onCreatePoll: () => {},
    onOpenPoll: () => {},
    onVote: () => {},
  }

  it('active section wrapper uses space-y-2 instead of space-y-3', async () => {
    const { PollsTab } = await import('../PollsTab')
    const { container } = render(<PollsTab {...defaultProps} />)
    // Find the section that wraps the "Active" header
    const activeHeader = screen.getByText('Active')
    const section = activeHeader.closest('[class*="space-y-"]') as HTMLElement
    expect(section?.className).toContain('space-y-2')
    expect(section?.className).not.toContain('space-y-3')
  })

  it('empty state uses emoji span instead of icon-in-box', async () => {
    const { PollsTab } = await import('../PollsTab')
    const { container } = render(<PollsTab {...defaultProps} />)
    // Should have the ballot box emoji
    const emojiSpan = container.querySelector('.text-5xl')
    expect(emojiSpan).not.toBeNull()
  })

  it('empty state text uses text-sm font-medium text-gray-500', async () => {
    const { PollsTab } = await import('../PollsTab')
    render(<PollsTab {...defaultProps} />)
    const noActiveText = screen.getByText('No active polls')
    expect(noActiveText.className).toContain('text-sm')
    expect(noActiveText.className).toContain('font-medium')
    expect(noActiveText.className).toContain('text-gray-500')
    expect(noActiveText.className).toContain('dark:text-gray-400')
  })

  it('archived collapse button has hover:opacity-70 transition-opacity', async () => {
    const archivedPoll = {
      id: 'p1',
      title: 'Old Poll',
      emoji: '📊',
      options: [{ id: 'o1', text: 'A', voterIds: [] }],
      createdBy: '',
      createdAt: '2020-01-01',
      isArchived: true,
      archivedAt: '2020-02-01',
      allowMembersToAddOptions: false,
      allowMultiSelect: false,
      comments: [],
    }
    const { PollsTab } = await import('../PollsTab')
    const { container } = render(
      <PollsTab {...defaultProps} polls={[archivedPoll]} />,
    )
    const collapseBtn = container.querySelector('button[class*="justify-between"]') as HTMLElement
    expect(collapseBtn?.className).toContain('hover:opacity-70')
    expect(collapseBtn?.className).toContain('transition-opacity')
  })
})

// ─── 10. TabBar.tsx ───────────────────────────────────────────────
describe('TabBar — design system unification', () => {
  it('tab buttons have active:scale-90 transition-all', async () => {
    const { TabBar } = await import('../TabBar')
    const { container } = render(
      <TabBar activeTab="home" onTabChange={() => {}} />,
    )
    const tabButtons = container.querySelectorAll('button')
    tabButtons.forEach(btn => {
      expect(btn.className).toContain('active:scale-90')
      expect(btn.className).toContain('transition-all')
    })
  })
})

// ─── 11. BalanceHeader.tsx ────────────────────────────────────────
describe('BalanceHeader — design system unification', () => {
  const defaultProps = { balance: 100, onAddTransaction: () => {} }

  it('container uses px-4 instead of px-6', async () => {
    const { BalanceHeader } = await import('../BalanceHeader')
    const { container } = render(<BalanceHeader {...defaultProps} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('px-4')
    expect(root.className).not.toContain('px-6')
  })

  it('Total Balance label has dark:text-gray-500 and tracking-widest', async () => {
    const { BalanceHeader } = await import('../BalanceHeader')
    render(<BalanceHeader {...defaultProps} />)
    const label = screen.getByText('Total Balance')
    expect(label.className).toContain('dark:text-gray-500')
    expect(label.className).toContain('tracking-widest')
    expect(label.className).not.toContain('tracking-wider')
  })

  it('button padding wrapper uses pt-4 instead of pt-3', async () => {
    const { BalanceHeader } = await import('../BalanceHeader')
    const { container } = render(<BalanceHeader {...defaultProps} />)
    const ptDiv = container.querySelector('[class*="pt-"]') as HTMLElement
    // Find the div wrapping the button that has pt-* class
    const buttonWrapper = screen.getByRole('button', { name: /add transaction/i }).closest('[class*="pt-"]') as HTMLElement
    expect(buttonWrapper?.className).toContain('pt-4')
    expect(buttonWrapper?.className).not.toContain('pt-3')
  })

  it('button does not have shadow-none', async () => {
    const { BalanceHeader } = await import('../BalanceHeader')
    render(<BalanceHeader {...defaultProps} />)
    const btn = screen.getByRole('button', { name: /add transaction/i })
    expect(btn.className).not.toContain('shadow-none')
  })
})

// ─── 12. BudgetApp.tsx ────────────────────────────────────────────
describe('BudgetApp — design system unification', () => {
  it('sub-tab toggle buttons use h-10 instead of h-9', async () => {
    const { BudgetApp } = await import('../../pages/BudgetApp')
    const { container } = render(<BudgetApp />)
    // Navigate to calendar tab - find the calendar button
    const calendarBtn = container.querySelector('button[aria-label="Calendar"]') as HTMLElement
    calendarBtn?.click()
    // Wait for re-render
    await new Promise(r => setTimeout(r, 10))
    // The sub-tab buttons (Availability, Events)
    const subTabs = container.querySelectorAll('[class*="rounded-full"][class*="px-5"]')
    subTabs.forEach(btn => {
      expect(btn.className).toContain('h-10')
      expect(btn.className).not.toContain('h-9')
    })
  })
})

// ─── 13. EventCard.tsx ────────────────────────────────────────────
describe('EventCard — design system unification', () => {
  const event = {
    id: 'e1',
    title: 'Game Night',
    emoji: '🎲',
    description: 'Fun times',
    date: '2026-12-25',
    time: null,
    createdBy: 'm1',
    rsvps: [
      { memberId: 'm1', status: 'going' as const },
      { memberId: 'm2', status: 'maybe' as const },
    ],
  }
  const members = [
    { id: 'm1', name: 'Alice', initials: 'AR', color: '#E85D4A', phone: '', email: '', balance: 0 },
    { id: 'm2', name: 'Bob', initials: 'BC', color: '#4A90D9', phone: '', email: '', balance: 0 },
  ]

  it('RSVP pills use text-xs instead of text-[11px]', async () => {
    const { EventCard } = await import('../EventCard')
    const { container } = render(
      <EventCard event={event} members={members} currentUserId="m1" onTap={() => {}} />,
    )
    // The RSVP pill for the current user — it's a span with px-2.5 py-1 rounded-full
    const rsvpPill = container.querySelector('span[class*="rounded-full"][class*="px-2.5"]') as HTMLElement
    expect(rsvpPill).not.toBeNull()
    expect(rsvpPill.className).toContain('text-xs')
    expect(rsvpPill.className).not.toContain('text-[11px]')
  })

  it('going/maybe count uses text-xs instead of text-[11px]', async () => {
    const { EventCard } = await import('../EventCard')
    render(
      <EventCard event={event} members={members} currentUserId="m1" onTap={() => {}} />,
    )
    const countText = screen.getByText(/going/)
    expect(countText.className).toContain('text-xs')
    expect(countText.className).not.toContain('text-[11px]')
  })
})
