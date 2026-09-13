import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ClipboardCheck, Download, Layers, Sparkles } from 'lucide-react'
import type { StudyPackage } from '@/types'
import { cn } from '@/lib/cn'
import { QuizView } from '@/components/QuizView'
import { ExportModal } from '@/components/ExportModal'

interface ResultsStudioProps {
  data: StudyPackage
}

type TabId = 'summary' | 'notes' | 'quiz'

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: 'summary', label: 'One-Glance Summary', icon: Sparkles },
  { id: 'notes', label: 'Deep Revision Notes', icon: BookOpen },
  { id: 'quiz', label: 'Practice Quiz', icon: ClipboardCheck },
]

function SummaryTab({ data }: { data: StudyPackage }) {
  return (
    <div className="space-y-5">
      <div className="glass-card specular-border p-4 sm:p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">TL;DR</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {data.summary.tldr}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Core Takeaways
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.summary.coreTakeaways.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-pill flex items-start gap-2 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300"
            >
              <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span className="min-w-0 break-words">{t}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {data.summary.vitalConcepts.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Vital Concepts
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.summary.vitalConcepts.map((c, i) => (
              <div key={i} className="glass-card specular-border min-w-0 p-3.5">
                <p className="break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{c.term}</p>
                <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-400">{c.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NotesTab({ data }: { data: StudyPackage }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{data.revisionNotes.title}</h3>
      {data.revisionNotes.sections.map((section, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="glass-card specular-border overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">
                {section.heading}
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-slate-400">
                ▾
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/40 px-4 py-3 dark:border-white/10">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {section.content}
                    </p>
                    {section.keyPoints.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {section.keyPoints.map((point, pIdx) => (
                          <li
                            key={pIdx}
                            className="break-words rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export function ResultsStudio({ data }: ResultsStudioProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="glass-panel specular-border p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-full bg-black/5 p-1 dark:bg-white/5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm',
                  isActive ? 'text-slate-800' : 'text-slate-600 hover:text-slate-800 dark:text-slate-300',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-tab-bg"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 to-orange-200"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setExportOpen(true)}
          className="glass-pill flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'summary' && <SummaryTab data={data} />}
          {activeTab === 'notes' && <NotesTab data={data} />}
          {activeTab === 'quiz' && <QuizView questions={data.quiz} />}
        </motion.div>
      </AnimatePresence>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} data={data} />
    </div>
  )
}
