import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard, demoLeads, demoOwner, demoStats } from '@shared/demo-data'
import { CardStoreProvider, useCardStore } from '@/app/card-store'

const mocks = vi.hoisted<{
  auth: { value: unknown }
  loadOwnerDashboard: ReturnType<typeof vi.fn>
}>(() => ({
  auth: { value: null },
  loadOwnerDashboard: vi.fn(),
}))

vi.mock('@/config/client-env', () => ({
  clientEnv: {
    appBaseUrl: '',
    telegramBotUsername: '',
    telegramAppShortName: '',
    demoMode: false,
    defaultLocale: 'ru',
  },
}))

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => mocks.auth.value,
}))

vi.mock('@/services/card-repository', () => ({
  cardRepository: { load: vi.fn(), save: vi.fn() },
}))

vi.mock('@/services/owner-dashboard-service', () => ({
  loadOwnerDashboard: mocks.loadOwnerDashboard,
  saveLeadStatus: vi.fn(),
  saveOwnerPreferences: vi.fn(),
}))

function RefreshProbe({ identities }: { identities: Array<() => Promise<void>> }) {
  const store = useCardStore()
  useEffect(() => {
    identities.push(store.refreshDashboard)
  }, [identities, store.refreshDashboard])
  return (
    <button onClick={() => void store.refreshDashboard()}>
      Refresh dashboard · {store.stats.totalViews}
    </button>
  )
}

describe('CardStore dashboard refresh', () => {
  beforeEach(() => {
    mocks.loadOwnerDashboard.mockReset()
    mocks.auth.value = {
      status: 'authenticated',
      user: demoOwner,
      error: null,
      retry: vi.fn(),
      bootstrap: {
        user: demoOwner,
        sessionToken: 'test-session',
        card: demoCard,
        dashboard: { owner: demoOwner, stats: demoStats, leads: demoLeads },
        preferences: { locale: 'ru', leadNotificationsEnabled: true },
      },
    }
  })

  it('keeps refreshDashboard stable after dashboard state changes', async () => {
    const identities: Array<() => Promise<void>> = []
    mocks.loadOwnerDashboard.mockResolvedValue({
      owner: demoOwner,
      stats: { ...demoStats, totalViews: demoStats.totalViews + 1 },
      leads: demoLeads,
    })

    render(
      <CardStoreProvider>
        <RefreshProbe identities={identities} />
      </CardStoreProvider>,
    )

    const refresh = await screen.findByRole('button', { name: /Refresh dashboard/ })
    expect(identities).toHaveLength(1)
    await userEvent.click(refresh)
    await waitFor(() => expect(refresh).toHaveTextContent(String(demoStats.totalViews + 1)))
    expect(mocks.loadOwnerDashboard).toHaveBeenCalledTimes(1)
    expect(identities).toHaveLength(1)
  })
})
