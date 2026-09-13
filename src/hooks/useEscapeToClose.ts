import { useEffect } from 'react'

/** Closes an open modal/drawer on Escape — standard a11y expectation for any dialog. */
export function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])
}
