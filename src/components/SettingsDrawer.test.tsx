import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsDrawer } from './SettingsDrawer'

function renderDrawer(overrides: Partial<React.ComponentProps<typeof SettingsDrawer>> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    apiKey: '',
    onApiKeyChange: vi.fn(),
    useMock: true,
    onUseMockChange: vi.fn(),
    ...overrides,
  }
  render(<SettingsDrawer {...props} />)
  return props
}

describe('SettingsDrawer', () => {
  it('renders nothing when closed', () => {
    renderDrawer({ open: false })
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('renders into document.body via a portal', () => {
    renderDrawer({ open: true })
    const heading = screen.getByText('Settings')
    expect(document.body.contains(heading)).toBe(true)
  })

  it('closes when the close button is clicked', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()
    await user.click(screen.getByLabelText('Close settings'))
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()
    await user.keyboard('{Escape}')
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('toggles Demo Mode via onUseMockChange', async () => {
    const user = userEvent.setup()
    const props = renderDrawer({ useMock: true })
    await user.click(screen.getByText('Demo Mode: ON'))
    expect(props.onUseMockChange).toHaveBeenCalledWith(false)
  })

  it('shows the shared-AI hint when Demo Mode is off and no key is set', () => {
    renderDrawer({ useMock: false, apiKey: '' })
    expect(screen.getByText("Using StudySphere's shared AI")).toBeInTheDocument()
  })

  it('shows the personal-key hint once a key is entered', () => {
    renderDrawer({ useMock: false, apiKey: 'AIzaSomeKey' })
    expect(screen.getByText('Using your Gemini API key')).toBeInTheDocument()
    expect(screen.getByText(/key saved locally/i)).toBeInTheDocument()
  })

  it('reports typed API key text via onApiKeyChange', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()
    await user.type(screen.getByPlaceholderText('AIza...'), 'x')
    expect(props.onApiKeyChange).toHaveBeenCalledWith('x')
  })

  it('toggles the API key field between password and text visibility', async () => {
    const user = userEvent.setup()
    renderDrawer({ apiKey: 'secret-key' })
    const input = screen.getByPlaceholderText('AIza...') as HTMLInputElement
    expect(input.type).toBe('password')

    await user.click(screen.getByLabelText('Show API key'))
    expect(input.type).toBe('text')
  })
})
