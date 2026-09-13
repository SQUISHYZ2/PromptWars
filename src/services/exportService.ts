import jsPDF from 'jspdf'
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx'
import PptxGenJS from 'pptxgenjs'
import type { StudyPackage } from '@/types'

export interface ExportSections {
  summary: boolean
  notes: boolean
  quiz: boolean
}

export const DEFAULT_EXPORT_SECTIONS: ExportSections = {
  summary: true,
  notes: true,
  quiz: true,
}

const BRAND_COLOR = '0EA5E9'
const BRAND_COLOR_RGB: [number, number, number] = [14, 165, 233]

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function safeFileName(subject: string, ext: string) {
  const cleaned = subject.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return `studysphere-${cleaned || 'notes'}.${ext}`
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------
export function exportToPdf(data: StudyPackage, sections: ExportSections = DEFAULT_EXPORT_SECTIONS) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = 0

  // Cover
  doc.setFillColor(...BRAND_COLOR_RGB)
  doc.rect(0, 0, pageWidth, 200, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.text('StudySphere AI', margin, 90)
  doc.setFontSize(14)
  doc.text('AI-Generated Study Package', margin, 120)
  doc.setFontSize(20)
  doc.text(data.subject, margin, 160)
  doc.setTextColor(30, 30, 30)
  y = 240

  const addHeading = (text: string) => {
    if (y > 760) {
      doc.addPage()
      y = 60
    }
    doc.setFontSize(16)
    doc.setTextColor(...BRAND_COLOR_RGB)
    doc.text(text, margin, y)
    doc.setTextColor(30, 30, 30)
    y += 22
  }

  const addBody = (text: string) => {
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
    for (const line of lines) {
      if (y > 780) {
        doc.addPage()
        y = 60
      }
      doc.text(line, margin, y)
      y += 15
    }
    y += 8
  }

  const addBullets = (items: string[]) => {
    doc.setFontSize(11)
    for (const item of items) {
      const lines = doc.splitTextToSize(`•  ${item}`, pageWidth - margin * 2 - 10)
      for (const line of lines) {
        if (y > 780) {
          doc.addPage()
          y = 60
        }
        doc.text(line, margin + 6, y)
        y += 15
      }
    }
    y += 8
  }

  if (sections.summary) {
    addHeading('One-Glance Summary')
    addBody(data.summary.tldr)
    addBullets(data.summary.coreTakeaways)
    if (data.summary.vitalConcepts.length) {
      doc.setFontSize(12)
      doc.setTextColor(...BRAND_COLOR_RGB)
      if (y > 760) {
        doc.addPage()
        y = 60
      }
      doc.text('Vital Concepts', margin, y)
      doc.setTextColor(30, 30, 30)
      y += 18
      addBullets(data.summary.vitalConcepts.map((c) => `${c.term}: ${c.definition}`))
    }
  }

  if (sections.notes) {
    doc.addPage()
    y = 60
    addHeading(data.revisionNotes.title)
    for (const section of data.revisionNotes.sections) {
      addHeading(section.heading)
      addBody(section.content)
      addBullets(section.keyPoints)
    }
  }

  if (sections.quiz && data.quiz.length) {
    doc.addPage()
    y = 60
    addHeading('Practice Quiz — Answer Key')

    data.quiz.forEach((q, qIdx) => {
      // Keep each question's block (question + options + explanation) from
      // splitting awkwardly across a page break.
      const estimatedHeight = 24 + q.options.length * 16 + 40
      if (y + estimatedHeight > 790) {
        doc.addPage()
        y = 60
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(30, 30, 30)
      const questionLines = doc.splitTextToSize(`${qIdx + 1}. ${q.question}`, pageWidth - margin * 2)
      for (const line of questionLines) {
        doc.text(line, margin, y)
        y += 15
      }
      doc.setFont('helvetica', 'normal')
      y += 2

      q.options.forEach((option, optIdx) => {
        const isCorrect = optIdx === q.correctAnswerIndex
        // jsPDF's built-in Helvetica font is WinAnsi-encoded and can't render ✓ (U+2713) —
        // it silently falls back to a garbled glyph, so use a plain-text marker instead.
        const label = `${String.fromCharCode(65 + optIdx)}. ${option}${isCorrect ? '  (Correct Answer)' : ''}`
        const lines = doc.splitTextToSize(label, pageWidth - margin * 2 - 10)
        doc.setFontSize(10.5)
        doc.setTextColor(isCorrect ? 22 : 60, isCorrect ? 163 : 60, isCorrect ? 74 : 60)
        if (isCorrect) doc.setFont('helvetica', 'bold')
        for (const line of lines) {
          doc.text(line, margin + 8, y)
          y += 14
        }
        doc.setFont('helvetica', 'normal')
      })

      // Explanation block, visually set apart at the bottom of the question.
      y += 4
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Why this is correct:', margin, y)
      y += 14
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(80, 80, 80)
      const explanationLines = doc.splitTextToSize(q.explanation, pageWidth - margin * 2 - 10)
      for (const line of explanationLines) {
        if (y > 790) {
          doc.addPage()
          y = 60
        }
        doc.text(line, margin + 8, y)
        y += 13
      }
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)

      y += 18
      if (qIdx < data.quiz.length - 1) {
        doc.setDrawColor(220, 220, 220)
        doc.line(margin, y - 10, pageWidth - margin, y - 10)
      }
    })
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(`StudySphere AI · Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 24)
  }

  doc.save(safeFileName(data.subject, 'pdf'))
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------
export async function exportToDocx(
  data: StudyPackage,
  sections: ExportSections = DEFAULT_EXPORT_SECTIONS,
) {
  const children: Paragraph[] = [
    new Paragraph({
      text: 'StudySphere AI',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: data.subject,
      heading: HeadingLevel.HEADING_2,
      border: {
        bottom: { color: BRAND_COLOR, style: BorderStyle.SINGLE, size: 6 },
      },
    }),
    new Paragraph({ text: '' }),
  ]

  if (sections.summary) {
    children.push(new Paragraph({ text: 'One-Glance Summary', heading: HeadingLevel.HEADING_1 }))
    children.push(new Paragraph({ children: [new TextRun({ text: data.summary.tldr, italics: true })] }))
    children.push(new Paragraph({ text: '' }))
    for (const takeaway of data.summary.coreTakeaways) {
      children.push(new Paragraph({ text: takeaway, bullet: { level: 0 } }))
    }
    if (data.summary.vitalConcepts.length) {
      children.push(new Paragraph({ text: '' }))
      children.push(new Paragraph({ text: 'Vital Concepts', heading: HeadingLevel.HEADING_2 }))
      for (const concept of data.summary.vitalConcepts) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${concept.term}: `, bold: true }),
              new TextRun({ text: concept.definition }),
            ],
          }),
        )
      }
    }
    children.push(new Paragraph({ text: '' }))
  }

  if (sections.notes) {
    children.push(new Paragraph({ text: data.revisionNotes.title, heading: HeadingLevel.HEADING_1 }))
    for (const section of data.revisionNotes.sections) {
      children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2 }))
      children.push(new Paragraph({ text: section.content }))
      for (const point of section.keyPoints) {
        children.push(new Paragraph({ text: point, bullet: { level: 0 } }))
      }
      children.push(new Paragraph({ text: '' }))
    }
  }

  if (sections.quiz && data.quiz.length) {
    children.push(new Paragraph({ text: 'Practice Quiz', heading: HeadingLevel.HEADING_1 }))
    data.quiz.forEach((q, i) => {
      children.push(new Paragraph({ text: `${i + 1}. ${q.question}`, heading: HeadingLevel.HEADING_2 }))
      q.options.forEach((opt, idx) => {
        const isCorrect = idx === q.correctAnswerIndex
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${String.fromCharCode(65 + idx)}. ${opt}${isCorrect ? '  ✓ Correct' : ''}`,
                bold: isCorrect,
                color: isCorrect ? '16A34A' : undefined,
              }),
            ],
          }),
        )
      })
      children.push(new Paragraph({ text: '' }))
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Why this is correct:', bold: true })],
        }),
      )
      children.push(
        new Paragraph({
          children: [new TextRun({ text: q.explanation, italics: true })],
        }),
      )
      children.push(new Paragraph({ text: '' }))
    })
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, safeFileName(data.subject, 'docx'))
}

// ---------------------------------------------------------------------------
// PPTX
// ---------------------------------------------------------------------------
export async function exportToPptx(
  data: StudyPackage,
  sections: ExportSections = DEFAULT_EXPORT_SECTIONS,
) {
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'STUDYSPHERE', width: 10, height: 5.63 })
  pptx.layout = 'STUDYSPHERE'

  const brand = '0EA5E9'
  const dark = '0F172A'

  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: dark }
  titleSlide.addText('StudySphere AI', {
    x: 0.5,
    y: 1.6,
    w: 9,
    fontSize: 40,
    bold: true,
    color: brand,
  })
  titleSlide.addText(data.subject, { x: 0.5, y: 2.5, w: 9, fontSize: 24, color: 'FFFFFF' })
  titleSlide.addText('AI-Generated Study Package', {
    x: 0.5,
    y: 3.1,
    w: 9,
    fontSize: 14,
    color: '94A3B8',
  })

  if (sections.summary) {
    const tldrSlide = pptx.addSlide()
    tldrSlide.addText('TL;DR', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: brand })
    tldrSlide.addText(data.summary.tldr, { x: 0.5, y: 1.1, w: 9, fontSize: 16, color: dark })
    tldrSlide.addText(data.summary.coreTakeaways.map((t) => `• ${t}`).join('\n'), {
      x: 0.5,
      y: 2.2,
      w: 9,
      h: 3,
      fontSize: 14,
      color: dark,
      valign: 'top',
    })
  }

  if (sections.notes) {
    for (const section of data.revisionNotes.sections) {
      const slide = pptx.addSlide()
      slide.addText(section.heading, { x: 0.5, y: 0.3, w: 9, fontSize: 24, bold: true, color: brand })
      slide.addText(section.content, { x: 0.5, y: 1.1, w: 9, fontSize: 13, color: dark })
      slide.addText(section.keyPoints.map((p) => `• ${p}`).join('\n'), {
        x: 0.5,
        y: 2.4,
        w: 9,
        h: 2.8,
        fontSize: 13,
        color: dark,
        valign: 'top',
      })
    }
  }

  if (sections.quiz) {
    for (const [i, q] of data.quiz.entries()) {
      const slide = pptx.addSlide()
      slide.addText(`Quiz Q${i + 1}`, { x: 0.5, y: 0.3, w: 9, fontSize: 22, bold: true, color: brand })
      slide.addText(q.question, { x: 0.5, y: 1.0, w: 9, fontSize: 16, color: dark })
      slide.addText(
        q.options
          .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}${idx === q.correctAnswerIndex ? '  ✓' : ''}`)
          .join('\n'),
        { x: 0.5, y: 2.0, w: 9, h: 2, fontSize: 14, color: dark, valign: 'top' },
      )
      slide.addText(`Why this is correct: ${q.explanation}`, {
        x: 0.5,
        y: 4.2,
        w: 9,
        h: 1.2,
        fontSize: 11,
        italic: true,
        color: '475569',
        valign: 'top',
      })
    }
  }

  await pptx.writeFile({ fileName: safeFileName(data.subject, 'pptx') })
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------
export function buildMarkdown(data: StudyPackage, sections: ExportSections = DEFAULT_EXPORT_SECTIONS): string {
  const lines: string[] = [`# StudySphere AI — ${data.subject}`, '']

  if (sections.summary) {
    lines.push('## One-Glance Summary', '', data.summary.tldr, '')
    lines.push('### Core Takeaways')
    for (const t of data.summary.coreTakeaways) lines.push(`- ${t}`)
    lines.push('')
    if (data.summary.vitalConcepts.length) {
      lines.push('### Vital Concepts')
      for (const c of data.summary.vitalConcepts) lines.push(`- **${c.term}**: ${c.definition}`)
      lines.push('')
    }
  }

  if (sections.notes) {
    lines.push(`## ${data.revisionNotes.title}`, '')
    for (const section of data.revisionNotes.sections) {
      lines.push(`### ${section.heading}`, '', section.content, '')
      for (const point of section.keyPoints) lines.push(`- ${point}`)
      lines.push('')
    }
  }

  if (sections.quiz) {
    lines.push('## Practice Quiz', '')
    data.quiz.forEach((q, i) => {
      lines.push(`**${i + 1}. ${q.question}**`, '')
      q.options.forEach((opt, idx) => {
        const marker = idx === q.correctAnswerIndex ? '✓' : ' '
        lines.push(`- [${marker}] ${String.fromCharCode(65 + idx)}. ${opt}`)
      })
      lines.push('', '**Why this is correct:**', '', `_${q.explanation}_`, '')
    })
  }

  return lines.join('\n')
}

export async function copyMarkdownToClipboard(
  data: StudyPackage,
  sections: ExportSections = DEFAULT_EXPORT_SECTIONS,
): Promise<void> {
  const markdown = buildMarkdown(data, sections)
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown)
    return
  }
  // Fallback for browsers without async clipboard support.
  const textarea = document.createElement('textarea')
  textarea.value = markdown
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
