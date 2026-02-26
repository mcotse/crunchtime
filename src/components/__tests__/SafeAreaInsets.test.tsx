import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock fetch, EventSource, and localStorage so BudgetApp doesn't blow up in jsdom
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
    value: vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    writable: true,
  })
})

describe('PWA safe-area insets', () => {
  it('index.html viewport meta includes viewport-fit=cover', () => {
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../../index.html'),
      'utf-8',
    )
    expect(html).toContain('viewport-fit=cover')
  })

  it('index.css includes safe-area-inset-top rule for standalone mode', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../index.css'),
      'utf-8',
    )
    expect(css).toContain('safe-area-inset-top')
  })

  it('BudgetApp root container applies safe-area top padding class', async () => {
    const { BudgetApp } = await import('../../pages/BudgetApp')
    const { container } = render(<BudgetApp />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('pt-safe-top')
  })
})
