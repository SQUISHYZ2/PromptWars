import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredEvent(e as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setDeferredEvent(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return false
    await deferredEvent.prompt()
    const choice = await deferredEvent.userChoice
    setDeferredEvent(null)
    return choice.outcome === 'accepted'
  }, [deferredEvent])

  return { canInstall: Boolean(deferredEvent), installed, promptInstall }
}
