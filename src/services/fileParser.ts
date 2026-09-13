import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import mammoth from 'mammoth'
import JSZip from 'jszip'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB per file, per the safety spec

export const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.pptx',
  '.txt',
  '.md',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase()
}

export function isAcceptedFile(fileName: string): boolean {
  return ACCEPTED_EXTENSIONS.includes(getExtension(fileName))
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

interface PdfTextRun {
  str: string
  hasEOL: boolean
  transform: number[]
  height: number
}

/**
 * Reconstructs lines and paragraphs from pdf.js's flat item stream using each
 * run's baseline (transform[5]) and its own hasEOL flag — without this, every
 * page collapses into one unbroken sentence and downstream notes read as a blob.
 */
function reconstructPageText(items: PdfTextRun[]): string {
  const lines: string[] = []
  let currentLine = ''
  let lastY: number | null = null
  let lastHeight = 12

  for (const item of items) {
    if (!item.str) continue
    const y = item.transform[5]

    if (lastY !== null) {
      const dy = Math.abs(y - lastY)
      const lineHeight = lastHeight || 12
      if (dy > lineHeight * 0.4) {
        lines.push(currentLine.trim())
        currentLine = ''
        if (dy > lineHeight * 1.7) lines.push('') // extra vertical gap => paragraph break
      }
    }

    currentLine += (currentLine && !currentLine.endsWith(' ') ? ' ' : '') + item.str
    lastY = y
    lastHeight = item.height || lastHeight

    if (item.hasEOL) {
      lines.push(currentLine.trim())
      currentLine = ''
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim())

  return lines.join('\n').replace(/\n{3,}/g, '\n\n')
}

async function extractPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise
  const pageTexts: string[] = []
  const maxPages = Math.min(doc.numPages, 200)
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const items = content.items.filter((item) => 'str' in item) as unknown as PdfTextRun[]
    pageTexts.push(reconstructPageText(items))
  }
  return pageTexts.join('\n\n')
}

async function extractDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

async function extractPptx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0)
      const numB = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0)
      return numA - numB
    })

  const slideTexts: string[] = []
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('text')
    const matches = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1])
    const slideText = matches.join(' ').trim()
    if (slideText) slideTexts.push(`Slide ${i + 1}: ${slideText}`)
  }
  return slideTexts.join('\n\n')
}

function extractPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function extractImagePlaceholder(file: File): string {
  return `[Image attached: ${file.name}. Visual content — describe key diagrams or labels manually if the AI needs specifics.]`
}

export interface ParseResult {
  text: string
  error?: string
}

/**
 * Extracts text from a single file with a per-file try/catch so one bad file
 * (corrupted PDF, password-protected doc, etc.) never takes down the batch.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { text: '', error: `File exceeds the 25MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).` }
  }

  const ext = getExtension(file.name)

  try {
    switch (ext) {
      case '.pdf':
        return { text: await extractPdf(file) }
      case '.docx':
        return { text: await extractDocx(file) }
      case '.pptx':
        return { text: await extractPptx(file) }
      case '.txt':
      case '.md':
        return { text: await extractPlainText(file) }
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
        return { text: extractImagePlaceholder(file) }
      default:
        return { text: '', error: `Unsupported file type "${ext || 'unknown'}".` }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error'
    // Fallback: try plain-text decoding in case the file is actually text with a wrong extension.
    try {
      const fallbackText = await extractPlainText(file)
      if (fallbackText.trim().length > 0) return { text: fallbackText }
    } catch {
      // ignore fallback failure
    }
    return { text: '', error: `Could not parse this file (${message}).` }
  }
}
