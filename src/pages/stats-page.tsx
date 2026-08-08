import { BarChart3, Inbox, MoreHorizontal, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PeriodStats, StatsPeriod } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { clientEnv } from '@/config/client-env'
import { useLocaleText } from '@/i18n/use-locale-text'
import { loadOwnerStats } from '@/services/owner-dashboard-service'

function deltaLabel(value: number | null) {
  if (value === null) return '—'
  return `${value > 0 ? '+' : ''}${value}%`
}

export function hasPeriodViews(data: PeriodStats): boolean {
  return data.totals.views > 0 && data.series.some((item) => item.views > 0)
}

export function hasPopularActions(data: PeriodStats): boolean {
  return data.popularActions.some((item) => item.value > 0)
}

export default function StatsPage() {
  const { leads, refreshDashboard, setLeadStatus, stats: dashboardStats } = useCardStore()
  const { t, i18n } = useTranslation()
  const l = useLocaleText()
  const [period, setPeriod] = useState<StatsPeriod>('7')
  const [tab, setTab] = useState<'overview' | 'leads'>('overview')
  const [data, setData] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

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
  }, [attempt, dashboardStats, period])

  const max = useMemo(() => Math.max(1, ...(data?.series.map((item) => item.views) ?? [1])), [data])
  const axis = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0]
  const actionLabels = {
    primary: l('Основная кнопка', 'Primary button'),
    links: l('Ссылки', 'Links'),
    projects: t('publicCard.projects'),
    share: t('common.share'),
  }

  const periods = [
    ['7', l('7 дней', '7 days')],
    ['30', l('30 дней', '30 days')],
    ['all', l('Всё время', 'All time')],
  ] as const

  return (
    <main className="owner-mobile-content lg:max-w-[1180px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">{tab === 'overview' ? t('nav.stats') : l('Заявки', 'Leads')}</h1>
        <button
          aria-label={
            tab === 'overview'
              ? l('Открыть заявки', 'Open leads')
              : l('Вернуться к статистике', 'Back to statistics')
          }
          className="grid size-11 place-items-center rounded-xl text-[var(--text-muted)]"
          onClick={() => setTab(tab === 'overview' ? 'leads' : 'overview')}
        >
          <MoreHorizontal size={20} />
        </button>
      </header>

      {tab === 'overview' ? (
        <>
          <div className="grid grid-cols-3 rounded-lg bg-[var(--surface-secondary)] p-1 lg:ml-auto lg:max-w-[360px]">
            {periods.map(([value, label]) => (
              <button
                key={value}
                aria-pressed={period === value}
                className={`min-h-10 rounded-md text-[10px] ${period === value ? 'bg-[var(--surface)] font-semibold shadow-sm' : 'text-[var(--text-muted)]'}`}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div
              className="mt-3 grid gap-3"
              aria-label={l('Загрузка статистики', 'Loading statistics')}
            >
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="surface min-h-24 animate-pulse rounded-xl" />
                ))}
              </div>
              <div className="surface min-h-72 animate-pulse rounded-2xl" />
            </div>
          ) : error || !data ? (
            <div
              className="surface mt-3 grid justify-items-center gap-4 rounded-2xl p-8 text-center"
              role="alert"
            >
              <RefreshCw size={24} className="text-[var(--error)]" />
              <div>
                <strong>{l('Не удалось загрузить статистику', 'Could not load statistics')}</strong>
                <p className="mb-0 mt-2 text-sm text-[var(--text-muted)]">
                  {l('Проверьте соединение и повторите.', 'Check the connection and try again.')}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>
                {l('Повторить', 'Retry')}
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-5 lg:gap-3">
                {[
                  [l('Просмотры', 'Views'), data.totals.views, data.deltas.views, true],
                  ['CTA', data.totals.primaryClicks, data.deltas.primaryClicks, true],
                  [l('Ссылки', 'Links'), data.totals.linkClicks, null, false],
                  [l('Проекты', 'Projects'), data.totals.projectOpens, null, false],
                  [l('Заявки', 'Leads'), data.totals.leads, data.deltas.leads, true],
                ].map(([label, value, delta, mobile], index) => (
                  <article
                    key={String(label)}
                    className={`surface rounded-xl p-3 lg:p-4 ${mobile ? '' : 'hidden lg:block'}`}
                  >
                    <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
                    <strong className="heading-font mt-1 block text-2xl tabular-nums">
                      {Number(value).toLocaleString(i18n.language)}
                    </strong>
                    <span className="text-[10px] font-semibold text-[var(--success)]">
                      {index < 2 || index === 4 ? deltaLabel(delta as number | null) : '—'}
                    </span>
                  </article>
                ))}
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,.65fr)]">
                <section className="surface min-w-0 rounded-2xl p-4 lg:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="heading-font m-0 text-base">
                        {l('Просмотры визитки', 'Card views')}
                      </h2>
                      <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                        {data.totals.views.toLocaleString(i18n.language)} · {data.range.from ?? '—'}{' '}
                        — {data.range.to ?? '—'}
                      </p>
                    </div>
                    {hasPeriodViews(data) ? (
                      <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-semibold text-[var(--accent)]">
                        {l('Среднее', 'Average')} {data.averageViews}/
                        {period === 'all' ? l('месяц', 'month') : l('день', 'day')}
                      </span>
                    ) : null}
                  </div>

                  {hasPeriodViews(data) ? (
                    <div className="mt-5 grid grid-cols-[32px_minmax(0,1fr)] gap-2">
                      <div className="flex h-44 flex-col justify-between text-right text-[8px] text-[var(--text-muted)]">
                        {axis.map((value, index) => (
                          <span key={`${value}-${index}`}>{value}</span>
                        ))}
                      </div>
                      <div className="flex h-44 min-w-0 items-end gap-1 border-b border-[var(--border)]">
                        {data.series.map((item, index) => (
                          <div
                            key={`${item.label}-${index}`}
                            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1 text-center"
                            title={`${item.label}: ${item.views}`}
                            aria-label={`${item.label}: ${item.views}`}
                          >
                            <div
                              className="w-full rounded-t-sm bg-[var(--accent)]"
                              style={{
                                height: `${Math.max(3, Math.round((item.views / max) * 88))}%`,
                              }}
                            />
                            <span className="truncate text-[7px] text-[var(--text-muted)]">
                              {period !== '30' ||
                              index % 5 === 0 ||
                              index === data.series.length - 1
                                ? item.label
                                : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid min-h-52 place-items-center text-center">
                      <div className="max-w-sm">
                        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                          <BarChart3 size={22} />
                        </span>
                        <h3 className="heading-font mb-0 mt-4 text-base">
                          {l('За этот период просмотров не было', 'No views in this period')}
                        </h3>
                        <p className="mb-0 mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                          {l(
                            'Статистика появится после первых посещений публичной визитки.',
                            'Statistics will appear after the first visits to your public card.',
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="surface rounded-2xl p-4 lg:p-5">
                  <h2 className="heading-font m-0 text-lg">
                    {l('Популярные действия', 'Popular actions')}
                  </h2>
                  {hasPopularActions(data) ? (
                    <div className="mt-3">
                      {data.popularActions.map((item) => (
                        <div
                          key={item.label}
                          className="flex min-h-11 items-center justify-between border-b border-[var(--border)] text-sm last:border-0"
                        >
                          <span className="text-[var(--text-secondary)]">
                            {actionLabels[item.label]}
                          </span>
                          <strong className="tabular-nums">{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid min-h-44 place-items-center text-center text-sm text-[var(--text-muted)]">
                      {l('Действий посетителей пока нет.', 'No visitor actions yet.')}
                    </div>
                  )}
                </section>
              </div>

              <section className="surface mt-4 hidden rounded-2xl p-5 lg:block">
                <div className="flex items-center justify-between">
                  <h2 className="heading-font m-0 text-lg">
                    {l('Последние заявки', 'Latest leads')}
                  </h2>
                  <button
                    className="text-xs font-semibold text-[var(--accent)]"
                    onClick={() => setTab('leads')}
                  >
                    {l('Все заявки', 'All leads')}
                  </button>
                </div>
                {leads.length ? (
                  <div className="mt-3 divide-y divide-[var(--border)]">
                    {leads.slice(0, 3).map((lead) => (
                      <div
                        key={lead.id}
                        className="grid min-h-14 grid-cols-[1fr_1.5fr_auto] items-center gap-4 text-sm"
                      >
                        <strong>{lead.senderName}</strong>
                        <span className="truncate text-[var(--text-secondary)]">
                          {lead.message}
                        </span>
                        <span className="text-[10px] uppercase text-[var(--accent)]">
                          {lead.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-0 mt-3 text-sm text-[var(--text-muted)]">
                    {l('Заявок пока нет.', 'No leads yet.')}
                  </p>
                )}
              </section>
            </>
          )}
        </>
      ) : (
        <section>
          {leads.length === 0 ? (
            <div className="surface grid min-h-64 place-items-center rounded-2xl p-8 text-center">
              <div>
                <Inbox className="mx-auto text-[var(--accent)]" size={28} />
                <h2 className="heading-font mb-0 mt-4 text-lg">
                  {l('Заявок пока нет', 'No leads yet')}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {l('Новые обращения появятся здесь.', 'New requests will appear here.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {leads.map((lead) => (
                <article key={lead.id} className="surface rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="text-sm">{lead.senderName}</strong>
                      <p className="my-1 truncate text-xs text-[var(--text-muted)]">
                        {lead.senderContact}
                      </p>
                    </div>
                    <select
                      aria-label={l('Статус заявки', 'Lead status')}
                      className="rounded-lg border border-[var(--border)] bg-[var(--control-background)] p-2 text-xs"
                      value={lead.status}
                      onChange={(event) =>
                        setLeadStatus(lead.id, event.target.value as typeof lead.status)
                      }
                    >
                      <option value="new">{l('Новая', 'New')}</option>
                      <option value="read">{l('Прочитана', 'Read')}</option>
                      <option value="archived">{l('Архив', 'Archived')}</option>
                    </select>
                  </div>
                  <p className="mb-0 text-sm text-[var(--text-secondary)]">{lead.message}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
