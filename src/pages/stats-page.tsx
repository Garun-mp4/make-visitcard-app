import { useState } from 'react'

import { useCardStore } from '@/app/card-store'

type Period = '7' | '30' | 'all'

export default function StatsPage() {
  const { leads, setLeadStatus, stats } = useCardStore()
  const [period, setPeriod] = useState<Period>('7')
  const [tab, setTab] = useState<'overview' | 'leads'>('overview')
  const max = Math.max(240, ...stats.daily.map((item) => item.views))
  return (
    <main className="owner-mobile-content lg:max-w-[1180px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">Статистика</h1>
        <button
          className="text-sm text-[var(--accent)]"
          onClick={() => setTab(tab === 'overview' ? 'leads' : 'overview')}
        >
          {tab === 'overview' ? 'Заявки' : 'Обзор'}
        </button>
      </header>
      {tab === 'overview' ? (
        <>
          <div className="grid grid-cols-3 rounded-lg bg-[var(--surface-secondary)] p-1">
            {(
              [
                ['7', '7 дней'],
                ['30', '30 дней'],
                ['all', 'Всё время'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={`min-h-10 rounded-md text-[10px] ${period === value ? 'bg-[var(--surface)] font-semibold shadow-sm' : 'text-[var(--text-muted)]'}`}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ['Просмотры', stats.totalViews, '+18%'],
              ['CTA', stats.totalPrimaryClicks, '+12%'],
              ['Заявки', stats.totalLeads, '+4'],
            ].map(([label, value, delta]) => (
              <div key={label} className="surface rounded-xl p-3">
                <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
                <strong className="heading-font mt-1 block text-2xl">
                  {value.toLocaleString('ru-RU')}
                </strong>
                <span className="text-[10px] font-semibold text-[var(--success)]">{delta}</span>
              </div>
            ))}
          </div>
          <section className="surface mt-3 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="heading-font m-0 text-base">Просмотры визитки</h2>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  1 284 за последние 7 дней · +18% к прошлому периоду
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-semibold text-[var(--accent)]">
                Среднее 183/день
              </span>
            </div>
            <div className="mt-4 grid grid-cols-[28px_1fr] gap-2">
              <div className="flex h-36 flex-col justify-between text-right text-[8px] text-[var(--text-muted)]">
                <span>240</span>
                <span>160</span>
                <span>80</span>
                <span>0</span>
              </div>
              <div className="flex h-36 items-end gap-2 border-b border-[var(--border)]">
                {stats.daily.map((item) => (
                  <div
                    key={item.date}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1 text-center"
                  >
                    <span className="text-[8px] font-semibold text-[var(--text-primary)]">
                      {item.views === 231 ? '231' : ''}
                    </span>
                    <div
                      className={`w-full rounded-t-md ${item.views === 231 ? 'bg-[var(--accent)]' : 'bg-[var(--accent-soft)]'}`}
                      style={{ height: `${Math.round((item.views / max) * 88)}%` }}
                    />
                    <span className="truncate text-[7px] text-[var(--text-muted)]">
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="mt-4">
            <h2 className="heading-font text-lg">Популярные действия</h2>
            {stats.popularActions.map((item) => (
              <div
                key={item.label}
                className="flex min-h-11 items-center justify-between border-b border-[var(--border)] text-sm"
              >
                <span className="text-[var(--text-secondary)]">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </section>
        </>
      ) : (
        <section>
          <h2 className="heading-font text-lg">Последние заявки</h2>
          <div className="grid gap-3">
            {leads.map((lead) => (
              <article key={lead.id} className="surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-sm">{lead.senderName}</strong>
                    <p className="my-1 text-xs text-[var(--text-muted)]">{lead.senderContact}</p>
                  </div>
                  <select
                    aria-label="Статус заявки"
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs"
                    value={lead.status}
                    onChange={(event) =>
                      setLeadStatus(lead.id, event.target.value as typeof lead.status)
                    }
                  >
                    <option value="new">Новая</option>
                    <option value="read">Прочитана</option>
                    <option value="archived">Архив</option>
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
