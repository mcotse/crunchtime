import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AddTransactionSheet } from '../AddTransactionSheet'
import { Member } from '../../data/mockData'

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, style, ...rest }: any, ref: any) => (
      <div ref={ref} className={className} style={style} data-testid={rest['data-testid']} onClick={rest.onClick}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const members: Member[] = [
  { id: 'm1', name: 'Alice', initials: 'A', color: '#E85D4A', phone: '', email: '', balance: 0 },
  { id: 'm2', name: 'Bob', initials: 'B', color: '#4A90D9', phone: '', email: '', balance: 0 },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  members,
  onAdd: vi.fn(),
}

describe('AddTransactionSheet design system', () => {
  it('sheet container uses left-0 right-0 mx-auto instead of left-1/2 with transform', () => {
    const { container } = render(<AddTransactionSheet {...defaultProps} />)
    const sheet = container.querySelector('.fixed.bottom-0')
    expect(sheet).not.toBeNull()
    expect(sheet?.className).toContain('left-0')
    expect(sheet?.className).toContain('right-0')
    expect(sheet?.className).toContain('mx-auto')
    expect(sheet?.className).not.toContain('left-1/2')
    // style should not contain x: '-50%'
    const style = sheet?.getAttribute('style') || ''
    expect(style).not.toContain('-50%')
  })

  it('sheet uses z-[51] while backdrop stays z-50', () => {
    const { container } = render(<AddTransactionSheet {...defaultProps} />)
    const allDivs = container.querySelectorAll('.fixed')
    const backdrop = Array.from(allDivs).find(el => el.className.includes('inset-0'))
    const sheet = Array.from(allDivs).find(el => el.className.includes('bottom-0'))
    expect(backdrop?.className).toContain('z-50')
    expect(sheet?.className).toContain('z-[51]')
  })

  it('CTA button uses h-12 and rounded-full', () => {
    const { container } = render(<AddTransactionSheet {...defaultProps} />)
    const ctaButton = container.querySelector('button[aria-label="Submit transaction"]')
    expect(ctaButton).not.toBeNull()
    expect(ctaButton?.className).toContain('h-12')
    expect(ctaButton?.className).toContain('rounded-full')
    expect(ctaButton?.className).not.toContain('h-14')
    expect(ctaButton?.className).not.toContain('rounded-xl')
  })

  it('type toggle buttons use rounded-full', () => {
    const { container } = render(<AddTransactionSheet {...defaultProps} />)
    // The toggle buttons are the income/expense buttons
    const toggleContainer = container.querySelector('.flex.p-1.bg-gray-100')
    const toggleButtons = toggleContainer?.querySelectorAll('button')
    expect(toggleButtons).toBeDefined()
    toggleButtons?.forEach(btn => {
      expect(btn.className).toContain('rounded-full')
      expect(btn.className).not.toContain('rounded-md')
    })
  })

  it('form uses space-y-7 consistent with other creation sheets', () => {
    const { container } = render(<AddTransactionSheet {...defaultProps} />)
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    expect(form!.className).toContain('space-y-7')
  })

  it('uses dark:border-gray-800 instead of dark:border-gray-700 in its own elements', () => {
    const { container } = render(<AddTransactionSheet {...defaultProps} />)
    // Check specific elements owned by this component (not shared Input component)
    const memberList = container.querySelector('.bg-gray-50.dark\\:bg-gray-800.rounded-xl')
    if (memberList) {
      expect(memberList.className).toContain('dark:border-gray-800')
      expect(memberList.className).not.toContain('dark:border-gray-700')
    }
    // Check event picker border
    const dateInput = container.querySelector('input[type="date"]')
    if (dateInput) {
      expect(dateInput.className).toContain('dark:border-gray-800')
      expect(dateInput.className).not.toContain('dark:border-gray-700')
    }
  })
})
