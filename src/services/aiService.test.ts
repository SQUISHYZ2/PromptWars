import { describe, it, expect } from 'vitest'
import { generateMockStudyPackage, type GenerateOptions } from './aiService'

const baseOpts: GenerateOptions = {
  sourceText: '',
  subjectLabel: 'Computer Science',
  levelLabel: 'Undergrad',
  depth: 'quick',
  useMock: true,
}

describe('generateMockStudyPackage', () => {
  it('produces the right number of quiz questions and sections per depth', () => {
    const quick = generateMockStudyPackage({ ...baseOpts, depth: 'quick' })
    const comprehensive = generateMockStudyPackage({ ...baseOpts, depth: 'comprehensive' })

    expect(quick.quiz).toHaveLength(4)
    expect(quick.revisionNotes.sections).toHaveLength(3)
    expect(comprehensive.quiz).toHaveLength(5)
    expect(comprehensive.revisionNotes.sections).toHaveLength(5)
  })

  it('gives every quiz question exactly 4 options and a valid correct answer index', () => {
    const pkg = generateMockStudyPackage(baseOpts)
    for (const q of pkg.quiz) {
      expect(q.options).toHaveLength(4)
      expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctAnswerIndex).toBeLessThan(4)
      expect(q.options[q.correctAnswerIndex]).toBeTruthy()
      expect(q.explanation.length).toBeGreaterThan(0)
    }
  })

  it('falls back to subject-template content when no source text is given', () => {
    const pkg = generateMockStudyPackage(baseOpts)
    expect(pkg.summary.vitalConcepts.length).toBeGreaterThan(0)
    expect(pkg.subject).toBe('Computer Science')
  })

  it('builds revision notes directly from uploaded source text when provided', () => {
    const sourceText =
      'Cellular respiration converts glucose into usable energy for the cell. ' +
      'It occurs in the mitochondria across three main stages.\n\n' +
      'Glycolysis breaks down glucose into pyruvate in the cytoplasm without needing oxygen. ' +
      'It yields a small net gain of ATP.\n\n' +
      'The citric acid cycle further oxidizes pyruvate derivatives in the mitochondrial matrix, ' +
      'releasing carbon dioxide and generating electron carriers.'

    const pkg = generateMockStudyPackage({ ...baseOpts, subjectLabel: 'Medicine & Bio', sourceText })
    expect(pkg.summary.tldr).toContain('Cellular respiration')
    // At least one section heading should be derived from the actual source material.
    expect(pkg.revisionNotes.sections.some((s) => /glycolysis/i.test(s.heading) || /respiration/i.test(s.heading))).toBe(
      true,
    )
  })

  it('never leaks the internal "### Source:" file markers into generated text', () => {
    const pkg = generateMockStudyPackage({
      ...baseOpts,
      sourceText: '### Source: notes.pdf\nGlycolysis occurs in the cytoplasm and requires no oxygen to proceed.',
    })
    expect(pkg.summary.tldr).not.toContain('### Source')
  })
})
