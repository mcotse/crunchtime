import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BalanceHeader } from '../BalanceHeader'

describe('BalanceHeader', () => {
  it('formats a positive balance as USD currency', () => {
    render(<BalanceHeader balance={1250.5} onAddTransaction={() => {}} />)
    expect(screen.getByText('$1,250.50')).toBeInTheDocument()
  })

  it('formats a negative balance using Math.abs and shows minus prefix', () => {
    render(<BalanceHeader balance={-450.25} onAddTransaction={() => {}} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('$450.25')
    expect(h1.textContent).toContain('-')
  })

  it('applies red color class for negative balance', () => {
    const { container } = render(
      <BalanceHeader balance={-100} onAddTransaction={() => {}} />,
    )
    const balanceEl = container.querySelector('.text-red-600')
    expect(balanceEl).not.toBeNull()
  })

  it('does not apply red color class for positive balance', () => {
    const { container } = render(
      <BalanceHeader balance={100} onAddTransaction={() => {}} />,
    )
    expect(container.querySelector('.text-red-600')).toBeNull()
  })

  it('calls onAddTransaction when Add Transaction button is clicked', async () => {
    const handler = vi.fn()
    render(<BalanceHeader balance={0} onAddTransaction={handler} />)
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
