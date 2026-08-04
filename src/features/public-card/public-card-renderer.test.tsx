import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { PublicCardRenderer } from './public-card-renderer'

describe('PublicCardRenderer', () => {
  it.each(['clean', 'dark', 'editorial'] as const)('renders the %s theme', (themeId) => {
    const { container } = render(
      <PublicCardRenderer
        card={{ ...demoCard, appearance: { ...demoCard.appearance, themeId } }}
      />,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: demoCard.profile.displayName }),
    ).toBeInTheDocument()
    expect(container.querySelector(`[data-public-theme="${themeId}"]`)).toBeInTheDocument()
  })

  it('does not render disabled sections', () => {
    render(
      <PublicCardRenderer
        card={{
          ...demoCard,
          appearance: {
            ...demoCard.appearance,
            showSkills: false,
            showServices: false,
            showProjects: false,
          },
        }}
      />,
    )
    expect(screen.queryByRole('heading', { name: 'Навыки' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Услуги' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Проекты' })).not.toBeInTheDocument()
  })
})
