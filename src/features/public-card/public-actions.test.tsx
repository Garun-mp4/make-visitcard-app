import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { PublicActions } from './public-actions'

const { notify, revealLink, recordPublicEvent, telegramNotify } = vi.hoisted(() => ({
  notify: vi.fn(),
  revealLink: vi.fn(),
  recordPublicEvent: vi.fn(),
  telegramNotify: vi.fn(),
}))

vi.mock('@/components/feedback/feedback-provider', () => ({
  useFeedback: () => ({ notify, revealLink }),
}))
vi.mock('@/services/public-analytics', () => ({ recordPublicEvent }))
vi.mock('@/lib/telegram', () => ({
  telegram: { notify: telegramNotify },
}))

describe('PublicActions native sharing', () => {
  it('opens the native share sheet from the card Share icon', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    render(<PublicActions card={demoCard} publicUrl="https://cardly.test/c/alexey" />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Поделиться' }))

    expect(share).toHaveBeenCalledWith({
      title: demoCard.profile.displayName,
      text: demoCard.profile.profession,
      url: 'https://cardly.test/c/alexey',
    })
  })

  it('opens a QR dialog instead of revealing the plain card link', async () => {
    render(<PublicActions card={demoCard} publicUrl="https://cardly.test/c/alexey" />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Показать QR-код' }))

    expect(screen.getByRole('dialog', { name: 'QR-код визитки' })).toBeInTheDocument()
    expect(screen.getByTitle('QR-код визитки')).toBeInTheDocument()
    expect(revealLink).not.toHaveBeenCalled()
  })
})
