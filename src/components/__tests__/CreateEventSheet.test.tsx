import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateEventSheet } from '../CreateEventSheet'

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, style, ...rest }: any, ref: any) => (
      <div ref={ref} className={className} style={style} onClick={rest.onClick}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onCreateEvent: vi.fn(),
}

describe('CreateEventSheet design system', () => {
  it('sheet container uses left-0 right-0 mx-auto instead of left-1/2', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    const sheet = container.querySelector('.fixed.bottom-0')
    expect(sheet).not.toBeNull()
    expect(sheet?.className).toContain('left-0')
    expect(sheet?.className).toContain('right-0')
    expect(sheet?.className).toContain('mx-auto')
    expect(sheet?.className).not.toContain('left-1/2')
    const style = sheet?.getAttribute('style') || ''
    expect(style).not.toContain('-50%')
  })

  it('sheet uses z-[51] while backdrop stays z-50', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    const allDivs = container.querySelectorAll('.fixed')
    const backdrop = Array.from(allDivs).find(el => el.className.includes('inset-0'))
    const sheet = Array.from(allDivs).find(el => el.className.includes('bottom-0'))
    expect(backdrop?.className).toContain('z-50')
    expect(sheet?.className).toContain('z-[51]')
  })

  it('section headers use font-medium instead of font-semibold', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    const sectionHeaders = container.querySelectorAll('label.text-xs.uppercase')
    expect(sectionHeaders.length).toBeGreaterThan(0)
    sectionHeaders.forEach(header => {
      expect(header.className).toContain('font-medium')
      expect(header.className).not.toContain('font-semibold')
    })
  })

  it('availability section header uses tracking-widest and font-medium', () => {
    const { container } = render(
      <CreateEventSheet
        {...defaultProps}
        prefillDate="2026-03-01"
        availability={{ '2026-03-01': { morning: ['m1'], evening: [] } }}
        members={[{ id: 'm1', name: 'Alice', initials: 'A', color: '#E85D4A', phone: '', email: '', balance: 0 }]}
      />
    )
    // The availability header is the p tag with "Who's free on"
    const availHeader = container.querySelector('p.text-xs.uppercase')
    if (availHeader) {
      expect(availHeader.className).toContain('tracking-widest')
      expect(availHeader.className).toContain('font-medium')
      expect(availHeader.className).not.toContain('font-semibold')
    }
  })

  it('CTA button uses h-12 and rounded-full', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    // Find the "Create Event" button
    const buttons = Array.from(container.querySelectorAll('button'))
    const ctaButton = buttons.find(b => b.textContent?.includes('Create Event'))
    expect(ctaButton).toBeDefined()
    expect(ctaButton?.className).toContain('h-12')
    expect(ctaButton?.className).toContain('rounded-full')
    expect(ctaButton?.className).not.toContain('h-14')
  })

  it('sheet title uses font-semibold instead of font-bold', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    const h2 = container.querySelector('h2')
    expect(h2?.className).toContain('font-semibold')
    expect(h2?.className).not.toContain('font-bold')
  })

  it('optional hint text uses text-gray-400 dark:text-gray-500', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    const optionalSpans = Array.from(container.querySelectorAll('span')).filter(
      s => s.textContent?.includes('optional')
    )
    optionalSpans.forEach(span => {
      expect(span.className).toContain('text-gray-400')
      expect(span.className).toContain('dark:text-gray-500')
      expect(span.className).not.toContain('text-gray-300')
      expect(span.className).not.toContain('dark:text-gray-600')
    })
  })

  it('availability card has border classes', () => {
    const { container } = render(
      <CreateEventSheet
        {...defaultProps}
        prefillDate="2026-03-01"
        availability={{ '2026-03-01': { morning: ['m1'], evening: [] } }}
        members={[{ id: 'm1', name: 'Alice', initials: 'A', color: '#E85D4A', phone: '', email: '', balance: 0 }]}
      />
    )
    const availCard = container.querySelector('.bg-gray-50.dark\\:bg-gray-800\\/60.rounded-2xl')
    if (availCard) {
      expect(availCard.className).toContain('border')
      expect(availCard.className).toContain('border-gray-100')
      expect(availCard.className).toContain('dark:border-gray-800')
    }
  })

  it('uses dark:border-gray-800 instead of dark:border-gray-700 throughout', () => {
    const { container } = render(<CreateEventSheet {...defaultProps} />)
    const html = container.innerHTML
    expect(html).not.toContain('dark:border-gray-700')
  })
})
