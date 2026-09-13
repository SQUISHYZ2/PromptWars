import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import type { GenerationStep } from '@/types'
import { cn } from '@/lib/cn'

interface ActionBarProps {
  step: GenerationStep
  disabled: boolean
  onGenerate: () => void
}

const STEPS: { key: GenerationStep; label: string }[] = [
  { key: 'parsing', label: 'Parsing documents' },
  { key: 'extracting', label: 'Extracting core themes' },
  { key: 'generating', label: 'Generating notes & quiz' },
]

export function ActionBar({ step, disabled, onGenerate }: ActionBarProps) {
  const isRunning = step === 'parsing' || step === 'extracting' || step === 'generating'
  const activeIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: disabled || isRunning ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isRunning ? 1 : 0.98 }}
        onClick={onGenerate}
        disabled={disabled || isRunning}
        className={cn(
          'glow-cta shimmer relative flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white transition',
          (disabled || isRunning) && 'cursor-not-allowed opacity-60',
        )}
      >
        {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        {isRunning ? 'Synthesizing…' : 'Synthesize & Generate Notes'}
      </motion.button>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
        >
          {STEPS.map((s, i) => {
            const isDone = i < activeIndex
            const isActive = i === activeIndex
            return (
              <span key={s.key} className={cn('flex items-center gap-1.5', isActive && 'font-semibold text-sky-600 dark:text-sky-400')}>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
                )}
                [{i + 1}/3] {s.label}…
              </span>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
