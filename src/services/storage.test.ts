import { describe, it, expect, vi, afterEach } from 'vitest'
import { saveTransient, loadTransient, clearTransientStorage, listTransientKeys } from './storage'

afterEach(async () => {
  await clearTransientStorage()
  vi.restoreAllMocks()
})

describe('saveTransient / loadTransient', () => {
  it('round-trips a value before it expires', async () => {
    await saveTransient('session', { foo: 'bar' })
    expect(await loadTransient('session')).toEqual({ foo: 'bar' })
  })

  it('returns undefined for a key that was never saved', async () => {
    expect(await loadTransient('missing-key')).toBeUndefined()
  })

  it('expires a value once its TTL has elapsed', async () => {
    const realNow = Date.now()
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(realNow)

    await saveTransient('short-lived', 'value', 1000) // 1s TTL
    expect(await loadTransient('short-lived')).toBe('value')

    nowSpy.mockReturnValue(realNow + 2000) // advance 2s, past the TTL
    expect(await loadTransient('short-lived')).toBeUndefined()
  })

  it('removes the expired entry so it does not linger in storage', async () => {
    const realNow = Date.now()
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(realNow)
    await saveTransient('to-expire', 'value', 500)
    nowSpy.mockReturnValue(realNow + 1000)
    await loadTransient('to-expire') // triggers cleanup
    expect(await listTransientKeys()).not.toContain('to-expire')
  })
})

describe('clearTransientStorage', () => {
  it('wipes every saved key', async () => {
    await saveTransient('a', 1)
    await saveTransient('b', 2)
    expect((await listTransientKeys()).length).toBeGreaterThanOrEqual(2)

    await clearTransientStorage()
    expect(await listTransientKeys()).toHaveLength(0)
  })
})
