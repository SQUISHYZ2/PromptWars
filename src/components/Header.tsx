import { Download, Monitor, Moon, Settings, Sparkles, Sun, Trash2 } from 'lucide-react'
import type { ThemeMode } from '@/types'
import { cn } from '@/lib/cn'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

interface HeaderProps {
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
  onOpenSettings: () => void
  onClearWorkspace: () => void
  hasContent: boolean
}

const THEME_ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'system']

export function Header({ themeMode, onThemeModeChange, onOpenSettings, onClearWorkspace, hasContent }: HeaderProps) {
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const ThemeIcon = THEME_ICONS[themeMode]

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(themeMode)
    onThemeModeChange(THEME_ORDER[(idx + 1) % THEME_ORDER.length])
  }

  return (
    <header className="sticky top-0 z-40 mb-6">
      <div className="glass-panel specular-border flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="glow-cta flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-violet-400 to-fuchsia-400">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">StudySphere AI</p>
            <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
              Lecture chaos → exam confidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {canInstall && !installed && (
            <button
              onClick={promptInstall}
              className="glass-pill hidden items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10 sm:flex"
            >
              <Download className="h-3.5 w-3.5" /> Install App
            </button>
          )}
          {hasContent && (
            <button
              onClick={onClearWorkspace}
              title="Clear Session & Wipe Cache"
              className="glass-pill flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10 sm:px-3"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear Workspace</span>
            </button>
          )}
          <button
            onClick={cycleTheme}
            title={`Theme: ${themeMode}`}
            className={cn('glass-pill flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10')}
          >
            <ThemeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="glass-pill flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
