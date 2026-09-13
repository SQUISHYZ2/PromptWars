import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileManager } from './useFileManager'
import { ToastProvider } from '@/hooks/useToasts'
import * as fileParser from '@/services/fileParser'

vi.mock('@/services/fileParser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/fileParser')>()
  return { ...actual, parseFile: vi.fn() }
})

const parseFile = vi.mocked(fileParser.parseFile)

function makeFile(name: string, size = 1024, type = 'text/plain') {
  return new File(['x'.repeat(size)], name, { type })
}

beforeEach(() => {
  parseFile.mockReset()
})

describe('useFileManager', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })
    expect(result.current.files).toHaveLength(0)
    expect(result.current.totalWordCount).toBe(0)
  })

  it('rejects unsupported file types without adding them', () => {
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })
    act(() => result.current.addFiles([makeFile('virus.exe')]))
    expect(result.current.files).toHaveLength(0)
  })

  it('rejects files over the 25MB limit', () => {
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })
    const tooBig = makeFile('huge.txt', 1)
    Object.defineProperty(tooBig, 'size', { value: 26 * 1024 * 1024 })
    act(() => result.current.addFiles([tooBig]))
    expect(result.current.files).toHaveLength(0)
  })

  it('adds an accepted file in "reading" status, then resolves to "ready"', async () => {
    parseFile.mockResolvedValue({ text: 'hello world' })
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })

    act(() => result.current.addFiles([makeFile('notes.txt')]))
    expect(result.current.files[0].status).toBe('reading')

    await waitFor(() => expect(result.current.files[0].status).toBe('ready'))
    expect(result.current.files[0].wordCount).toBe(2)
    expect(result.current.totalWordCount).toBe(2)
  })

  it('marks a file "error" when parsing reports an error', async () => {
    parseFile.mockResolvedValue({ text: '', error: 'Corrupt PDF' })
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })

    act(() => result.current.addFiles([makeFile('bad.pdf')]))
    await waitFor(() => expect(result.current.files[0].status).toBe('error'))
    expect(result.current.files[0].error).toBe('Corrupt PDF')
  })

  it('marks a file "error" when parsing throws', async () => {
    parseFile.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })

    act(() => result.current.addFiles([makeFile('crash.pdf')]))
    await waitFor(() => expect(result.current.files[0].status).toBe('error'))
    expect(result.current.files[0].error).toBe('boom')
  })

  it('removes a file by id', async () => {
    parseFile.mockResolvedValue({ text: 'hello' })
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })
    act(() => result.current.addFiles([makeFile('notes.txt')]))
    const id = result.current.files[0].id

    act(() => result.current.removeFile(id))
    expect(result.current.files).toHaveLength(0)
  })

  it('clears all files with clearFiles', async () => {
    parseFile.mockResolvedValue({ text: 'hello' })
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })
    act(() => result.current.addFiles([makeFile('a.txt'), makeFile('b.txt')]))
    expect(result.current.files).toHaveLength(2)

    act(() => result.current.clearFiles())
    expect(result.current.files).toHaveLength(0)
  })

  it('combines ready files into one labeled text blob', async () => {
    parseFile.mockResolvedValue({ text: 'chapter one content' })
    const { result } = renderHook(() => useFileManager(), { wrapper: ToastProvider })
    act(() => result.current.addFiles([makeFile('notes.txt')]))

    await waitFor(() => expect(result.current.combinedText).toContain('chapter one content'))
    expect(result.current.combinedText).toContain('### Source: notes.txt')
  })
})
