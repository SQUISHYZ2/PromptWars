import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropzone } from './Dropzone'
import type { ManagedFile } from '@/types'

function makeFile(overrides: Partial<ManagedFile> = {}): ManagedFile {
  return {
    id: '1',
    name: 'notes.pdf',
    size: 2048,
    type: 'application/pdf',
    status: 'ready',
    extractedText: 'hello world',
    wordCount: 2,
    ...overrides,
  }
}

describe('Dropzone', () => {
  it('shows the empty-state prompt and no file summary when there are no files', () => {
    render(<Dropzone files={[]} onFilesAdded={vi.fn()} onRemoveFile={vi.fn()} totalWordCount={0} />)
    expect(screen.getByText(/drag & drop lecture notes/i)).toBeInTheDocument()
    expect(screen.queryByText(/words extracted/i)).not.toBeInTheDocument()
  })

  it('forwards a file selected through the native file input', async () => {
    const onFilesAdded = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <Dropzone files={[]} onFilesAdded={onFilesAdded} onRemoveFile={vi.fn()} totalWordCount={0} />,
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'lecture.txt', { type: 'text/plain' })

    await user.upload(input, file)

    expect(onFilesAdded).toHaveBeenCalledTimes(1)
    const passed = onFilesAdded.mock.calls[0][0] as FileList
    expect(passed).toHaveLength(1)
    expect(passed[0].name).toBe('lecture.txt')
  })

  it('forwards files dropped onto the dropzone', () => {
    const onFilesAdded = vi.fn()
    render(<Dropzone files={[]} onFilesAdded={onFilesAdded} onRemoveFile={vi.fn()} totalWordCount={0} />)

    const dropzone = screen.getByText(/drag & drop lecture notes/i).closest('[role="button"]')!
    const file = new File(['content'], 'slides.pptx', { type: 'application/vnd.ms-powerpoint' })
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(onFilesAdded).toHaveBeenCalledTimes(1)
  })

  it('renders each file with its name, size, and status', () => {
    render(
      <Dropzone
        files={[makeFile({ status: 'reading' }), makeFile({ id: '2', name: 'slides.pptx', status: 'error', error: 'Corrupt file' })]}
        onFilesAdded={vi.fn()}
        onRemoveFile={vi.fn()}
        totalWordCount={2}
      />,
    )
    expect(screen.getByText('notes.pdf')).toBeInTheDocument()
    expect(screen.getByText('Reading…')).toBeInTheDocument()
    expect(screen.getByText('slides.pptx')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText(/corrupt file/i)).toBeInTheDocument()
  })

  it('shows the total word count summary once files are present', () => {
    render(<Dropzone files={[makeFile()]} onFilesAdded={vi.fn()} onRemoveFile={vi.fn()} totalWordCount={2} />)
    expect(screen.getByText(/2 words extracted/i)).toBeInTheDocument()
    expect(screen.getByText('1 file added')).toBeInTheDocument()
  })

  it('calls onRemoveFile with the right id when the remove button is clicked', async () => {
    const onRemoveFile = vi.fn()
    const user = userEvent.setup()
    render(<Dropzone files={[makeFile({ id: 'abc' })]} onFilesAdded={vi.fn()} onRemoveFile={onRemoveFile} totalWordCount={2} />)

    await user.click(screen.getByLabelText(/remove notes.pdf/i))
    expect(onRemoveFile).toHaveBeenCalledWith('abc')
  })
})
