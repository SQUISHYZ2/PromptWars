import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildPrompt, normalizeStudyPackage, studyPackageSchema, DEFAULT_MODEL, MAX_SOURCE_CHARS } from '../src/lib/promptBuilder'
import type { StudyPackage } from '../src/types'

// Hobby plan allows configuring function duration up to 60s; Gemini's JSON-mode
// generation for a "comprehensive" package can take a while, so give it room.
export const config = { maxDuration: 30 }

// Soft, per-instance rate limit. This resets on cold start and doesn't
// coordinate across concurrent instances — it's a speed bump against casual
// abuse of the shared key, not a hard guarantee. For real production traffic,
// swap this for Vercel KV / Upstash so limits persist across instances.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 8
const requestLog = new Map<string, number[]>()

function isRateLimited(clientKey: string): boolean {
  const now = Date.now()
  const recent = (requestLog.get(clientKey) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  requestLog.set(clientKey, recent)
  return recent.length > RATE_LIMIT_MAX_REQUESTS
}

interface GeminiRestResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: studyPackageSchema,
      },
    }),
  })

  if (!upstream.ok) {
    // Never forward the upstream body verbatim — some error payloads echo the request URL (with the key) back.
    throw new Error(`Upstream AI service returned ${upstream.status}`)
  }

  const payload = (await upstream.json()) as GeminiRestResponse
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from AI service')
  return text
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(503).json({ error: 'Shared AI service is not configured on this deployment.' })
    return
  }

  const forwardedFor = req.headers['x-forwarded-for']
  const clientKey =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  if (isRateLimited(clientKey)) {
    res.status(429).json({
      error: 'Too many requests to the shared AI service right now. Try again shortly, or add your own API key in Settings.',
    })
    return
  }

  const body = req.body as {
    sourceText?: string
    subjectLabel?: string
    levelLabel?: string
    depth?: 'quick' | 'comprehensive'
    focusGoal?: string
    model?: string
  } | null

  if (!body?.subjectLabel || !body?.levelLabel || (body.depth !== 'quick' && body.depth !== 'comprehensive')) {
    res.status(400).json({ error: 'Missing or invalid required fields.' })
    return
  }
  if (body.sourceText && body.sourceText.length > MAX_SOURCE_CHARS * 2) {
    res.status(413).json({ error: 'Source text is too large.' })
    return
  }

  const promptOptions = {
    sourceText: body.sourceText ?? '',
    subjectLabel: body.subjectLabel,
    levelLabel: body.levelLabel,
    depth: body.depth,
    focusGoal: body.focusGoal,
  }
  const model = body.model || DEFAULT_MODEL
  const prompt = buildPrompt(promptOptions)

  const maxAttempts = 2
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const text = await callGemini(apiKey, model, prompt)
      const parsed = JSON.parse(text) as Partial<StudyPackage>
      const data = normalizeStudyPackage(parsed, promptOptions.subjectLabel)
      res.status(200).json({ data })
      return
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  console.error('generate proxy error', lastError)
  res.status(502).json({ error: 'The shared AI service failed to respond. Please try again.' })
}
