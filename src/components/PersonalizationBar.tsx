import { motion } from 'framer-motion'
import { DEPTHS, LEVELS, SUBJECTS } from '@/constants'
import type { DepthId, LevelId, SubjectId } from '@/types'
import { cn } from '@/lib/cn'

interface PersonalizationBarProps {
  subject: SubjectId
  onSubjectChange: (id: SubjectId) => void
  customSubjectLabel: string
  onCustomSubjectLabelChange: (label: string) => void
  level: LevelId
  onLevelChange: (id: LevelId) => void
  depth: DepthId
  onDepthChange: (id: DepthId) => void
  focusGoal: string
  onFocusGoalChange: (goal: string) => void
}

export function PersonalizationBar({
  subject,
  onSubjectChange,
  customSubjectLabel,
  onCustomSubjectLabelChange,
  level,
  onLevelChange,
  depth,
  onDepthChange,
  focusGoal,
  onFocusGoalChange,
}: PersonalizationBarProps) {
  return (
    <div className="glass-panel specular-border space-y-5 p-5 sm:p-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Subject
        </p>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => onSubjectChange(s.id)}
              className={cn(
                'glass-pill relative px-3.5 py-1.5 text-sm font-medium text-slate-600 transition dark:text-slate-300',
                subject === s.id && 'chip-active',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {subject === 'custom' && (
          <motion.input
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            value={customSubjectLabel}
            onChange={(e) => onCustomSubjectLabelChange(e.target.value)}
            placeholder="Name your subject (e.g. Organic Chemistry)"
            className="glass-pill mt-2 w-full max-w-sm px-3.5 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Level
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => onLevelChange(l.id)}
                className={cn(
                  'glass-pill px-3.5 py-1.5 text-sm font-medium text-slate-600 transition dark:text-slate-300',
                  level === l.id && 'chip-active',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Depth
          </p>
          <div className="flex flex-wrap gap-2">
            {DEPTHS.map((d) => (
              <button
                key={d.id}
                onClick={() => onDepthChange(d.id)}
                title={d.description}
                className={cn(
                  'glass-pill px-3.5 py-1.5 text-sm font-medium text-slate-600 transition dark:text-slate-300',
                  depth === d.id && 'chip-active',
                )}
              >
                {d.label}
                <span className="ml-1.5 text-[11px] font-normal text-slate-400">({d.description})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Focus Goal <span className="font-normal normal-case text-slate-400">(optional)</span>
        </p>
        <input
          value={focusGoal}
          onChange={(e) => onFocusGoalChange(e.target.value)}
          placeholder="e.g. Ace the midterm on Chapters 3-5"
          className="glass-pill w-full px-3.5 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
        />
      </div>
    </div>
  )
}
