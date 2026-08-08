import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PeriodStats, StatsPeriod } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { clientEnv } from '@/config/client-env'
import { loadOwnerStats } from '@/services/owner-dashboard-service'

function deltaLabel(value: number | null) {
  if (value === null) return '—'
  return `${value > 0 ? '+' : ''}${value}%`
}

export default function StatsPage() {
  const { leads, refreshDashboard, setLeadStatus, stats: dashboardStats } = useCardStore()
  const { t, i18n } = useTranslation()
  const [period, setPeriod] = useState<StatsPeriod>('7')
  const [tab, setTab] = useState<'overview' | 'leads'>('overview')
  const [data, setData] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    void refreshDashboard().catch(() => undefined)
  }, [refreshDashboard])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    if (clientEnv.demoMode) {
      const daily = period === '7' ? dashboardStats.daily.slice(-7) : dashboardStats.daily
      const totals = {
        views: dashboardStats.totalViews,
        primaryClicks: dashboardStats.totalPrimaryClicks,
        linkClicks: dashboardStats.totalLinkClicks,
        projectOpens: dashboardStats.totalProjectOpens,
        leads: dashboardStats.totalLeads,
        shares: dashboardStats.totalShares,
      }
      setData({
        period,
        range: { from: daily[0]?.date ?? null, to: daily[daily.length - 1]?.date ?? null },
        totals,
        deltas: { views: 18, primaryClicks: 12, leads: null },
        series: daily.map((item) => ({ label: item.date, views: item.views })),
        averageViews: daily.length
          ? Math.round(daily.reduce((sum, item) => sum + item.views, 0) / daily.length)
          : 0,
        popularActions: [
          { label: 'primary', value: totals.primaryClicks },
          { label: 'links', value: totals.linkClicks },
          { label: 'projects', value: totals.projectOpens },
          { label: 'share', value: totals.shares },
        ],
      })
      setLoading(false)
      return
    }
    void loadOwnerStats(period)
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [dashboardStats, period])

  const max = useMemo(() => Math.max(1, ...(data?.series.map((item) => item.views) ?? [1])), [data])
  const axis = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0]
  const actionLabels = {
    primary: i18n.language.startsWith('en') ? 'Primary button' : 'Основная кнопка',
    links: i18n.language.startsWith('en') ? 'Links' : 'Ссылки',
    projects: t('publicCard.projects'),
    share: t('common.share'),
  }

  return (
    <main className="owner-mobile-content lg:max-w-[1180px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">{t('nav.stats')}</h1>
        <button
          className="text-sm text-[var(--accent)]"
          onClick={() => setTab(tab === 'overview' ? 'leads' : 'overview')}
        >
          {tab === 'overview'
            ? i18n.language.startsWith('en')
              ? 'Leads'
              : 'Заявки'
            : i18n.language.startsWith('en')
              ? 'Overview'
              : 'Обзор'}
        </button>
      </header>
      {tab === 'overview' ? (
        <>
          <div className="grid grid-cols-3 rounded-lg bg-[var(--surface-secondary)] p-1">
            {(
              [
                ['7', '7 дней', '7 days'],
                ['30', '30 дней', '30 days'],
                ['all', 'Всё время', 'All time'],
              ] as const
            ).map(([value, ru, en]) => (
              <button
                key={value}
                aria-pressed={period === value}
                className={`min-h-10 rounded-md text-[10px] ${period === value ? 'bg-[var(--surface)] font-semibold shadow-sm' : 'text-[var(--text-muted)]'}`}
                onClick={() => setPeriod(value)}
              >
                {i18n.language.startsWith('en') ? en : ru}
              </button>
            ))}
          </div>
          {loading ? (
            <div
              className="surface mt-3 min-h-72 animate-pulse rounded-2xl"
              aria-label={
                i18n.language.startsWith('en') ? 'Loading statistics' : 'Загрузка статистики'
              }
            />
          ) : error || !data ? (
            <div className="surface mt-3 rounded-2xl p-5 text-sm text-[var(--error)]" role="alert">
              {i18n.language.startsWith('en')
                ? 'Could not load statistics.'
                : 'Не удалось загрузить статистику.'}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  [
                    i18n.language.startsWith('en') ? 'Views' : 'Просмотры',
                    data.totals.views,
                    data.deltas.views,
                  ],
                  ['CTA', data.totals.primaryClicks, data.deltas.primaryClicks],
                  [
                    i18n.language.startsWith('en') ? 'Leads' : 'Заявки',
                    data.totals.leads,
                    data.deltas.leads,
                  ],
                ].map(([label, value, delta]) => (
                  <div key={String(label)} className="surface rounded-xl p-3">
                    <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
                    <strong className="heading-font mt-1 block text-2xl">
                      {Number(value).toLocaleString(i18n.language)}
                    </strong>
                    <span className="text-[10px] font-semibold text-[var(--success)]">
                      {deltaLabel(delta as number | null)}
                    </span>
                  </div>
                ))}
              </div>
              <section className="surface mt-3 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="heading-font m-0 text-base">
                      {i18n.language.startsWith('en') ? 'Card views' : 'Просмотры визитки'}
                    </h2>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {data.totals.views.toLocaleString(i18n.language)} · {data.range.from ?? '—'} —{' '}
                      {data.range.to ?? '—'}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-semibold text-[var(--accent)]">
                    {i18n.language.startsWith('en') ? 'Average' : 'Среднее'} {data.averageViews}/
                    {period === 'all'
                      ? i18n.language.startsWith('en')
                        ? 'month'
                        : 'месяц'
                      : i18n.language.startsWith('en')
                        ? 'day'
                        : 'день'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-[32px_1fr] gap-2">
                  <div className="flex h-36 flex-col justify-between text-right text-[8px] text-[var(--text-muted)]">
                    {axis.map((value, index) => (
                      <span key={`${value}-${index}`}>{value}</span>
                    ))}
                  </div>
                  <div className="flex h-36 items-end gap-1 border-b border-[var(--border)]">
                    {data.series.map((item) => (
                      <div
                        key={item.label}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1 text-center"
                        title={`${item.label}: ${item.views}`}
                      >
                        <div
                          className="w-full rounded-t-sm bg-[var(--accent)]"
                          style={{
                            height: `${Math.max(item.views ? 3 : 0, Math.round((item.views / max) * 88))}%`,
                          }}
                        />
                        <span className="truncate text-[7px] text-[var(--text-muted)]">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              <section className="mt-4">
                <h2 className="heading-font text-lg">
                  {i18n.language.startsWith('en') ? 'Popular actions' : 'Популярные действия'}
                </h2>
                {data.popularActions.map((item) => (
                  <div
                    key={item.label}
                    className="flex min-h-11 items-center justify-between border-b border-[var(--border)] text-sm"
                  >
                    <span className="text-[var(--text-secondary)]">{actionLabels[item.label]}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      ) : (
        <section>
          <h2 className="heading-font text-lg">
            {i18n.language.startsWith('en') ? 'Latest leads' : 'Последние заявки'}
          </h2>
          {leads.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              {i18n.language.startsWith('en') ? 'No leads yet.' : 'Заявок пока нет.'}
            </p>
          ) : null}
          <div className="grid gap-3">
            {leads.map((lead) => (
              <article key={lead.id} className="surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-sm">{lead.senderName}</strong>
                    <p className="my-1 text-xs text-[var(--text-muted)]">{lead.senderContact}</p>
                  </div>
                  <select
                    aria-label={i18n.language.startsWith('en') ? 'Lead status' : 'Статус заявки'}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs"
                    value={lead.status}
                    onChange={(event) =>
                      setLeadStatus(lead.id, event.target.value as typeof lead.status)
                    }
                  >
                    <option value="new">{i18n.language.startsWith('en') ? 'New' : 'Новая'}</option>
                    <option value="read">
                      {i18n.language.startsWith('en') ? 'Read' : 'Прочитана'}
                    </option>
                    <option value="archived">
                      {i18n.language.startsWith('en') ? 'Archived' : 'Архив'}
                    </option>
                  </select>
                </div>
                <p className="mb-0 text-sm text-[var(--text-secondary)]">{lead.message}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
