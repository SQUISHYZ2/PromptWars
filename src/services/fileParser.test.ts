import { describe, it, expect } from 'vitest'
import { getExtension, isAcceptedFile, countWords, MAX_FILE_SIZE_BYTES } from './fileParser'

describe('getExtension', () => {
  it('extracts a lowercased extension', () => {
    expect(getExtension('Lecture-Notes.PDF')).toBe('.pdf')
    expect(getExtension('slides.pptx')).toBe('.pptx')
  })

  it('returns empty string when there is no extension', () => {
    expect(getExtension('README')).toBe('')
  })
})

describe('isAcceptedFile', () => {
  it('accepts every supported document and image type', () => {
    for (const name of ['notes.pdf', 'notes.docx', 'slides.pptx', 'notes.txt', 'notes.md', 'scan.png', 'scan.jpg']) {
      expect(isAcceptedFile(name)).toBe(true)
    }
  })

  it('rejects unsupported file types', () => {
    expect(isAcceptedFile('malware.exe')).toBe(false)
    expect(isAcceptedFile('archive.zip')).toBe(false)
  })
})

describe('countWords', () => {
  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t  ')).toBe(0)
  })

  it('counts words across irregular whitespace', () => {
    expect(countWords('  hello   world  \n foo ')).toBe(3)
  })
})

describe('MAX_FILE_SIZE_BYTES', () => {
  it('is set to 25MB per the safety spec', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(25 * 1024 * 1024)
  })
})
