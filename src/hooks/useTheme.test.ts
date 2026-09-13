import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('useTheme', () => {
  it('defaults to "system" when nothing is saved', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('system')
  })

  it('restores a previously saved mode from localStorage', () => {
    localStorage.setItem('studysphere-theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('dark')
  })

  it('applies the "dark" class to <html> when mode is dark', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setMode('dark'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes the "dark" class when switching to light', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setMode('dark'))
    act(() => result.current.setMode('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists the chosen mode to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setMode('dark'))
    expect(localStorage.getItem('studysphere-theme')).toBe('dark')
  })
})
