import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { demoStats } from '@shared/demo-data'
import StatsPage from './stats-page'

const leads = [
  {
    id: 'lead-new',
    ownerUid: 'demo-owner',
    cardSlug: 'alexey',
    senderName: 'Новая заявка',
    senderContact: '@new',
    message: 'Хочу обсудить проект',
    source: 'telegram' as const,
    status: 'new' as const,
    createdAt: '2026-08-09T08:00:00.000Z',
  },
  {
    id: 'lead-read',
    ownerUid: 'demo-owner',
    cardSlug: 'alexey',
    senderName: 'Прочитанная заявка',
    senderContact: '@read',
    message: 'Вторая заявка',
    source: 'telegram' as const,
    status: 'read' as const,
    createdAt: '2026-08-08T08:00:00.000Z',
  },
]

vi.mock('@/config/client-env', () => ({ clientEnv: { demoMode: true } }))
vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({
    leads,
    refreshDashboard: vi.fn().mockResolvedValue(undefined),
    setLeadStatus: vi.fn(),
    stats: demoStats,
  }),
}))

function renderStats(path = '/app/stats') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/stats" element={<StatsPage />} />
        <Route path="/app/stats/leads" element={<StatsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StatsPage section navigation', () => {
  it('uses visible overview and leads links with a new-lead badge', async () => {
    renderStats()

    expect(screen.queryByLabelText('Открыть заявки')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Раздел статистики' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Обзор' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Заявки.*1/ })).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('link', { name: /Заявки.*1/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Статистика' })).toBeInTheDocument()
    expect(screen.getByText('Новая заявка')).toBeInTheDocument()
    expect(screen.getByText('Прочитанная заявка')).toBeInTheDocument()
  })

  it('preserves the selected statistics period after visiting leads', async () => {
    const user = userEvent.setup()
    renderStats()

    await user.click(screen.getByRole('button', { name: '30 дней' }))
    await user.click(screen.getByRole('link', { name: /Заявки.*1/ }))
    await user.click(screen.getByRole('link', { name: 'Обзор' }))

    expect(screen.getByRole('button', { name: '30 дней' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters leads by processing status', async () => {
    const user = userEvent.setup()
    renderStats('/app/stats/leads')

    await user.click(screen.getByRole('button', { name: 'Новые' }))
    expect(screen.getByText('Новая заявка')).toBeInTheDocument()
    expect(screen.queryByText('Прочитанная заявка')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Прочитанные' }))
    expect(screen.queryByText('Новая заявка')).not.toBeInTheDocument()
    expect(screen.getByText('Прочитанная заявка')).toBeInTheDocument()
  })
})
