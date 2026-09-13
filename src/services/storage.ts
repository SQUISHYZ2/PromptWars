import { clear, del, get, keys, set } from 'idb-keyval'

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 2 // 2 hours

interface TTLEntry<T> {
  value: T
  expiresAt: number
}

/** Save a value transiently. It self-expires and is skipped on read after `ttlMs`. */
export async function saveTransient<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  try {
    const entry: TTLEntry<T> = { value, expiresAt: Date.now() + ttlMs }
    await set(key, entry)
  } catch {
    // IndexedDB unavailable (private browsing, quota, etc.) — fail silently, app stays in-memory.
  }
}

export async function loadTransient<T>(key: string): Promise<T | undefined> {
  try {
    const entry = (await get(key)) as TTLEntry<T> | undefined
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      await del(key)
      return undefined
    }
    return entry.value
  } catch {
    return undefined
  }
}

/** Wipes every transient session key so no student data lingers on the device. */
export async function clearTransientStorage(): Promise<void> {
  try {
    await clear()
  } catch {
    // best-effort
  }
}

export async function listTransientKeys(): Promise<IDBValidKey[]> {
  try {
    return await keys()
  } catch {
    return []
  }
}
