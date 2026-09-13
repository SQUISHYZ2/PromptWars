import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, ChevronDown, RotateCcw, XCircle } from 'lucide-react'
import type { QuizQuestion } from '@/types'
import { cn } from '@/lib/cn'

interface QuizViewProps {
  questions: QuizQuestion[]
}

type Answers = Record<number, number>

export function QuizView({ questions }: QuizViewProps) {
  const [answers, setAnswers] = useState<Answers>({})
  const [expandedExplanation, setExpandedExplanation] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const score = useMemo(
    () => questions.filter((q) => answers[q.id] === q.correctAnswerIndex).length,
    [answers, questions],
  )
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  const selectAnswer = (questionId: number, optionIndex: number) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
    setExpandedExplanation(questionId)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    if (score === questions.length) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#38bdf8', '#a78bfa', '#f472b6'] })
    }
  }

  const handleRetake = () => {
    setAnswers({})
    setSubmitted(false)
    setExpandedExplanation(null)
  }

  if (questions.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No quiz questions were generated.</p>
  }

  return (
    <div className="space-y-4">
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card specular-border flex items-center justify-between p-4"
        >
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              You scored {score} / {questions.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {score === questions.length
                ? 'Perfect score! You are exam-ready. 🎉'
                : 'Review the explanations below, then retake for durable recall.'}
            </p>
          </div>
          <button
            onClick={handleRetake}
            className="glass-pill flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
          </button>
        </motion.div>
      )}

      {questions.map((q, qIdx) => {
        const selected = answers[q.id]
        const isCorrect = selected === q.correctAnswerIndex
        const showFeedback = submitted || selected !== undefined

        return (
          <div key={q.id} className="glass-card specular-border p-4 sm:p-5">
            <p className="mb-3 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, optIdx) => {
                const isSelected = selected === optIdx
                const isRightAnswer = optIdx === q.correctAnswerIndex
                return (
                  <button
                    key={optIdx}
                    onClick={() => selectAnswer(q.id, optIdx)}
                    disabled={submitted}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition',
                      'border-slate-200/70 bg-white/40 dark:border-white/10 dark:bg-white/5',
                      !showFeedback && 'hover:border-sky-400/60 hover:bg-sky-400/10',
                      showFeedback && isRightAnswer && 'border-emerald-400 bg-emerald-400/15 text-emerald-700 dark:text-emerald-300',
                      showFeedback && isSelected && !isRightAnswer && 'border-rose-400 bg-rose-400/15 text-rose-700 dark:text-rose-300',
                      submitted && 'cursor-default',
                    )}
                  >
                    <span className="min-w-0 break-words">
                      <span className="mr-2 font-semibold text-slate-400">{String.fromCharCode(65 + optIdx)}.</span>
                      {option}
                    </span>
                    {showFeedback && isRightAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                    {showFeedback && isSelected && !isRightAnswer && <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                  </button>
                )
              })}
            </div>

            <AnimatePresence initial={false}>
              {selected !== undefined && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedExplanation(expandedExplanation === q.id ? null : q.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400"
                  >
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 transition-transform', expandedExplanation === q.id && 'rotate-180')}
                    />
                    {isCorrect ? 'Why this is correct' : 'Why this is wrong'}
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedExplanation === q.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 overflow-hidden break-words text-xs leading-relaxed text-slate-600 dark:text-slate-400"
                      >
                        {q.explanation}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={cn(
            'glow-cta w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600',
            !allAnswered && 'cursor-not-allowed opacity-50',
          )}
        >
          Submit Quiz
        </button>
      )}
    </div>
  )
}
