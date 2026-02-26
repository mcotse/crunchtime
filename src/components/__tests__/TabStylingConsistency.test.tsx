import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Shared mocks for all tab renders
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any
  ;(global as any).EventSource = class {
    addEventListener() {}
    close() {}
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

describe('Tab styling consistency', () => {
  describe('top padding — standalone tabs use pt-6 to match BalanceHeader', () => {
    it('PollsTab container has pt-6', async () => {
      const { PollsTab } = await import('../PollsTab')
      const { container } = render(
        <PollsTab
          polls={[]}
          members={[]}
          currentUserId=""
          onCreatePoll={() => {}}
          onOpenPoll={() => {}}
          onVote={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('pt-6')
    })

    it('SettingsTab container has pt-6', async () => {
      const { SettingsTab } = await import('../SettingsTab')
      const { container } = render(
        <SettingsTab
          members={[]}
          groupName="Test"
          onGroupNameChange={() => {}}
          isDark={false}
          onToggleDark={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('pt-6')
    })
  })

  describe('top padding — tabs below BalanceHeader/sub-tab keep pt-4', () => {
    it('FeedTab container has pt-4', async () => {
      const { FeedTab } = await import('../FeedTab')
      const { container } = render(
        <FeedTab transactions={[]} members={[]} onEdit={() => {}} isAdmin={false} onDelete={() => {}} />,
      )
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('pt-4')
    })

    it('EventsTab container has pt-4 (below sub-tab switcher)', async () => {
      const { EventsTab } = await import('../EventsTab')
      const { container } = render(
        <EventsTab
          events={[]}
          members={[]}
          currentUserId=""
          onCreateEvent={() => {}}
          onOpenEvent={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('pt-4')
    })
  })

  describe('first child has no extra top padding (consistent 16px start)', () => {
    it('PollsTab create button wrapper has no pt-*', async () => {
      const { PollsTab } = await import('../PollsTab')
      const { container } = render(
        <PollsTab
          polls={[]}
          members={[]}
          currentUserId=""
          onCreatePoll={() => {}}
          onOpenPoll={() => {}}
          onVote={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      const firstChild = root.firstElementChild as HTMLElement
      expect(firstChild.className).not.toMatch(/\bpt-\d/)
    })

    it('EventsTab create button wrapper has no pt-*', async () => {
      const { EventsTab } = await import('../EventsTab')
      const { container } = render(
        <EventsTab
          events={[]}
          members={[]}
          currentUserId=""
          onCreateEvent={() => {}}
          onOpenEvent={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      const firstChild = root.firstElementChild as HTMLElement
      expect(firstChild.className).not.toMatch(/\bpt-\d/)
    })

    it('CalendarTab month nav has no pt-*', async () => {
      const { CalendarTab } = await import('../CalendarTab')
      const { container } = render(
        <CalendarTab
          availability={{}}
          members={[]}
          currentUserId=""
          onDayTap={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      const monthNav = root.firstElementChild as HTMLElement
      expect(monthNav.className).not.toMatch(/\bpt-\d/)
    })
  })

  describe('bottom padding — scrollable tabs use pb-24', () => {
    it('PollsTab container has pb-24', async () => {
      const { PollsTab } = await import('../PollsTab')
      const { container } = render(
        <PollsTab
          polls={[]}
          members={[]}
          currentUserId=""
          onCreatePoll={() => {}}
          onOpenPoll={() => {}}
          onVote={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('pb-24')
    })

    it('EventsTab container has pb-24', async () => {
      const { EventsTab } = await import('../EventsTab')
      const { container } = render(
        <EventsTab
          events={[]}
          members={[]}
          currentUserId=""
          onCreateEvent={() => {}}
          onOpenEvent={() => {}}
        />,
      )
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('pb-24')
    })
  })

  describe('button padding — action buttons use px-6', () => {
    it('PollsTab create button has px-6', async () => {
      const { PollsTab } = await import('../PollsTab')
      const { container } = render(
        <PollsTab
          polls={[]}
          members={[]}
          currentUserId=""
          onCreatePoll={() => {}}
          onOpenPoll={() => {}}
          onVote={() => {}}
        />,
      )
      const btn = container.querySelector('button[class*="rounded-full"]')
      expect(btn?.className).toContain('px-6')
    })

    it('EventsTab create button has px-6', async () => {
      const { EventsTab } = await import('../EventsTab')
      const { container } = render(
        <EventsTab
          events={[]}
          members={[]}
          currentUserId=""
          onCreateEvent={() => {}}
          onOpenEvent={() => {}}
        />,
      )
      const btn = container.querySelector('button[class*="rounded-full"]')
      expect(btn?.className).toContain('px-6')
    })
  })

  describe('SettingsTab consistency', () => {
    it('section headers use tracking-widest', async () => {
      const { SettingsTab } = await import('../SettingsTab')
      const { container } = render(
        <SettingsTab
          members={[]}
          groupName="Test"
          onGroupNameChange={() => {}}
          isDark={false}
          onToggleDark={() => {}}
        />,
      )
      const headers = container.querySelectorAll('h3')
      headers.forEach((h) => {
        expect(h.className).toContain('tracking-widest')
      })
    })

    it('card containers use rounded-2xl', async () => {
      const { SettingsTab } = await import('../SettingsTab')
      const { container } = render(
        <SettingsTab
          members={[]}
          groupName="Test"
          onGroupNameChange={() => {}}
          isDark={false}
          onToggleDark={() => {}}
        />,
      )
      const cards = container.querySelectorAll('[class*="rounded-"]')
      const borderCards = Array.from(cards).filter(
        (el) => el.className.includes('border') && el.className.includes('overflow-hidden'),
      )
      borderCards.forEach((card) => {
        expect(card.className).toContain('rounded-2xl')
      })
    })

    it('member avatars use h-10 w-10', async () => {
      const { SettingsTab } = await import('../SettingsTab')
      const { container } = render(
        <SettingsTab
          members={[{ id: '1', name: 'Test', initials: 'T', color: '#000', balance: 0, email: 'test@test.com' }]}
          groupName="Test"
          onGroupNameChange={() => {}}
          isDark={false}
          onToggleDark={() => {}}
        />,
      )
      const avatar = container.querySelector('[class*="rounded-full"][class*="flex-shrink-0"]')
      expect(avatar?.className).toContain('h-10')
      expect(avatar?.className).toContain('w-10')
    })
  })
})
