import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInstallPrompt } from './useInstallPrompt'

function dispatchBeforeInstallPrompt(overrides: Partial<{ prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }> = {}) {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = overrides.prompt ?? vi.fn().mockResolvedValue(undefined)
  event.userChoice = overrides.userChoice ?? Promise.resolve({ outcome: 'accepted' })
  window.dispatchEvent(event)
  return event
}

describe('useInstallPrompt', () => {
  it('starts with no install prompt available', () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
    expect(result.current.installed).toBe(false)
  })

  it('becomes installable after the browser fires beforeinstallprompt', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      dispatchBeforeInstallPrompt()
    })
    await waitFor(() => expect(result.current.canInstall).toBe(true))
  })

  it('resolves true and clears canInstall when the user accepts', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      dispatchBeforeInstallPrompt({ userChoice: Promise.resolve({ outcome: 'accepted' }) })
    })
    await waitFor(() => expect(result.current.canInstall).toBe(true))

    let accepted: boolean | undefined
    await act(async () => {
      accepted = await result.current.promptInstall()
    })
    expect(accepted).toBe(true)
    expect(result.current.canInstall).toBe(false)
  })

  it('marks the app installed when appinstalled fires', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    await waitFor(() => expect(result.current.installed).toBe(true))
  })
})
