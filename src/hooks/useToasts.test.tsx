import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ToastProvider, useToasts } from './useToasts'

afterEach(() => {
  vi.useRealTimers()
})

describe('useToasts', () => {
  it('throws when used outside a ToastProvider', () => {
    // Suppress React's expected error-boundary-style console noise for this assertion.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useToasts())).toThrow(/must be used within a ToastProvider/)
    consoleSpy.mockRestore()
  })

  it('adds a toast with pushToast and removes it with dismissToast', () => {
    const { result } = renderHook(() => useToasts(), { wrapper: ToastProvider })

    act(() => result.current.pushToast({ kind: 'success', title: 'Saved' }))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Saved')

    act(() => result.current.dismissToast(result.current.toasts[0].id))
    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-dismisses a toast after its timeout', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToasts(), { wrapper: ToastProvider })

    act(() => result.current.pushToast({ kind: 'info', title: 'Heads up' }))
    expect(result.current.toasts).toHaveLength(1)

    act(() => vi.advanceTimersByTime(6000))
    expect(result.current.toasts).toHaveLength(0)
  })

  it('assigns each toast a unique id', () => {
    const { result } = renderHook(() => useToasts(), { wrapper: ToastProvider })
    act(() => {
      result.current.pushToast({ kind: 'info', title: 'One' })
      result.current.pushToast({ kind: 'info', title: 'Two' })
    })
    const ids = result.current.toasts.map((t) => t.id)
    expect(new Set(ids).size).toBe(2)
  })
})
