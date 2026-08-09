import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { demoCard, demoLeads, demoStats } from '@shared/demo-data'
import OwnerHomePage from './owner-home-page'

const { ensurePublicCardReady, notify, revealLink } = vi.hoisted(() => ({
  ensurePublicCardReady: vi.fn(),
  notify: vi.fn(),
  revealLink: vi.fn(),
}))

vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({
    card: demoCard,
    ensurePublicCardReady,
    leads: demoLeads,
    publicSync: { state: 'synced', syncedAt: demoCard.lastPublishedAt, invalidPaths: [] },
    saveStatus: 'saved',
    stats: demoStats,
  }),
}))

vi.mock('@/components/feedback/feedback-provider', () => ({
  useFeedback: () => ({ notify, revealLink }),
}))

vi.mock('@/features/card/mini-card-preview', () => ({
  MiniCardPreview: () => <div>Preview</div>,
}))

describe('OwnerHomePage native sharing', () => {
  it('invokes navigator.share directly from the Share button without awaiting card sync', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    ensurePublicCardReady.mockReset()

    render(
      <MemoryRouter>
        <OwnerHomePage />
      </MemoryRouter>,
    )
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Поделиться' })[0])

    expect(share).toHaveBeenCalledWith({
      title: demoCard.profile.displayName,
      url: `http://localhost:3000/c/${demoCard.publication.slug}`,
    })
    expect(ensurePublicCardReady).not.toHaveBeenCalled()
  })
})
