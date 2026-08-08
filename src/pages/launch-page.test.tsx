import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import LaunchPage from '@/pages/launch-page'

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({
    status: 'error',
    error: 'Authentication failed',
    retry: vi.fn(),
  }),
}))

vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({ card: null }),
}))

vi.mock('@/lib/telegram', () => ({
  telegram: { available: true, startParameter: null },
}))

describe('LaunchPage auth boundary', () => {
  it('shows the authentication error without reading an unavailable card', () => {
    render(
      <MemoryRouter>
        <LaunchPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Не удалось войти' })).toBeVisible()
    expect(screen.getByText('Authentication failed')).toBeVisible()
  })
})
