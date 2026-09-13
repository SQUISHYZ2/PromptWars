import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportModal } from './ExportModal'
import { ToastStack } from './ToastStack'
import { ToastProvider } from '@/hooks/useToasts'
import type { StudyPackage } from '@/types'

const exportToPdf = vi.fn()
const exportToDocx = vi.fn().mockResolvedValue(undefined)
const exportToPptx = vi.fn().mockResolvedValue(undefined)
const copyMarkdownToClipboard = vi.fn().mockResolvedValue(undefined)

// The component dynamically `import()`s the export service to keep the heavy
// jsPDF/docx/pptxgenjs bundles out of the main chunk — mock it here so tests
// exercise the component's own logic without invoking real file generation.
vi.mock('@/services/exportService', () => ({
  exportToPdf: (...args: unknown[]) => exportToPdf(...args),
  exportToDocx: (...args: unknown[]) => exportToDocx(...args),
  exportToPptx: (...args: unknown[]) => exportToPptx(...args),
  copyMarkdownToClipboard: (...args: unknown[]) => copyMarkdownToClipboard(...args),
}))

const data: StudyPackage = {
  subject: 'Computer Science',
  summary: { tldr: 'tldr', coreTakeaways: [], vitalConcepts: [] },
  revisionNotes: { title: 'Notes', sections: [] },
  quiz: [],
}

function renderModal(props: Partial<React.ComponentProps<typeof ExportModal>> = {}) {
  const onClose = vi.fn()
  render(
    <ToastProvider>
      <ExportModal open={true} onClose={onClose} data={data} {...props} />
      <ToastStack />
    </ToastProvider>,
  )
  return { onClose }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ExportModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ToastProvider>
        <ExportModal open={false} onClose={vi.fn()} data={data} />
      </ToastProvider>,
    )
    expect(screen.queryByText('Export Study Package')).not.toBeInTheDocument()
  })

  it('closes via the close button and via Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByLabelText('Close export dialog'))
    expect(onClose).toHaveBeenCalledOnce()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('disables every export button once all sections are deselected', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByText('One-Glance Summary'))
    await user.click(screen.getByText('Deep Revision Notes'))
    await user.click(screen.getByText('Practice Quiz'))

    for (const label of ['PDF', 'Word (.docx)', 'Slides (.pptx)', 'Copy Markdown']) {
      expect(screen.getByRole('button', { name: label })).toBeDisabled()
    }
  })

  it('calls exportToPdf with the current section selection and shows a success toast', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'PDF' }))

    await waitFor(() => expect(exportToPdf).toHaveBeenCalledOnce())
    expect(exportToPdf).toHaveBeenCalledWith(data, { summary: true, notes: true, quiz: true })
    expect(await screen.findByText(/pdf export ready/i)).toBeInTheDocument()
  })

  it('copies markdown and shows a clipboard-specific toast instead of the generic one', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Copy Markdown' }))

    await waitFor(() => expect(copyMarkdownToClipboard).toHaveBeenCalledOnce())
    expect(await screen.findByText(/markdown copied to clipboard/i)).toBeInTheDocument()
    expect(screen.queryByText(/markdown export ready/i)).not.toBeInTheDocument()
  })

  it('shows an error toast when an export fails', async () => {
    exportToDocx.mockRejectedValueOnce(new Error('disk full'))
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Word (.docx)' }))

    expect(await screen.findByText('Export failed')).toBeInTheDocument()
    expect(screen.getByText('disk full')).toBeInTheDocument()
  })
})
