import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsTab } from '../SettingsTab'
import { Member } from '../../data/mockData'

vi.mock('../../lib/pushNotifications', () => ({
  isPushSupported: () => false,
  isPushSubscribed: async () => false,
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
}))

const members: Member[] = [
  { id: 'm1', name: 'Alice Rivera', initials: 'AR', color: '#E85D4A', phone: '555-0101', email: 'alice@example.com', balance: 100 },
  { id: 'm2', name: 'Bob Chen', initials: 'BC', color: '#4A90D9', phone: '555-0102', email: 'bob@example.com', balance: -50 },
]

const defaultProps = {
  members,
  groupName: 'Trip to Rome',
  onGroupNameChange: () => {},
  isDark: false,
  onToggleDark: () => {},
}

describe('SettingsTab', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders the Settings heading', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('displays the current group name', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.getByText('Trip to Rome')).toBeInTheDocument()
  })

  it('switches to edit mode when pencil button is clicked', async () => {
    render(<SettingsTab {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /edit group name/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('Trip to Rome')
  })

  it('calls onGroupNameChange with trimmed value when Enter is pressed', async () => {
    const handler = vi.fn()
    render(<SettingsTab {...defaultProps} onGroupNameChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: /edit group name/i }))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '  Paris Crew  ')
    await userEvent.keyboard('{Enter}')
    expect(handler).toHaveBeenCalledWith('Paris Crew')
  })

  it('calls onGroupNameChange when save (check) button is clicked', async () => {
    const handler = vi.fn()
    render(<SettingsTab {...defaultProps} onGroupNameChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: /edit group name/i }))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'New Name')
    await userEvent.click(screen.getByRole('button', { name: /save group name/i }))
    expect(handler).toHaveBeenCalledWith('New Name')
  })

  it('does not call onGroupNameChange for whitespace-only input', async () => {
    const handler = vi.fn()
    render(<SettingsTab {...defaultProps} onGroupNameChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: /edit group name/i }))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '   ')
    await userEvent.keyboard('{Enter}')
    expect(handler).not.toHaveBeenCalled()
  })

  it('cancels edit and does not call onGroupNameChange when Escape is pressed', async () => {
    const handler = vi.fn()
    render(<SettingsTab {...defaultProps} onGroupNameChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: /edit group name/i }))
    await userEvent.keyboard('{Escape}')
    expect(handler).not.toHaveBeenCalled()
    // Returns to display mode
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls onToggleDark when dark mode toggle is clicked', async () => {
    const handler = vi.fn()
    render(<SettingsTab {...defaultProps} onToggleDark={handler} />)
    await userEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('renders all member names', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.getByText('Alice Rivera')).toBeInTheDocument()
    expect(screen.getByText('Bob Chen')).toBeInTheDocument()
  })

  it('renders member emails', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  describe('cohesive grouping', () => {
    it('shows Preferences heading instead of separate Appearance and Notifications headings', () => {
      render(<SettingsTab {...defaultProps} />)
      // Should have a "Preferences" section header instead of separate headings
      expect(screen.getByText('Preferences')).toBeInTheDocument()
      expect(screen.queryByText('Appearance')).not.toBeInTheDocument()
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
      // Dark Mode should still be visible
      expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    })

    it('broadcast input uses rounded-2xl to match card system', () => {
      render(<SettingsTab {...defaultProps} isAdmin={true} />)
      const input = screen.getByPlaceholderText('Type a message...')
      expect(input.className).toContain('rounded-2xl')
      expect(input.className).not.toContain('rounded-xl')
    })

    it('broadcast send button supports dark mode colors', () => {
      render(<SettingsTab {...defaultProps} isAdmin={true} />)
      const sendBtn = screen.getByRole('button', { name: /send/i })
      expect(sendBtn.className).toContain('dark:bg-white')
      expect(sendBtn.className).toContain('dark:text-black')
    })
  })

  describe('design system unification', () => {
    it('does not use JS-computed color variables in rendered output (uses Tailwind dark: classes)', () => {
      const { container } = render(<SettingsTab {...defaultProps} />)
      const html = container.innerHTML
      // The component should use Tailwind dark: classes, not JS-computed classes
      // Check that proper Tailwind dark: utilities are present
      expect(html).toContain('dark:text-white')
      expect(html).toContain('dark:bg-gray-900')
      expect(html).toContain('dark:border-gray-800')
    })

    it('uses text-sm for setting row labels instead of text-base', () => {
      const { container } = render(<SettingsTab {...defaultProps} />)
      // Dark Mode label
      const darkModeLabel = screen.getByText('Dark Mode')
      expect(darkModeLabel.className).toContain('text-sm')
      expect(darkModeLabel.className).not.toContain('text-base')
    })

    it('dark mode toggle track uses bg-white when active in dark mode', () => {
      const { container } = render(<SettingsTab {...defaultProps} isDark={true} />)
      const toggleBtn = screen.getByRole('button', { name: /toggle dark mode/i })
      expect(toggleBtn.className).toContain('bg-white')
      expect(toggleBtn.className).not.toContain('bg-black')
    })

    it('uses Tailwind dark: classes for background instead of JS variables', () => {
      const { container } = render(<SettingsTab {...defaultProps} />)
      // The outer container should use dark: variant classes
      const outerDiv = container.firstElementChild as HTMLElement
      expect(outerDiv.className).toContain('bg-white')
      expect(outerDiv.className).toContain('dark:bg-gray-950')
    })

    it('setting row labels use text-sm for "Log Out"', () => {
      const { container } = render(<SettingsTab {...defaultProps} />)
      const logOutLabel = screen.getByText('Log Out')
      expect(logOutLabel.className).toContain('text-sm')
      expect(logOutLabel.className).not.toContain('text-base')
    })
  })
})
