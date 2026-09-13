import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { ToastProvider } from '@/hooks/useToasts'
import { clearTransientStorage } from '@/services/storage'

// The 3D hero orb needs a real WebGL context, which jsdom doesn't provide —
// stub it so App's integration tests exercise real app logic, not Three.js.
vi.mock('@/components/ThreeCanvas', () => ({ ThreeCanvas: () => null }))
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  )
}

afterEach(async () => {
  await clearTransientStorage()
  localStorage.clear()
})

describe('App', () => {
  it('renders the hero and the dropzone on first load', () => {
    renderApp()
    expect(screen.getByText(/turn lecture chaos into/i)).toBeInTheDocument()
    expect(screen.getByText(/drag & drop lecture notes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /synthesize & generate notes/i })).toBeInTheDocument()
  })

  it('generates a demo study package end-to-end and shows the results studio', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: /synthesize & generate notes/i }))

    expect(await screen.findByText(/one-glance summary/i, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText(/tl;dr/i)).toBeInTheDocument()
  })

  it('shows Clear Workspace after generating, and clears results when clicked', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.queryByText('Clear Workspace')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /synthesize & generate notes/i }))
    await screen.findByText(/one-glance summary/i, {}, { timeout: 3000 })

    await user.click(screen.getByText('Clear Workspace'))
    await waitFor(() => expect(screen.queryByText(/one-glance summary/i)).not.toBeInTheDocument())
  })

  it('opens Settings from the header', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByTitle('Settings'))
    expect(await screen.findByText('Settings')).toBeInTheDocument()
    expect(screen.getByText(/gemini api key/i)).toBeInTheDocument()
  })
})
