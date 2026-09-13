import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionBar } from './ActionBar'

describe('ActionBar', () => {
  it('calls onGenerate when idle and clicked', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(<ActionBar step="idle" disabled={false} onGenerate={onGenerate} />)

    await user.click(screen.getByRole('button', { name: /synthesize & generate notes/i }))
    expect(onGenerate).toHaveBeenCalledOnce()
  })

  it('disables the button while a generation step is running', () => {
    render(<ActionBar step="generating" disabled={false} onGenerate={vi.fn()} />)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/synthesizing/i)).toBeInTheDocument()
  })

  it('disables the button when explicitly disabled, even while idle', () => {
    render(<ActionBar step="idle" disabled={true} onGenerate={vi.fn()} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows the 3-step progress indicator only while running', () => {
    const { rerender } = render(<ActionBar step="idle" disabled={false} onGenerate={vi.fn()} />)
    expect(screen.queryByText(/parsing documents/i)).not.toBeInTheDocument()

    rerender(<ActionBar step="extracting" disabled={false} onGenerate={vi.fn()} />)
    expect(screen.getByText(/parsing documents/i)).toBeInTheDocument()
    expect(screen.getByText(/extracting core themes/i)).toBeInTheDocument()
  })

  it('re-enables the button once generation finishes', () => {
    render(<ActionBar step="done" disabled={false} onGenerate={vi.fn()} />)
    expect(screen.getByRole('button')).toBeEnabled()
  })
})
