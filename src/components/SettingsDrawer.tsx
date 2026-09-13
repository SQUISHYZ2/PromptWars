import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useEscapeToClose } from '@/hooks/useEscapeToClose'
import { cn } from '@/lib/cn'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  apiKey: string
  onApiKeyChange: (key: string) => void
  useMock: boolean
  onUseMockChange: (value: boolean) => void
}

export function SettingsDrawer({
  open,
  onClose,
  apiKey,
  onApiKeyChange,
  useMock,
  onUseMockChange,
}: SettingsDrawerProps) {
  const [showKey, setShowKey] = useState(false)
  useEscapeToClose(open, onClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel specular-border my-8 w-full max-w-sm p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Settings</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="glass-card specular-border mb-5 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Demo / Offline Mode</p>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Generate realistic study packages instantly, no API key or internet required. Great for judging.
              </p>
              <button
                onClick={() => onUseMockChange(!useMock)}
                className={cn(
                  'mt-3 flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                  useMock
                    ? 'bg-gradient-to-r from-sky-200 to-orange-200 text-slate-800'
                    : 'glass-pill text-slate-600 dark:text-slate-300',
                )}
              >
                {useMock ? 'Demo Mode: ON' : 'Demo Mode: OFF'}
                <span className="text-xs font-normal opacity-80">
                  {useMock ? 'Using mock generator' : apiKey ? 'Using your Gemini API key' : "Using StudySphere's shared AI"}
                </span>
              </button>
            </div>

            <div className="glass-card specular-border p-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-sky-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Gemini API Key <span className="font-normal text-slate-400">(optional)</span>
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Leave this blank to use StudySphere's built-in AI (shared, rate-limited). Paste your own key for
                unlimited personal use — it's stored only in this browser's local storage and sent directly to
                Google's API, never to any StudySphere server.
              </p>
              <div className="relative mt-3">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="AIza..."
                  className="glass-pill w-full px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {apiKey && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Key saved locally
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
