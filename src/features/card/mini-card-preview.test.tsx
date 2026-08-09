import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { MiniCardPreview } from './mini-card-preview'

describe('MiniCardPreview projects', () => {
  it('renders enabled project covers in the full owner preview', () => {
    render(
      <MiniCardPreview
        card={{
          ...demoCard,
          projects: [
            {
              ...demoCard.projects[0],
              coverUrl: 'https://images.example/finflow.webp',
            },
          ],
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Проекты' })).toBeInTheDocument()
    expect(screen.getByText('Finflow')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Обложка проекта/ })).toHaveAttribute(
      'src',
      'https://images.example/finflow.webp',
    )
  })

  it('does not render disabled projects', () => {
    render(
      <MiniCardPreview
        card={{
          ...demoCard,
          projects: demoCard.projects.map((project) => ({ ...project, enabled: false })),
        }}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Проекты' })).not.toBeInTheDocument()
  })
})
