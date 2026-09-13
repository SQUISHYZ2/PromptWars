import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'

function renderHeader(overrides: Partial<React.ComponentProps<typeof Header>> = {}) {
  const props = {
    themeMode: 'system' as const,
    onThemeModeChange: vi.fn(),
    onOpenSettings: vi.fn(),
    onClearWorkspace: vi.fn(),
    hasContent: false,
    ...overrides,
  }
  render(<Header {...props} />)
  return props
}

describe('Header', () => {
  it('cycles theme light -> dark -> system -> light on each click', async () => {
    const user = userEvent.setup()
    const props = renderHeader({ themeMode: 'light' })
    await user.click(screen.getByTitle('Theme: light'))
    expect(props.onThemeModeChange).toHaveBeenCalledWith('dark')
  })

  it('wraps from "system" back to "light"', async () => {
    const user = userEvent.setup()
    const props = renderHeader({ themeMode: 'system' })
    await user.click(screen.getByTitle('Theme: system'))
    expect(props.onThemeModeChange).toHaveBeenCalledWith('light')
  })

  it('calls onOpenSettings when the settings button is clicked', async () => {
    const user = userEvent.setup()
    const props = renderHeader()
    await user.click(screen.getByTitle('Settings'))
    expect(props.onOpenSettings).toHaveBeenCalledOnce()
  })

  it('only shows Clear Workspace when there is content', () => {
    renderHeader({ hasContent: false })
    expect(screen.queryByText('Clear Workspace')).not.toBeInTheDocument()

    renderHeader({ hasContent: true })
    expect(screen.getByText('Clear Workspace')).toBeInTheDocument()
  })

  it('calls onClearWorkspace when Clear Workspace is clicked', async () => {
    const user = userEvent.setup()
    const props = renderHeader({ hasContent: true })
    await user.click(screen.getByText('Clear Workspace'))
    expect(props.onClearWorkspace).toHaveBeenCalledOnce()
  })
})
