import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { PublicCardRenderer } from './public-card-renderer'

const recordPublicEvent = vi.hoisted(() => vi.fn())
vi.mock('@/services/public-analytics', () => ({ recordPublicEvent }))
vi.mock('@/features/public-card/project-dialog', () => ({
  ProjectDialog: () => null,
}))
vi.mock('@/lib/telegram', () => ({
  telegram: { openLink: vi.fn(), notify: vi.fn(), available: true },
}))

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

  it('does not record owner preview interactions as public analytics', async () => {
    const user = userEvent.setup()
    recordPublicEvent.mockReset()
    render(<PublicCardRenderer card={demoCard} analyticsEnabled={false} />)

    await user.click(screen.getByRole('button', { name: demoCard.primaryAction.label }))
    await user.click(screen.getByRole('button', { name: 'Telegram' }))
    await user.click(screen.getByRole('button', { name: /Finflow/ }))

    expect(recordPublicEvent).not.toHaveBeenCalled()
  })
})
