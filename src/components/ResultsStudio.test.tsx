import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsStudio } from './ResultsStudio'
import { ToastProvider } from '@/hooks/useToasts'
import type { StudyPackage } from '@/types'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const data: StudyPackage = {
  subject: 'Computer Science',
  summary: {
    tldr: 'A quick summary of the material.',
    coreTakeaways: ['Takeaway one', 'Takeaway two'],
    vitalConcepts: [{ term: 'Recursion', definition: 'A function calling itself.' }],
  },
  revisionNotes: {
    title: 'CS Revision Guide',
    sections: [{ heading: 'Module 1: Big-O', content: 'Runtime growth explained.', keyPoints: ['Point A'] }],
  },
  quiz: [
    {
      id: 0,
      question: 'What is recursion?',
      options: ['A loop', 'A function calling itself', 'A variable', 'A class'],
      correctAnswerIndex: 1,
      explanation: 'Recursion is a function calling itself.',
    },
  ],
}

function renderStudio() {
  render(
    <ToastProvider>
      <ResultsStudio data={data} />
    </ToastProvider>,
  )
}

describe('ResultsStudio', () => {
  it('shows the One-Glance Summary tab by default', () => {
    renderStudio()
    expect(screen.getByText('A quick summary of the material.')).toBeInTheDocument()
    expect(screen.getByText('Takeaway one')).toBeInTheDocument()
  })

  it('switches to Deep Revision Notes when that tab is clicked', async () => {
    const user = userEvent.setup()
    renderStudio()
    await user.click(screen.getByRole('button', { name: /deep revision notes/i }))
    // AnimatePresence (mode="wait") exits the old tab before mounting the new one.
    expect(await screen.findByText('CS Revision Guide')).toBeInTheDocument()
    expect(screen.getByText('Module 1: Big-O')).toBeInTheDocument()
  })

  it('switches to Practice Quiz when that tab is clicked', async () => {
    const user = userEvent.setup()
    renderStudio()
    await user.click(screen.getByRole('button', { name: /practice quiz/i }))
    expect(await screen.findByText(/what is recursion/i)).toBeInTheDocument()
  })

  it('opens the export modal from the toolbar', async () => {
    const user = userEvent.setup()
    renderStudio()
    await user.click(screen.getByRole('button', { name: /export/i }))
    expect(screen.getByText('Export Study Package')).toBeInTheDocument()
  })
})
