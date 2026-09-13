import { describe, it, expect } from 'vitest'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastStack } from './ToastStack'
import { ToastProvider, useToasts } from '@/hooks/useToasts'

function Harness() {
  const { pushToast } = useToasts()
  return (
    <>
      <button onClick={() => pushToast({ kind: 'error', title: 'Failed to export', description: 'Try again' })}>
        trigger
      </button>
      <ToastStack />
    </>
  )
}

describe('ToastStack', () => {
  it('renders nothing when there are no toasts', () => {
    render(
      <ToastProvider>
        <ToastStack />
      </ToastProvider>,
    )
    expect(screen.queryByRole('button', { name: /dismiss notification/i })).not.toBeInTheDocument()
  })

  it('renders a pushed toast with its title and description', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )
    await user.click(screen.getByText('trigger'))
    expect(screen.getByText('Failed to export')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('removes a toast when its dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )
    await user.click(screen.getByText('trigger'))
    expect(screen.getByText('Failed to export')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/dismiss notification/i))
    // AnimatePresence keeps the node mounted through its exit animation, so wait it out.
    await waitForElementToBeRemoved(() => screen.queryByText('Failed to export'))
  })
})
