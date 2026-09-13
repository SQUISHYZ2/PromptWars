import type { StudyPackage } from '../types'

/**
 * Prompt, JSON schema, and response-normalization logic shared between the
 * client's BYOK path (src/services/aiService.ts, calls Gemini directly with
 * a user-supplied key) and the serverless proxy (api/generate.ts, calls
 * Gemini with the site's own server-side key). Keeping this in one place
 * means both paths produce identically-shaped, identically-prompted output.
 */

export interface PromptOptions {
  sourceText: string
  subjectLabel: string
  levelLabel: string
  depth: 'quick' | 'comprehensive'
  focusGoal?: string
}

export const DEFAULT_MODEL = 'gemini-2.0-flash'
export const MAX_SOURCE_CHARS = 60_000

// Gemini's JSON-schema dialect uses uppercase string type tags (OBJECT,
// STRING, ARRAY, INTEGER...) — these happen to be exactly the runtime values
// of the @google/genai `Type` enum, so a plain literal object works for both
// the SDK (client) and the raw REST API (server) without importing the SDK
// just for its enum.
export const studyPackageSchema = {
  type: 'OBJECT',
  properties: {
    subject: { type: 'STRING' },
    summary: {
      type: 'OBJECT',
      properties: {
        tldr: { type: 'STRING' },
        coreTakeaways: { type: 'ARRAY', items: { type: 'STRING' } },
        vitalConcepts: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              term: { type: 'STRING' },
              definition: { type: 'STRING' },
            },
            required: ['term', 'definition'],
          },
        },
      },
      required: ['tldr', 'coreTakeaways', 'vitalConcepts'],
    },
    revisionNotes: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        sections: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              heading: { type: 'STRING' },
              content: { type: 'STRING' },
              keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['heading', 'content', 'keyPoints'],
          },
        },
      },
      required: ['title', 'sections'],
    },
    quiz: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          question: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correctAnswerIndex: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['id', 'question', 'options', 'correctAnswerIndex', 'explanation'],
      },
    },
  },
  required: ['subject', 'summary', 'revisionNotes', 'quiz'],
} as const

export function buildPrompt(opts: PromptOptions): string {
  const depthInstruction =
    opts.depth === 'quick'
      ? 'Keep it tight: only the highest-yield concepts, 2-3 revision sections, 4 quiz questions.'
      : 'Go deep: thorough coverage of all major themes, 4-6 revision sections with formulas/definitions where relevant, 5 quiz questions.'

  return `You are an expert academic tutor creating study materials for a ${opts.levelLabel} student studying ${opts.subjectLabel}.
${opts.focusGoal ? `Their specific focus goal: ${opts.focusGoal}.` : ''}
${depthInstruction}

Source material (extracted from the student's own documents):
"""
${opts.sourceText.slice(0, MAX_SOURCE_CHARS)}
"""

Produce a StudyPackage JSON object with:
- summary.tldr: a punchy 2-3 sentence executive summary.
- summary.coreTakeaways: 4-6 high-impact bullet takeaways.
- summary.vitalConcepts: 3-6 key term/definition pairs.
- revisionNotes.sections: structured modules, each with a heading, a short explanatory paragraph, and 3-5 keyPoints (include formulas/definitions inline where relevant).
- quiz: interactive multiple-choice questions, each with exactly 4 options, a zero-based correctAnswerIndex, and a clear explanation of why the answer is correct.

Base everything on the source material. If the source material is thin, use your own subject expertise to responsibly fill gaps while staying accurate.`
}

export function normalizeStudyPackage(pkg: Partial<StudyPackage> | null | undefined, fallbackSubjectLabel: string): StudyPackage {
  return {
    subject: pkg?.subject || fallbackSubjectLabel,
    summary: {
      tldr: pkg?.summary?.tldr || 'Summary unavailable.',
      coreTakeaways: pkg?.summary?.coreTakeaways?.length ? pkg.summary.coreTakeaways : ['No takeaways generated.'],
      vitalConcepts: pkg?.summary?.vitalConcepts ?? [],
    },
    revisionNotes: {
      title: pkg?.revisionNotes?.title || `${fallbackSubjectLabel} Revision Notes`,
      sections: pkg?.revisionNotes?.sections ?? [],
    },
    quiz: (pkg?.quiz ?? []).map((q, i) => ({
      ...q,
      id: q.id ?? i,
      options: q.options?.length === 4 ? q.options : [...(q.options ?? []), '', '', '', ''].slice(0, 4),
    })),
  }
}
