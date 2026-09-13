import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ToastMessage } from '@/types'

interface ToastContextValue {
  toasts: ToastMessage[]
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setToasts((prev) => [...prev, { ...toast, id }])
      setTimeout(() => dismissToast(id), 5500)
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>{children}</ToastContext.Provider>
  )
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used within a ToastProvider')
  return ctx
}
