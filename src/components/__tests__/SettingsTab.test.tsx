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
})
