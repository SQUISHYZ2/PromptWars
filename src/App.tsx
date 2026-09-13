import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Backdrop } from '@/components/Backdrop'
import { Header } from '@/components/Header'
import { Dropzone } from '@/components/Dropzone'
import { PersonalizationBar } from '@/components/PersonalizationBar'
import { ActionBar } from '@/components/ActionBar'
import { ResultsStudio } from '@/components/ResultsStudio'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { ToastStack } from '@/components/ToastStack'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useTheme } from '@/hooks/useTheme'
import { useToasts } from '@/hooks/useToasts'
import { useFileManager } from '@/hooks/useFileManager'
import { generateStudyPackage } from '@/services/aiService'
import { clearTransientStorage, loadTransient, saveTransient } from '@/services/storage'
import { API_KEY_STORAGE_KEY, SESSION_STORAGE_KEY, levelLabel, subjectLabel } from '@/constants'
import type { DepthId, GenerationStep, LevelId, StudyPackage, SubjectId } from '@/types'

const ThreeCanvas = lazy(() =>
  import('@/components/ThreeCanvas')
    .then((m) => ({ default: m.ThreeCanvas }))
    .catch(() => ({ default: () => <></> })),
)

interface PersistedSession {
  studyPackage: StudyPackage
  subject: SubjectId
  customSubjectLabel: string
  level: LevelId
  depth: DepthId
}

function AppInner() {
  const { mode: themeMode, setMode: setThemeMode } = useTheme()
  const { pushToast } = useToasts()
  const { files, addFiles, removeFile, clearFiles, totalWordCount, combinedText } = useFileManager()

  const [subject, setSubject] = useState<SubjectId>('computer-science')
  const [customSubjectLabel, setCustomSubjectLabel] = useState('')
  const [level, setLevel] = useState<LevelId>('undergrad')
  const [depth, setDepth] = useState<DepthId>('comprehensive')
  const [focusGoal, setFocusGoal] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [useMock, setUseMock] = useState(true)

  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle')
  const [studyPackage, setStudyPackage] = useState<StudyPackage | null>(null)

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY)
      if (savedKey) {
        setApiKey(savedKey)
        setUseMock(false)
      }
    } catch {
      // localStorage unavailable — user can still paste a key for this session.
    }

    loadTransient<PersistedSession>(SESSION_STORAGE_KEY).then((session) => {
      if (session) {
        setStudyPackage(session.studyPackage)
        setSubject(session.subject)
        setCustomSubjectLabel(session.customSubjectLabel)
        setLevel(session.level)
        setDepth(session.depth)
        setGenerationStep('done')
        pushToast({ kind: 'info', title: 'Restored your last session', description: 'Pick up right where you left off.' })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApiKeyChange = (key: string) => {
    setApiKey(key)
    try {
      if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key)
      else localStorage.removeItem(API_KEY_STORAGE_KEY)
    } catch {
      // best-effort persistence only
    }
  }

  const handleGenerate = async () => {
    const resolvedSubjectLabel = subjectLabel(subject, customSubjectLabel)
    const resolvedLevelLabel = levelLabel(level)

    if (!combinedText.trim() && useMock) {
      pushToast({
        kind: 'info',
        title: 'No documents added',
        description: 'Generating a demo package so you can preview the experience.',
      })
    }

    setGenerationStep('parsing')
    await new Promise((r) => setTimeout(r, 450))
    setGenerationStep('extracting')
    await new Promise((r) => setTimeout(r, 400))
    setGenerationStep('generating')

    const { data, usedMock, error } = await generateStudyPackage({
      sourceText: combinedText,
      subjectLabel: resolvedSubjectLabel,
      levelLabel: resolvedLevelLabel,
      depth,
      focusGoal,
      apiKey,
      useMock,
    })

    setStudyPackage(data)
    setGenerationStep('done')

    if (error) {
      pushToast({
        kind: 'warning',
        title: 'Gemini API unavailable — used offline demo data instead',
        description: error,
      })
    } else if (usedMock) {
      pushToast({ kind: 'success', title: 'Demo study package generated' })
    } else {
      pushToast({ kind: 'success', title: 'Study package generated with Gemini' })
    }

    await saveTransient<PersistedSession>(SESSION_STORAGE_KEY, {
      studyPackage: data,
      subject,
      customSubjectLabel,
      level,
      depth,
    })
  }

  const handleClearWorkspace = async () => {
    clearFiles()
    setStudyPackage(null)
    setGenerationStep('idle')
    await clearTransientStorage()
    pushToast({ kind: 'info', title: 'Workspace cleared', description: 'All session data has been wiped from this device.' })
  }

  const hasContent = files.length > 0 || studyPackage !== null

  return (
    <div className="relative min-h-screen px-4 pb-16 pt-4 sm:px-6 lg:px-10">
      <Backdrop />
      <ToastStack />

      <div className="relative z-10 mx-auto max-w-5xl">
        <Header
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          onOpenSettings={() => setSettingsOpen(true)}
          onClearWorkspace={handleClearWorkspace}
          hasContent={hasContent}
        />

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10 flex h-[320px] flex-col items-center justify-center overflow-hidden text-center sm:h-[360px]"
        >
          <Suspense fallback={null}>
            <ThreeCanvas />
          </Suspense>
          <span className="glass-pill mb-4 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
            Prompt Wars Hackathon · Google for Developers × Hack2Skill × Android Club VIT Bhopal
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
            Turn lecture chaos into <span className="text-gradient">exam confidence</span> in 30 seconds.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Upload your notes, slides, or textbooks. Get a summary, revision guide, and practice quiz — exportable
            anywhere, works fully offline.
          </p>
        </motion.section>

        <div className="space-y-6">
          <Dropzone files={files} onFilesAdded={addFiles} onRemoveFile={removeFile} totalWordCount={totalWordCount} />

          <PersonalizationBar
            subject={subject}
            onSubjectChange={setSubject}
            customSubjectLabel={customSubjectLabel}
            onCustomSubjectLabelChange={setCustomSubjectLabel}
            level={level}
            onLevelChange={setLevel}
            depth={depth}
            onDepthChange={setDepth}
            focusGoal={focusGoal}
            onFocusGoalChange={setFocusGoal}
          />

          <ActionBar step={generationStep} disabled={false} onGenerate={handleGenerate} />

          {studyPackage && <ResultsStudio data={studyPackage} />}
        </div>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        useMock={useMock}
        onUseMockChange={setUseMock}
      />
    </div>
  )
}

export default function App() {
  const { pushToast } = useToasts()
  return (
    <ErrorBoundary onSwitchToDemoMode={() => pushToast({ kind: 'info', title: 'Demo Mode ready — generate below' })}>
      <AppInner />
    </ErrorBoundary>
  )
}
