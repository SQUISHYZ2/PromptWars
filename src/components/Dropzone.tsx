import { useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  X,
} from 'lucide-react'
import type { ManagedFile } from '@/types'
import { cn } from '@/lib/cn'
import { ACCEPTED_EXTENSIONS, getExtension } from '@/services/fileParser'

interface DropzoneProps {
  files: ManagedFile[]
  onFilesAdded: (files: FileList | File[]) => void
  onRemoveFile: (id: string) => void
  totalWordCount: number
}

function fileIcon(name: string) {
  const ext = getExtension(name)
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return FileImage
  if (['.pptx'].includes(ext)) return FileSpreadsheet
  return FileText
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_LABEL: Record<ManagedFile['status'], string> = {
  reading: 'Reading…',
  extracted: 'Extracted',
  ready: 'Ready',
  error: 'Failed',
}

export function Dropzone({ files, onFilesAdded, onRemoveFile, totalWordCount }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) onFilesAdded(e.dataTransfer.files)
  }

  return (
    <div className="glass-panel specular-border p-5 sm:p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging
            ? 'border-sky-400 bg-sky-400/10'
            : 'border-slate-300/60 hover:border-sky-400/60 hover:bg-sky-400/5 dark:border-white/15',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFilesAdded(e.target.files)
            e.target.value = ''
          }}
        />
        <motion.div
          animate={{ y: isDragging ? -6 : 0 }}
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/15"
        >
          <UploadCloud className="h-7 w-7 text-sky-500" />
        </motion.div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Drag &amp; drop lecture notes, slides, or textbooks
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          PDF · DOCX · PPTX · TXT · MD · Images — up to 25MB each
        </p>
      </div>

      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {files.map((file) => {
              const Icon = fileIcon(file.name)
              return (
                <motion.div
                  layout
                  key={file.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="glass-pill flex items-center gap-3 px-3 py-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatSize(file.size)}
                      {file.status === 'ready' && ` · ${file.wordCount.toLocaleString()} words`}
                      {file.error && ` · ${file.error}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      file.status === 'ready' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                      file.status === 'reading' && 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
                      file.status === 'error' && 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {file.status === 'reading' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {file.status === 'ready' && <CheckCircle2 className="h-3 w-3" />}
                    {file.status === 'error' && <AlertCircle className="h-3 w-3" />}
                    {STATUS_LABEL[file.status]}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFile(file.id)
                    }}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{files.length} file{files.length !== 1 ? 's' : ''} added</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {totalWordCount.toLocaleString()} words extracted
          </span>
        </div>
      )}
    </div>
  )
}
