import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizView } from './QuizView'
import type { QuizQuestion } from '@/types'

// canvas-confetti touches a real <canvas> context, which jsdom doesn't implement —
// stub it so a perfect-score submit doesn't throw in the test environment.
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const questions: QuizQuestion[] = [
  {
    id: 0,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswerIndex: 1,
    explanation: '2 + 2 equals 4.',
  },
  {
    id: 1,
    question: 'What is the capital of France?',
    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
    correctAnswerIndex: 2,
    explanation: 'Paris is the capital of France.',
  },
]

describe('QuizView', () => {
  it('renders a fallback message when there are no questions', () => {
    render(<QuizView questions={[]} />)
    expect(screen.getByText(/no quiz questions were generated/i)).toBeInTheDocument()
  })

  it('disables Submit until every question has an answer', async () => {
    const user = userEvent.setup()
    render(<QuizView questions={questions} />)

    const submit = screen.getByRole('button', { name: /submit quiz/i })
    expect(submit).toBeDisabled()

    await user.click(screen.getByText('4'))
    expect(submit).toBeDisabled() // only one of two questions answered

    await user.click(screen.getByText('Paris'))
    expect(submit).toBeEnabled()
  })

  it('scores correctly and shows the result after submitting', async () => {
    const user = userEvent.setup()
    render(<QuizView questions={questions} />)

    await user.click(screen.getByText('4')) // correct
    await user.click(screen.getByText('Madrid')) // wrong
    await user.click(screen.getByRole('button', { name: /submit quiz/i }))

    expect(screen.getByText('You scored 1 / 2')).toBeInTheDocument()
  })

  it('locks answer selection after submission', async () => {
    const user = userEvent.setup()
    render(<QuizView questions={questions} />)

    await user.click(screen.getByText('4'))
    await user.click(screen.getByText('Paris'))
    await user.click(screen.getByRole('button', { name: /submit quiz/i }))

    // Every option button should now be disabled.
    const optionButtons = screen.getAllByRole('button').filter((b) => b.textContent?.match(/^[A-D]\./))
    for (const btn of optionButtons) {
      expect(btn).toBeDisabled()
    }
  })

  it('resets state on Retake Quiz', async () => {
    const user = userEvent.setup()
    render(<QuizView questions={questions} />)

    await user.click(screen.getByText('4'))
    await user.click(screen.getByText('Paris'))
    await user.click(screen.getByRole('button', { name: /submit quiz/i }))
    expect(screen.getByText('You scored 2 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retake quiz/i }))
    expect(screen.queryByText(/you scored/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit quiz/i })).toBeDisabled()
  })

  it('reveals an explanation only for the question it belongs to', async () => {
    const user = userEvent.setup()
    render(<QuizView questions={questions} />)

    await user.click(screen.getByText('4'))
    const firstCard = screen.getByText('1. What is 2 + 2?').closest('div')!
    await user.click(within(firstCard).getByText(/why this is correct/i))

    expect(screen.getByText('2 + 2 equals 4.')).toBeInTheDocument()
    expect(screen.queryByText('Paris is the capital of France.')).not.toBeInTheDocument()
  })
})
