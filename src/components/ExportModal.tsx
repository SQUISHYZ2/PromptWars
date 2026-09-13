import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardCopy, FileDown, Loader2, Presentation, X } from 'lucide-react'
import type { StudyPackage } from '@/types'
import type { ExportSections } from '@/services/exportService'
import { useToasts } from '@/hooks/useToasts'
import { useEscapeToClose } from '@/hooks/useEscapeToClose'
import { cn } from '@/lib/cn'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  data: StudyPackage
}

type ExportKind = 'pdf' | 'docx' | 'pptx' | 'markdown'

const SECTION_LABELS: { key: keyof ExportSections; label: string }[] = [
  { key: 'summary', label: 'One-Glance Summary' },
  { key: 'notes', label: 'Deep Revision Notes' },
  { key: 'quiz', label: 'Practice Quiz' },
]

export function ExportModal({ open, onClose, data }: ExportModalProps) {
  const [sections, setSections] = useState<ExportSections>({ summary: true, notes: true, quiz: true })
  const [loading, setLoading] = useState<ExportKind | null>(null)
  const { pushToast } = useToasts()
  useEscapeToClose(open, onClose)

  const toggleSection = (key: keyof ExportSections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const anySelected = Object.values(sections).some(Boolean)

  const runExport = async (kind: ExportKind) => {
    setLoading(kind)
    try {
      const svc = await import('@/services/exportService')
      switch (kind) {
        case 'pdf':
          svc.exportToPdf(data, sections)
          break
        case 'docx':
          await svc.exportToDocx(data, sections)
          break
        case 'pptx':
          await svc.exportToPptx(data, sections)
          break
        case 'markdown':
          await svc.copyMarkdownToClipboard(data, sections)
          pushToast({ kind: 'success', title: 'Markdown copied to clipboard' })
          setLoading(null)
          return
      }
      pushToast({ kind: 'success', title: `${kind.toUpperCase()} export ready`, description: 'Check your downloads folder.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      pushToast({ kind: 'error', title: `Export failed`, description: message })
    } finally {
      setLoading(null)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel specular-border w-full max-w-md p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Export Study Package</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close export dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Include sections
            </p>
            <div className="mb-5 flex flex-wrap gap-2">
              {SECTION_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key)}
                  className={cn(
                    'glass-pill px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300',
                    sections[key] && 'chip-active',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <ExportButton
                icon={FileDown}
                label="PDF"
                loading={loading === 'pdf'}
                disabled={!anySelected}
                onClick={() => runExport('pdf')}
              />
              <ExportButton
                icon={FileDown}
                label="Word (.docx)"
                loading={loading === 'docx'}
                disabled={!anySelected}
                onClick={() => runExport('docx')}
              />
              <ExportButton
                icon={Presentation}
                label="Slides (.pptx)"
                loading={loading === 'pptx'}
                disabled={!anySelected}
                onClick={() => runExport('pptx')}
              />
              <ExportButton
                icon={ClipboardCopy}
                label="Copy Markdown"
                loading={loading === 'markdown'}
                disabled={!anySelected}
                onClick={() => runExport('markdown')}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ExportButton({
  icon: Icon,
  label,
  loading,
  disabled,
  onClick,
}: {
  icon: typeof FileDown
  label: string
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'glass-card specular-border flex flex-col items-center justify-center gap-1.5 px-3 py-4 text-xs font-semibold text-slate-600 transition hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10',
        (disabled || loading) && 'cursor-not-allowed opacity-50',
      )}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin text-sky-500" /> : <Icon className="h-5 w-5 text-sky-500" />}
      {label}
    </button>
  )
}
