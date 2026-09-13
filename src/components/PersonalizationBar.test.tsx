import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonalizationBar } from './PersonalizationBar'

function renderBar(overrides: Partial<React.ComponentProps<typeof PersonalizationBar>> = {}) {
  const props = {
    subject: 'computer-science' as const,
    onSubjectChange: vi.fn(),
    customSubjectLabel: '',
    onCustomSubjectLabelChange: vi.fn(),
    level: 'undergrad' as const,
    onLevelChange: vi.fn(),
    depth: 'comprehensive' as const,
    onDepthChange: vi.fn(),
    focusGoal: '',
    onFocusGoalChange: vi.fn(),
    ...overrides,
  }
  render(<PersonalizationBar {...props} />)
  return props
}

describe('PersonalizationBar', () => {
  it('calls onSubjectChange with the clicked subject id', async () => {
    const user = userEvent.setup()
    const props = renderBar()
    await user.click(screen.getByRole('button', { name: 'Medicine & Bio' }))
    expect(props.onSubjectChange).toHaveBeenCalledWith('medicine')
  })

  it('shows a custom-subject input only when "Custom" is selected', () => {
    renderBar({ subject: 'computer-science' })
    expect(screen.queryByPlaceholderText(/name your subject/i)).not.toBeInTheDocument()

    renderBar({ subject: 'custom' })
    expect(screen.getByPlaceholderText(/name your subject/i)).toBeInTheDocument()
  })

  it('calls onLevelChange and onDepthChange independently of subject', async () => {
    const user = userEvent.setup()
    const props = renderBar()
    await user.click(screen.getByRole('button', { name: 'Exam Cram' }))
    expect(props.onLevelChange).toHaveBeenCalledWith('exam-cram')

    await user.click(screen.getByRole('button', { name: /Quick Cram/ }))
    expect(props.onDepthChange).toHaveBeenCalledWith('quick')
  })

  it('reports typed focus goal text via onFocusGoalChange', async () => {
    const user = userEvent.setup()
    const props = renderBar()
    await user.type(screen.getByPlaceholderText(/ace the midterm/i), 'x')
    expect(props.onFocusGoalChange).toHaveBeenCalledWith('x')
  })
})
