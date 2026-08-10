import { describe, expect, it } from 'vitest'

import type { PeriodStats } from '@shared/types'
import { hasPeriodViews, hasPopularActions } from './stats-page'

const emptyStats: PeriodStats = {
  period: '7',
  range: { from: '2026-08-02', to: '2026-08-08' },
  totals: {
    views: 0,
    primaryClicks: 0,
    linkClicks: 0,
    projectOpens: 0,
    leads: 0,
    shares: 0,
  },
  deltas: { views: 0, primaryClicks: 0, leads: 0 },
  series: Array.from({ length: 7 }, (_, index) => ({ label: String(index + 1), views: 0 })),
  averageViews: 0,
  popularActions: [
    { label: 'primary', value: 0 },
    { label: 'links', value: 0 },
    { label: 'projects', value: 0 },
    { label: 'share', value: 0 },
  ],
  funnel: { views: 0, interest: 0, contacts: 0, leads: 0, sampleSufficient: false },
  sources: [
    {
      id: null,
      name: 'Direct',
      token: null,
      archived: false,
      views: 0,
      leads: 0,
      conversion: null,
    },
  ],
  interest: [
    { label: 'projects', value: 0 },
    { label: 'services', value: 0 },
    { label: 'links', value: 0 },
  ],
}

describe('statistics empty states', () => {
  it('treats a generated all-zero series as no chart data', () => {
    expect(hasPeriodViews(emptyStats)).toBe(false)
  })

  it('shows data only when the corresponding values are positive', () => {
    expect(
      hasPeriodViews({
        ...emptyStats,
        totals: { ...emptyStats.totals, views: 1 },
        series: [{ label: '08.08', views: 1 }],
      }),
    ).toBe(true)
    expect(
      hasPopularActions({
        ...emptyStats,
        popularActions: [{ label: 'primary', value: 1 }],
      }),
    ).toBe(true)
  })
})
