import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDeleteModal } from '../ConfirmDeleteModal'

const defaultProps = {
  isOpen: true,
  title: 'Delete Item',
  description: 'Are you sure you want to delete this?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmDeleteModal — design system unification', () => {
  it('both buttons have rounded-full class', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />)
    const cancelBtn = screen.getByText('Cancel').closest('button')
    const deleteBtn = screen.getByText('Delete').closest('button')
    expect(cancelBtn).not.toBeNull()
    expect(deleteBtn).not.toBeNull()
    expect(cancelBtn!.className).toContain('rounded-full')
    expect(deleteBtn!.className).toContain('rounded-full')
  })

  it('modal title uses font-semibold instead of font-bold', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />)
    const title = screen.getByText('Delete Item')
    expect(title.className).toContain('font-semibold')
    expect(title.className).not.toContain('font-bold')
  })
})
