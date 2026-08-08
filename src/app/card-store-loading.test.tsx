import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CardStoreProvider } from '@/app/card-store'

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({
    status: 'loading',
    user: null,
    error: null,
    bootstrap: null,
    retry: vi.fn(),
  }),
}))

describe('CardStoreProvider bootstrap boundary', () => {
  it('does not render owner routes before the production card is ready', () => {
    render(
      <CardStoreProvider>
        <div>owner routes</div>
      </CardStoreProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/Cardly/)
    expect(screen.queryByText('owner routes')).not.toBeInTheDocument()
  })
})
