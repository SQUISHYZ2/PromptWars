import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToasts } from '@/hooks/useToasts'
import { cn } from '@/lib/cn'

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

const ACCENTS = {
  info: 'text-sky-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-rose-500',
}

export function ToastStack() {
  const { toasts, dismissToast } = useToasts()

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind]
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className="glass-panel specular-border pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ACCENTS[toast.kind])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
