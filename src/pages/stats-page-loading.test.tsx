import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import StatsPage from './stats-page'

const { loadOwnerStats, refreshDashboard } = vi.hoisted(() => ({
  loadOwnerStats: vi.fn(),
  refreshDashboard: vi.fn(),
}))

const dashboardStats = {
  totalViews: 0,
  totalPrimaryClicks: 0,
  totalLinkClicks: 0,
  totalProjectOpens: 0,
  totalLeads: 0,
  totalShares: 0,
  daily: [],
}

vi.mock('@/config/client-env', () => ({
  clientEnv: { demoMode: false },
}))

vi.mock('@/services/owner-dashboard-service', () => ({
  loadOwnerStats,
}))

vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({
    leads: [],
    refreshDashboard,
    setLeadStatus: vi.fn(),
    stats: dashboardStats,
  }),
}))

describe('StatsPage loading state', () => {
  beforeEach(() => {
    loadOwnerStats.mockReset()
    refreshDashboard.mockReset()
    refreshDashboard.mockResolvedValue(undefined)
  })

  it('leaves the skeleton and shows a retryable error after one failed request', async () => {
    loadOwnerStats.mockRejectedValue(new Error('stats unavailable'))

    render(
      <MemoryRouter initialEntries={['/app/stats']}>
        <StatsPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Загрузка статистики')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить статистику')
    expect(screen.queryByLabelText('Загрузка статистики')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(loadOwnerStats).toHaveBeenCalledTimes(1)
      expect(refreshDashboard).toHaveBeenCalledTimes(1)
    })
  })
})
