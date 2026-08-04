import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { CardStoreProvider } from '@/app/card-store'
import type { CardDraft } from '@shared/types'
import { AuthProvider } from '@/features/auth/auth-provider'
import OnboardingPage from './onboarding-page'

vi.mock('@/services/card-repository', () => ({
  cardRepository: {
    load: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockImplementation(async (card: CardDraft) => card),
  },
}))

describe('OnboardingPage', () => {
  it('moves through the first step and exposes accessible progress', async () => {
    sessionStorage.clear()
    render(
      <MemoryRouter>
        <AuthProvider>
          <CardStoreProvider>
            <OnboardingPage />
          </CardStoreProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /Визитка, которая работает/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Начать' }))
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled()
  })
})
