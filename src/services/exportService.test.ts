import { describe, it, expect } from 'vitest'
import { buildMarkdown } from './exportService'
import type { StudyPackage } from '@/types'

const pkg: StudyPackage = {
  subject: 'Computer Science',
  summary: {
    tldr: 'A quick summary.',
    coreTakeaways: ['Takeaway one', 'Takeaway two'],
    vitalConcepts: [{ term: 'Recursion', definition: 'A function calling itself.' }],
  },
  revisionNotes: {
    title: 'CS Revision Guide',
    sections: [{ heading: 'Module 1', content: 'Some content.', keyPoints: ['Point A', 'Point B'] }],
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

describe('buildMarkdown', () => {
  it('includes all sections when every flag is enabled', () => {
    const md = buildMarkdown(pkg)
    expect(md).toContain('# StudySphere AI — Computer Science')
    expect(md).toContain('## One-Glance Summary')
    expect(md).toContain('Takeaway one')
    expect(md).toContain('**Recursion**: A function calling itself.')
    expect(md).toContain('## CS Revision Guide')
    expect(md).toContain('Module 1')
    expect(md).toContain('## Practice Quiz')
    expect(md).toContain('What is recursion?')
  })

  it('marks the correct quiz option and includes the explanation', () => {
    const md = buildMarkdown(pkg)
    expect(md).toContain('- [✓] B. A function calling itself')
    expect(md).toContain('- [ ] A. A loop')
    expect(md).toContain('_Recursion is a function calling itself._')
  })

  it('omits a section entirely when its flag is false', () => {
    const md = buildMarkdown(pkg, { summary: false, notes: true, quiz: false })
    expect(md).not.toContain('One-Glance Summary')
    expect(md).not.toContain('Practice Quiz')
    expect(md).toContain('CS Revision Guide')
  })
})
