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

vi.mock('@/config/client-env', () => ({
  clientEnv: {
    appBaseUrl: '',
    telegramBotUsername: '',
    telegramAppShortName: '',
    demoMode: true,
    defaultLocale: 'ru',
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
    expect(
      screen.getByRole('heading', { name: /профессиональная визитка — внутри Telegram/i }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled()
  })

  it('starts revisit mode from the welcome step without clearing current data', () => {
    sessionStorage.setItem('cardly-onboarding-revisit-step', '4')
    render(
      <MemoryRouter>
        <AuthProvider>
          <CardStoreProvider>
            <OnboardingPage mode="revisit" />
          </CardStoreProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText(/Текущие данные и публикация сохранятся/)).toBeInTheDocument()
    expect(screen.getByText('@alexey_cardly')).toBeInTheDocument()
    expect(screen.getByLabelText('Шаг 1 из 6')).toBeInTheDocument()
  })
})
