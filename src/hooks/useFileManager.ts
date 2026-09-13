import { useCallback, useMemo, useState } from 'react'
import { countWords, isAcceptedFile, parseFile, MAX_FILE_SIZE_BYTES } from '@/services/fileParser'
import type { ManagedFile } from '@/types'
import { useToasts } from '@/hooks/useToasts'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useFileManager() {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const { pushToast } = useToasts()

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      if (list.length === 0) return

      const accepted: File[] = []
      for (const file of list) {
        if (!isAcceptedFile(file.name)) {
          pushToast({
            kind: 'warning',
            title: `Unsupported format: ${file.name}`,
            description: 'Accepted types: PDF, DOCX, PPTX, TXT, MD, and images.',
          })
          continue
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          pushToast({
            kind: 'warning',
            title: `${file.name} is too large`,
            description: 'Files must be under 25MB.',
          })
          continue
        }
        accepted.push(file)
      }

      if (accepted.length === 0) return

      const newEntries: ManagedFile[] = accepted.map((file) => ({
        id: makeId(),
        name: file.name,
        size: file.size,
        type: file.type || 'unknown',
        status: 'reading',
        extractedText: '',
        wordCount: 0,
      }))

      setFiles((prev) => [...prev, ...newEntries])

      newEntries.forEach((entry, idx) => {
        const file = accepted[idx]
        parseFile(file)
          .then((result) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id
                  ? {
                      ...f,
                      status: result.error ? 'error' : 'ready',
                      extractedText: result.text,
                      wordCount: countWords(result.text),
                      error: result.error,
                    }
                  : f,
              ),
            )
            if (result.error) {
              pushToast({ kind: 'error', title: `Couldn't fully read ${entry.name}`, description: result.error })
            }
          })
          .catch((err) => {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setFiles((prev) =>
              prev.map((f) => (f.id === entry.id ? { ...f, status: 'error', error: message } : f)),
            )
            pushToast({ kind: 'error', title: `Failed to parse ${entry.name}`, description: message })
          })
      })
    },
    [pushToast],
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  const totalWordCount = useMemo(
    () => files.reduce((sum, f) => sum + (f.status === 'ready' ? f.wordCount : 0), 0),
    [files],
  )

  const combinedText = useMemo(
    () =>
      files
        .filter((f) => f.status === 'ready' && f.extractedText.trim())
        .map((f) => `### Source: ${f.name}\n${f.extractedText}`)
        .join('\n\n'),
    [files],
  )

  const isBusy = files.some((f) => f.status === 'reading')
  const readyCount = files.filter((f) => f.status === 'ready').length

  return { files, addFiles, removeFile, clearFiles, totalWordCount, combinedText, isBusy, readyCount }
}
