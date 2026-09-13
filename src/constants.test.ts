import { describe, it, expect } from 'vitest'
import { subjectLabel, levelLabel } from './constants'

describe('subjectLabel', () => {
  it('resolves a known subject id to its display label', () => {
    expect(subjectLabel('medicine', '')).toBe('Medicine & Bio')
  })

  it('uses the trimmed custom label when id is "custom"', () => {
    expect(subjectLabel('custom', '  Organic Chemistry  ')).toBe('Organic Chemistry')
  })

  it('falls back to "General Studies" for an empty custom label', () => {
    expect(subjectLabel('custom', '   ')).toBe('General Studies')
  })
})

describe('levelLabel', () => {
  it('resolves a known level id to its display label', () => {
    expect(levelLabel('exam-cram')).toBe('Exam Cram')
  })
})
