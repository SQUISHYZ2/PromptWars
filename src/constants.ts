import type { DepthId, Level, LevelId, Subject, SubjectId } from '@/types'

export const SUBJECTS: Subject[] = [
  { id: 'computer-science', label: 'Computer Science' },
  { id: 'medicine', label: 'Medicine & Bio' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'law-humanities', label: 'Law & Humanities' },
  { id: 'business', label: 'Business' },
  { id: 'custom', label: 'Custom' },
]

export const LEVELS: Level[] = [
  { id: 'high-school', label: 'High School' },
  { id: 'undergrad', label: 'Undergrad' },
  { id: 'exam-cram', label: 'Exam Cram' },
]

export const DEPTHS: { id: DepthId; label: string; description: string }[] = [
  { id: 'quick', label: 'Quick Cram', description: 'Key concepts only' },
  { id: 'comprehensive', label: 'Comprehensive', description: 'Deep revision' },
]

export function subjectLabel(id: SubjectId, customLabel: string): string {
  if (id === 'custom') return customLabel.trim() || 'General Studies'
  return SUBJECTS.find((s) => s.id === id)?.label ?? 'General Studies'
}

export function levelLabel(id: LevelId): string {
  return LEVELS.find((l) => l.id === id)?.label ?? 'Undergrad'
}

export const SESSION_STORAGE_KEY = 'studysphere-session-v1'
export const API_KEY_STORAGE_KEY = 'studysphere-gemini-api-key'
