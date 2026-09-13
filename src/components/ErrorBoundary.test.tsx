import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom')
  return <p>safe content</p>
}

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('shows the fallback UI when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/something went sideways/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch to demo mode/i })).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('calls onSwitchToDemoMode and clears the error when that button is clicked', async () => {
    const user = userEvent.setup()
    const onSwitchToDemoMode = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary onSwitchToDemoMode={onSwitchToDemoMode}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: /switch to demo mode/i }))
    expect(onSwitchToDemoMode).toHaveBeenCalledOnce()

    vi.restoreAllMocks()
  })
})
