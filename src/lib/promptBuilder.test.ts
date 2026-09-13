import { describe, it, expect } from 'vitest'
import { buildPrompt, normalizeStudyPackage, MAX_SOURCE_CHARS } from './promptBuilder'

describe('buildPrompt', () => {
  const baseOpts = {
    sourceText: 'Photosynthesis converts light energy into chemical energy.',
    subjectLabel: 'Medicine & Bio',
    levelLabel: 'Undergrad',
    depth: 'quick' as const,
  }

  it('includes the subject, level, and source material', () => {
    const prompt = buildPrompt(baseOpts)
    expect(prompt).toContain('Medicine & Bio')
    expect(prompt).toContain('Undergrad')
    expect(prompt).toContain('Photosynthesis converts light energy')
  })

  it('includes the focus goal only when provided', () => {
    expect(buildPrompt(baseOpts)).not.toContain('specific focus goal')
    expect(buildPrompt({ ...baseOpts, focusGoal: 'Ace the midterm' })).toContain('Ace the midterm')
  })

  it('gives quick-cram and comprehensive depths different instructions', () => {
    const quick = buildPrompt(baseOpts)
    const comprehensive = buildPrompt({ ...baseOpts, depth: 'comprehensive' })
    expect(quick).toContain('Keep it tight')
    expect(comprehensive).toContain('Go deep')
    expect(quick).not.toBe(comprehensive)
  })

  it('truncates source material to MAX_SOURCE_CHARS', () => {
    const longText = 'a'.repeat(MAX_SOURCE_CHARS + 5_000)
    const prompt = buildPrompt({ ...baseOpts, sourceText: longText })
    // The embedded excerpt itself should never exceed the cap, even though
    // the surrounding prompt text pushes the total prompt length higher.
    const excerpt = prompt.split('"""')[1].trim()
    expect(excerpt.length).toBeLessThanOrEqual(MAX_SOURCE_CHARS)
  })
})

describe('normalizeStudyPackage', () => {
  it('fills in safe fallbacks for a completely empty response', () => {
    const result = normalizeStudyPackage(null, 'Computer Science')
    expect(result.subject).toBe('Computer Science')
    expect(result.summary.tldr).toBe('Summary unavailable.')
    expect(result.summary.coreTakeaways.length).toBeGreaterThan(0)
    expect(result.revisionNotes.title).toContain('Computer Science')
    expect(result.quiz).toEqual([])
  })

  it('preserves valid fields instead of overwriting them', () => {
    const result = normalizeStudyPackage(
      { subject: 'Physics', summary: { tldr: 'Real summary', coreTakeaways: ['A'], vitalConcepts: [] } },
      'Fallback Subject',
    )
    expect(result.subject).toBe('Physics')
    expect(result.summary.tldr).toBe('Real summary')
  })

  it('pads quiz options to exactly 4 and backfills missing ids', () => {
    const result = normalizeStudyPackage(
      {
        quiz: [
          { id: 0, question: 'Q1', options: ['A', 'B'], correctAnswerIndex: 0, explanation: 'because' },
        ],
      },
      'Subject',
    )
    expect(result.quiz[0].options).toHaveLength(4)
    expect(result.quiz[0].id).toBe(0)
  })
})
