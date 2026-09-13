import type { StudyPackage } from '@/types'
import { buildPrompt, normalizeStudyPackage, studyPackageSchema, DEFAULT_MODEL } from '@/lib/promptBuilder'

export interface GenerateOptions {
  sourceText: string
  subjectLabel: string
  levelLabel: string
  depth: 'quick' | 'comprehensive'
  focusGoal?: string
  apiKey?: string
  useMock: boolean
  model?: string
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGeminiWithRetry(opts: GenerateOptions, maxAttempts = 3): Promise<StudyPackage> {
  if (!opts.apiKey) throw new Error('No API key provided')

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: opts.apiKey })
  const model = opts.model ?? DEFAULT_MODEL

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildPrompt(opts),
        config: {
          responseMimeType: 'application/json',
          // Gemini's schema dialect matches the SDK's Type enum values exactly (see promptBuilder.ts).
          responseSchema: studyPackageSchema as never,
        },
      })

      const text = response.text
      if (!text) throw new Error('Empty response from Gemini')

      const parsed = JSON.parse(text) as Partial<StudyPackage>
      return normalizeStudyPackage(parsed, opts.subjectLabel)
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts - 1) {
        await sleep(2 ** attempt * 1000) // exponential backoff: 1s, 2s, 4s
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Gemini request failed')
}

/**
 * Calls the app's own serverless proxy (api/generate.ts) instead of Gemini
 * directly — the proxy holds a server-side-only API key, so this path lets
 * students get real AI output without bringing their own key. In local dev
 * (plain `vite`) this endpoint doesn't exist and 404s immediately, which is
 * intentional: it just falls through to the mock generator below.
 */
async function callProxyWithRetry(opts: GenerateOptions, maxAttempts = 2): Promise<StudyPackage> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: opts.sourceText,
          subjectLabel: opts.subjectLabel,
          levelLabel: opts.levelLabel,
          depth: opts.depth,
          focusGoal: opts.focusGoal,
          model: opts.model,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || `Shared AI service returned ${response.status}`)
      }

      const { data } = (await response.json()) as { data: Partial<StudyPackage> }
      return normalizeStudyPackage(data, opts.subjectLabel)
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts - 1) await sleep(1000)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Shared AI service request failed')
}

/**
 * Generates a study package. Falls back to the offline mock generator on any
 * failure (missing key, network drop, malformed JSON, rate limit) so the app
 * never dead-ends the user.
 */
export async function generateStudyPackage(opts: GenerateOptions): Promise<{
  data: StudyPackage
  usedMock: boolean
  error?: string
}> {
  if (opts.useMock) {
    return { data: generateMockStudyPackage(opts), usedMock: true }
  }

  if (opts.apiKey) {
    try {
      const data = await callGeminiWithRetry(opts)
      return { data, usedMock: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown AI error'
      return { data: generateMockStudyPackage(opts), usedMock: true, error: message }
    }
  }

  try {
    const data = await callProxyWithRetry(opts)
    return { data, usedMock: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI error'
    return { data: generateMockStudyPackage(opts), usedMock: true, error: message }
  }
}

// ---------------------------------------------------------------------------
// Offline / zero-config mock generator — realistic enough for judges to try
// the full flow without an API key or internet connection.
// ---------------------------------------------------------------------------

const SUBJECT_TEMPLATES: Record<string, { concepts: [string, string][]; formulas: string[] }> = {
  'Computer Science': {
    concepts: [
      ['Time Complexity', 'A measure of how an algorithm’s runtime grows with input size, typically expressed in Big-O notation.'],
      ['Recursion', 'A function that solves a problem by calling itself on smaller subproblems until a base case is reached.'],
      ['Normalization', 'The process of structuring a relational database to reduce redundancy and improve data integrity.'],
      ['Concurrency', 'The ability of a system to execute multiple tasks in overlapping time periods.'],
    ],
    formulas: ['O(log n) — binary search', 'O(n log n) — comparison sorts (merge/quick sort average case)'],
  },
  'Medicine & Bio': {
    concepts: [
      ['Homeostasis', 'The body’s ability to maintain a stable internal environment despite external changes.'],
      ['Action Potential', 'A rapid, transient change in membrane potential that propagates electrical signals along neurons.'],
      ['Pharmacokinetics', 'How a drug is absorbed, distributed, metabolized, and excreted by the body.'],
      ['Antigen-Antibody Response', 'The immune system’s targeted binding of antibodies to foreign antigens for neutralization.'],
    ],
    formulas: ['Cardiac Output = Heart Rate × Stroke Volume', 'BMI = weight(kg) / height(m)²'],
  },
  Mathematics: {
    concepts: [
      ['Derivative', 'The instantaneous rate of change of a function with respect to a variable.'],
      ['Eigenvalue', 'A scalar λ such that Av = λv for a matrix A and nonzero vector v.'],
      ['Probability Distribution', 'A function describing the likelihood of different outcomes in a random experiment.'],
      ['Convergence', 'The property of a sequence or series approaching a finite limit.'],
    ],
    formulas: ['Quadratic Formula: x = (-b ± √(b²-4ac)) / 2a', 'd/dx[xⁿ] = n·xⁿ⁻¹'],
  },
  Engineering: {
    concepts: [
      ['Stress-Strain Relationship', 'The correlation between applied force per unit area and resulting deformation in a material.'],
      ['Control Loop', 'A feedback mechanism that regulates a system’s output to match a desired setpoint.'],
      ['Thermodynamic Efficiency', 'The ratio of useful work output to total energy input in a system.'],
      ['Signal-to-Noise Ratio', 'A measure comparing the level of a desired signal to the level of background noise.'],
    ],
    formulas: ['Ohm’s Law: V = IR', 'Stress σ = F / A'],
  },
  'Law & Humanities': {
    concepts: [
      ['Stare Decisis', 'The legal principle of determining points in litigation according to precedent.'],
      ['Burden of Proof', 'The obligation to prove one’s assertion, varying by standard (e.g., beyond reasonable doubt).'],
      ['Mens Rea', 'The mental state or intent required to establish criminal liability.'],
      ['Judicial Review', 'The power of courts to assess whether a law or action is constitutional.'],
    ],
    formulas: [],
  },
  Business: {
    concepts: [
      ['Opportunity Cost', 'The value of the next-best alternative forgone when a choice is made.'],
      ['Net Present Value', 'The current value of future cash flows discounted at a specific rate, minus initial investment.'],
      ['Market Segmentation', 'Dividing a broad market into distinct subsets of consumers with shared characteristics.'],
      ['Elasticity of Demand', 'A measure of how demand quantity responds to a change in price.'],
    ],
    formulas: ['NPV = Σ [Cash Flow / (1+r)ᵗ] − Initial Investment', 'Break-even Point = Fixed Costs / (Price − Variable Cost)'],
  },
}

function pickTemplate(subjectLabel: string) {
  return SUBJECT_TEMPLATES[subjectLabel] ?? SUBJECT_TEMPLATES['Computer Science']
}

function firstSentences(text: string, count: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned]
  return sentences.slice(0, count).join(' ').trim()
}

/** Splits combined multi-file source text into paragraph-sized chunks, stripping
 * the "### Source: filename" markers the file manager inserts between documents. */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/^###\s*Source:.*$/im, '').replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 40)
}

function splitIntoSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]).map((s) => s.trim()).filter((s) => s.length > 3)
}

function titleFromSentence(sentence: string, maxWords = 7): string {
  const words = sentence.trim().split(/\s+/)
  const title = words.slice(0, maxWords).join(' ').replace(/[,;:.\-—]+$/, '')
  return words.length > maxWords ? `${title}…` : title || 'Key Concept'
}

/** Groups the extracted source text into `desiredCount` roughly-even chunks —
 * by paragraph when there are enough, falling back to sentence grouping for
 * thin/unstructured input — so demo-mode notes are built FROM the student's
 * own material instead of only generic subject templates. */
function buildSourceChunks(text: string, desiredCount: number): string[] {
  const paragraphs = splitIntoParagraphs(text)
  if (paragraphs.length >= desiredCount) {
    const bucketSize = Math.ceil(paragraphs.length / desiredCount)
    const chunks: string[] = []
    for (let i = 0; i < paragraphs.length; i += bucketSize) {
      chunks.push(paragraphs.slice(i, i + bucketSize).join(' '))
    }
    return chunks.slice(0, desiredCount)
  }

  const sentences = splitIntoSentences(text.replace(/^###\s*Source:.*$/gim, ''))
  if (sentences.length === 0) return paragraphs
  const perChunk = Math.max(2, Math.ceil(sentences.length / desiredCount))
  const chunks: string[] = []
  for (let i = 0; i < sentences.length; i += perChunk) {
    const chunk = sentences.slice(i, i + perChunk).join(' ').trim()
    if (chunk.length > 20) chunks.push(chunk)
  }
  return chunks.length ? chunks : paragraphs
}

function stripSourceMarkers(text: string): string {
  return text.replace(/^###\s*Source:.*$/gim, '').trim()
}

export function generateMockStudyPackage(opts: GenerateOptions): StudyPackage {
  const template = pickTemplate(opts.subjectLabel)
  const cleanedSource = stripSourceMarkers(opts.sourceText)
  const snippet = firstSentences(cleanedSource, 3)
  const hasSource = snippet.length > 20
  const sectionCount = opts.depth === 'quick' ? 3 : 5
  const questionCount = opts.depth === 'quick' ? 4 : 5
  const chunks = hasSource ? buildSourceChunks(cleanedSource, sectionCount) : []

  const tldr = hasSource
    ? `Your uploaded material centers on ${opts.subjectLabel.toLowerCase()} fundamentals. Here's the gist: ${snippet}`
    : `This is a demo StudySphere AI package for ${opts.subjectLabel} at the ${opts.levelLabel} level — upload your own notes or add a Gemini API key for a personalized synthesis.`

  const coreTakeaways =
    chunks.length > 0
      ? [
          ...chunks.slice(0, 3).map((chunk) => {
            const first = splitIntoSentences(chunk)[0] ?? chunk
            return first.length > 150 ? `${first.slice(0, 150).trim()}…` : first
          }),
          'Retake the quiz until you consistently score 100% for durable retention.',
        ]
      : [
          `Focus your review on the ${sectionCount} core modules below before attempting the practice quiz.`,
          `${template.concepts[0][0]} and ${template.concepts[1][0]} are the highest-yield concepts for exams in this subject.`,
          opts.depth === 'quick'
            ? 'This is a Quick Cram pass — prioritize recall over derivations.'
            : 'This is a Comprehensive pass — work through formulas and definitions carefully.',
          'Retake the quiz until you consistently score 100% for durable retention.',
        ]

  const sections = Array.from({ length: sectionCount }).map((_, i) => {
    const chunk = chunks[i]
    if (chunk) {
      const sentences = splitIntoSentences(chunk)
      const content = chunk.length > 480 ? `${chunk.slice(0, 480).trim()}…` : chunk
      const keyPoints = (sentences.length > 1 ? sentences.slice(1, 4) : sentences.slice(0, 1)).map((s) =>
        s.length > 160 ? `${s.slice(0, 160).trim()}…` : s,
      )
      return {
        heading: `Module ${i + 1}: ${titleFromSentence(sentences[0] ?? chunk)}`,
        content,
        keyPoints: keyPoints.length ? keyPoints : [content],
      }
    }

    const concept = template.concepts[i % template.concepts.length]
    return {
      heading: `Module ${i + 1}: ${concept[0]}`,
      content: `${concept[1]} Review this concept alongside worked examples for best retention.`,
      keyPoints: [
        `Definition: ${concept[1]}`,
        template.formulas[i % Math.max(template.formulas.length, 1)] ?? 'Connect this concept to a real-world example for better recall.',
        `Common exam trap: confusing ${concept[0].toLowerCase()} with a related but distinct concept — double-check definitions.`,
      ],
    }
  })

  const quiz = Array.from({ length: questionCount }).map((_, i) => {
    const concept = template.concepts[i % template.concepts.length]
    const distractors = template.concepts.filter((c) => c[0] !== concept[0]).map((c) => c[0])
    const options = distractors.slice(0, 3)
    const correctAnswerIndex = i % (options.length + 1)
    options.splice(correctAnswerIndex, 0, concept[0])

    return {
      id: i,
      question: `Which term best matches this definition: "${concept[1]}"`,
      options,
      correctAnswerIndex,
      explanation: `"${concept[0]}" is defined as: ${concept[1]} The other options are related terms from the same unit but describe different mechanisms.`,
    }
  })

  return {
    subject: opts.subjectLabel,
    summary: {
      tldr,
      coreTakeaways,
      vitalConcepts: template.concepts.map(([term, definition]) => ({ term, definition })),
    },
    revisionNotes: {
      title: `${opts.subjectLabel} — ${opts.levelLabel} Revision Guide`,
      sections,
    },
    quiz,
  }
}
