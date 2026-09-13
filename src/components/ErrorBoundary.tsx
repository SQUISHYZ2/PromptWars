import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCcw, Sparkles } from 'lucide-react'

interface Props {
  children: ReactNode
  onSwitchToDemoMode?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('StudySphere AI crashed:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleDemoMode = () => {
    this.props.onSwitchToDemoMode?.()
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="glass-panel specular-border max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
              <AlertOctagon className="h-7 w-7 text-rose-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Something went sideways, but your files are safe!
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred while rendering the app.'}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleRetry}
                className="glow-cta flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button
                onClick={this.handleDemoMode}
                className="glass-pill flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4" /> Switch to Demo Mode
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
