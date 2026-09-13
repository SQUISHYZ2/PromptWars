export interface StudyPackage {
  subject: string
  summary: {
    tldr: string
    coreTakeaways: string[]
    vitalConcepts: { term: string; definition: string }[]
  }
  revisionNotes: {
    title: string
    sections: { heading: string; content: string; keyPoints: string[] }[]
  }
  quiz: QuizQuestion[]
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
}

export type SubjectId =
  | 'computer-science'
  | 'medicine'
  | 'mathematics'
  | 'engineering'
  | 'law-humanities'
  | 'business'
  | 'custom'

export interface Subject {
  id: SubjectId
  label: string
}

export type LevelId = 'high-school' | 'undergrad' | 'exam-cram'

export interface Level {
  id: LevelId
  label: string
}

export type DepthId = 'quick' | 'comprehensive'

export type FileStatus = 'reading' | 'extracted' | 'ready' | 'error'

export interface ManagedFile {
  id: string
  name: string
  size: number
  type: string
  status: FileStatus
  extractedText: string
  wordCount: number
  error?: string
}

export type GenerationStep = 'idle' | 'parsing' | 'extracting' | 'generating' | 'done' | 'error'

export interface ToastMessage {
  id: string
  kind: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
