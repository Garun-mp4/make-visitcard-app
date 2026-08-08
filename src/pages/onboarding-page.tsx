import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Mail,
  Phone,
  Plus,
  Send,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Appearance, CardDraft } from '@shared/types'
import { slugSchema } from '@shared/schemas'
import { useCardStore } from '@/app/card-store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { clientEnv } from '@/config/client-env'
import { useLocaleText } from '@/i18n/use-locale-text'
import { accentOptions } from '@/lib/accent-preset'
import { apiRequest } from '@/services/api-client'

const totalSteps = 6
type OnboardingMode = 'initial' | 'revisit'
type ActionType = CardDraft['primaryAction']['type']

const actionOptions: Array<{
  type: ActionType
  ru: string
  en: string
  icon: typeof Send
}> = [
  { type: 'telegram', ru: 'Написать в Telegram', en: 'Message in Telegram', icon: Send },
  { type: 'email', ru: 'Отправить email', en: 'Send an email', icon: Mail },
  { type: 'phone', ru: 'Позвонить', en: 'Make a call', icon: Phone },
  { type: 'booking', ru: 'Записаться', en: 'Book a meeting', icon: CalendarDays },
]

function actionPlaceholder(type: ActionType, username: string, english: boolean) {
  if (type === 'telegram') return username ? `https://t.me/${username}` : 'https://t.me/username'
  if (type === 'email') return 'name@example.com'
  if (type === 'phone') return '+7 900 000-00-00'
  if (type === 'booking') return 'https://cal.com/username'
  return english ? 'Link or contact' : 'Ссылка или контакт'
}

export default function OnboardingPage({ mode = 'initial' }: { mode?: OnboardingMode }) {
  const l = useLocaleText()
  const navigate = useNavigate()
  const { card, owner, updateCard } = useCardStore()
  const storageKey = `cardly-onboarding-${mode}-step`
  const [step, setStep] = useState(() =>
    mode === 'revisit' ? 0 : Number(sessionStorage.getItem(storageKey) ?? 0),
  )
  const [skill, setSkill] = useState('')
  const [slugState, setSlugState] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle')
  const english = document.documentElement.lang.startsWith('en')

  useEffect(() => {
    if (mode === 'revisit') sessionStorage.removeItem(storageKey)
  }, [mode, storageKey])
  useEffect(() => sessionStorage.setItem(storageKey, String(step)), [step, storageKey])

  const next = () => setStep((current) => Math.min(totalSteps - 1, current + 1))
  const back = () => {
    if (step === 0 && mode === 'revisit') {
      void navigate('/app/profile')
      return
    }
    setStep((current) => Math.max(0, current - 1))
  }

  useEffect(() => {
    if (step !== 5 || !slugSchema.safeParse(card.publication.slug).success) {
      setSlugState('idle')
      return
    }
    let active = true
    const timer = window.setTimeout(() => {
      setSlugState('checking')
      if (clientEnv.demoMode || (mode === 'revisit' && card.publication.published)) {
        setSlugState('available')
        return
      }
      void apiRequest<{ available: boolean }>('/api/slugs/check', {
        method: 'POST',
        body: JSON.stringify({ slug: card.publication.slug }),
      })
        .then((result) => {
          if (active) setSlugState(result.available ? 'available' : 'unavailable')
        })
        .catch(() => {
          if (active) setSlugState('unavailable')
        })
    }, 450)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [card.publication.published, card.publication.slug, mode, step])

  const websiteLink = useMemo(
    () => card.links.find((link) => link.type === 'website'),
    [card.links],
  )
  const updateWebsite = (url: string) =>
    updateCard((current) => {
      const existing = current.links.find((link) => link.type === 'website')
      if (existing)
        return {
          ...current,
          links: current.links.map((link) =>
            link.id === existing.id ? { ...link, url, enabled: Boolean(url.trim()) } : link,
          ),
        }
      return {
        ...current,
        links: [
          ...current.links,
          {
            id: crypto.randomUUID(),
            type: 'website',
            label: l('Портфолио', 'Portfolio'),
            url,
            enabled: Boolean(url.trim()),
            public: true,
            position: current.links.length,
          },
        ],
      }
    })

  const addSkill = () => {
    const label = skill.trim().replace(/\s+/g, ' ')
    if (!label || label.length > 30 || card.skills.length >= 10) return
    if (card.skills.some((item) => item.label.toLowerCase() === label.toLowerCase())) return
    updateCard((current) => ({
      ...current,
      skills: [
        ...current.skills,
        { id: crypto.randomUUID(), label, position: current.skills.length },
      ],
    }))
    setSkill('')
  }

  const finish = () => {
    if (mode === 'initial')
      updateCard((current) => ({
        ...current,
        onboardingCompleted: true,
      }))
    sessionStorage.removeItem(storageKey)
    void navigate('/app/card')
  }

  const canContinue =
    step === 1
      ? card.profile.displayName.trim().length >= 2 && card.profile.profession.trim().length >= 2
      : step === 2
        ? card.primaryAction.label.trim().length >= 2 &&
          card.primaryAction.value.trim().length >= 2
        : step === 5
          ? slugState === 'available'
          : true

  return (
    <main className="app-shell mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-5 pb-[max(20px,var(--tg-safe-bottom))]">
      <header className="flex min-h-[72px] items-center justify-between">
        <button
          aria-label={l('Назад', 'Back')}
          className={`grid size-11 place-items-center ${step === 0 && mode === 'initial' ? 'invisible' : ''}`}
          onClick={back}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[11px] text-[var(--text-muted)]">
          {l('Черновик сохранён', 'Draft saved')}
        </span>
      </header>

      <div
        className="grid grid-cols-6 gap-1.5"
        aria-label={l(`Шаг ${step + 1} из ${totalSteps}`, `Step ${step + 1} of ${totalSteps}`)}
      >
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            key={index}
            className={`h-1 rounded-full ${index <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
          />
        ))}
      </div>

      <section className="mt-7 flex-1 pb-8">
        {step === 0 ? (
          <div className="grid gap-5">
            <div>
              <h1 className="page-title max-w-[360px] text-[30px]">
                {l(
                  'Ваша профессиональная визитка — внутри Telegram',
                  'Your professional card — inside Telegram',
                )}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                {l(
                  'Мы уже получили данные профиля. Проверьте их и продолжайте.',
                  'We already imported your profile. Review it and continue.',
                )}
              </p>
            </div>
            <div className="surface flex items-center gap-3 rounded-2xl p-4">
              <Avatar name={`${owner.firstName} ${owner.lastName}`} src={owner.photoUrl} />
              <div className="min-w-0 text-left">
                <strong className="block truncate text-sm">
                  {owner.firstName} {owner.lastName}
                </strong>
                <div className="truncate text-xs text-[var(--text-muted)]">@{owner.username}</div>
              </div>
              <Check className="ml-auto shrink-0 text-[var(--success)]" size={19} />
            </div>
            <div className="rounded-2xl bg-[var(--accent-soft)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {mode === 'revisit'
                ? l(
                    'Текущие данные и публикация сохранятся. Вы сможете спокойно проверить каждый шаг заново.',
                    'Your current data and publication stay intact while you review every step.',
                  )
                : l(
                    'Соберите страницу и подготовьте её к публикации за 3–5 минут.',
                    'Build your page and prepare it for publication in 3–5 minutes.',
                  )}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="stack-16">
            <div>
              <h1 className="page-title">{l('Расскажите о себе', 'Tell us about yourself')}</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {l(
                  'Коротко и по делу — посетитель должен сразу понять вашу специализацию.',
                  'Keep it concise — visitors should immediately understand your expertise.',
                )}
              </p>
            </div>
            <Field
              label={l('Имя', 'Name')}
              value={card.profile.displayName}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, displayName: event.target.value },
                }))
              }
            />
            <Field
              label={l('Профессия', 'Profession')}
              value={card.profile.profession}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, profession: event.target.value },
                }))
              }
            />
            <Field
              label={l('Город', 'City')}
              value={card.profile.location}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, location: event.target.value },
                }))
              }
            />
            <label className="field-group">
              <span className="field-label">{l('Формат работы', 'Work format')}</span>
              <select
                className="field-control"
                value={card.profile.workFormat}
                onChange={(event) =>
                  updateCard((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      workFormat: event.target.value as CardDraft['profile']['workFormat'],
                    },
                  }))
                }
              >
                <option value="remote">{l('Удалённо', 'Remote')}</option>
                <option value="hybrid">{l('Удалённо · гибрид', 'Remote · hybrid')}</option>
                <option value="office">{l('В офисе', 'Office')}</option>
                <option value="flexible">{l('Гибкий формат', 'Flexible')}</option>
              </select>
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="stack-16">
            <div>
              <h1 className="page-title">{l('Выберите главное действие', 'Choose a primary action')}</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {l(
                  'Эта кнопка будет самой заметной на публичной визитке.',
                  'This will be the most prominent button on your public card.',
                )}
              </p>
            </div>
            <div className="grid gap-2">
              {actionOptions.map(({ type, ru, en, icon: Icon }) => {
                const selected = card.primaryAction.type === type
                return (
                  <button
                    key={type}
                    aria-pressed={selected}
                    className={`surface flex min-h-14 items-center gap-3 rounded-xl px-4 text-left text-sm ${selected ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : ''}`}
                    onClick={() =>
                      updateCard((current) => ({
                        ...current,
                        primaryAction: {
                          ...current.primaryAction,
                          type,
                          label: l(ru, en),
                          value:
                            current.primaryAction.type === type
                              ? current.primaryAction.value
                              : type === 'telegram' && owner.username
                                ? `https://t.me/${owner.username}`
                                : '',
                          enabled: true,
                        },
                      }))
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="flex-1">{l(ru, en)}</span>
                    {selected ? <Check size={17} /> : null}
                  </button>
                )
              })}
            </div>
            <Field
              label={l('Ссылка или контакт', 'Link or contact')}
              placeholder={actionPlaceholder(card.primaryAction.type, owner.username, english)}
              value={card.primaryAction.value}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  primaryAction: { ...current.primaryAction, value: event.target.value },
                }))
              }
            />
            <div className="surface rounded-2xl p-4">
              <p className="mb-3 mt-0 text-[11px] text-[var(--text-muted)]">
                {l('Предпросмотр кнопки', 'Button preview')}
              </p>
              <Button fullWidth>
                <Send size={17} />
                {card.primaryAction.label || l('Главное действие', 'Primary action')}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="stack-16">
            <div>
              <h1 className="page-title">{l('Навыки и ссылки', 'Skills and links')}</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {l(
                  'Добавьте до 10 навыков и ключевые площадки.',
                  'Add up to 10 skills and your key platforms.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {card.skills.map((item) => (
                <button
                  key={item.id}
                  aria-label={l(`Удалить ${item.label}`, `Remove ${item.label}`)}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs"
                  onClick={() =>
                    updateCard((current) => ({
                      ...current,
                      skills: current.skills.filter((currentSkill) => currentSkill.id !== item.id),
                    }))
                  }
                >
                  {item.label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Field
                label={l('Добавить навык', 'Add skill')}
                aria-label={l('Добавить навык', 'Add skill')}
                placeholder={l('Добавить навык', 'Add a skill')}
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button
                aria-label={l('Добавить навык', 'Add skill')}
                className="mt-auto size-12 shrink-0 px-0"
                disabled={!skill.trim() || card.skills.length >= 10}
                onClick={addSkill}
              >
                <Plus size={18} />
              </Button>
            </div>
            <p className="helper-text">{card.skills.length} / 10</p>
            <Field
              label={l('Ссылка на портфолио', 'Portfolio link')}
              placeholder="https://behance.net/username"
              value={websiteLink?.url ?? ''}
              onChange={(event) => updateWebsite(event.target.value)}
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">{l('Выберите характер визитки', 'Choose your card style')}</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {l(
                  'Тему и акцент можно изменить после публикации.',
                  'You can change the theme and accent after publication.',
                )}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['clean', 'dark', 'editorial'] as Appearance['themeId'][]).map((theme) => (
                <button
                  key={theme}
                  aria-pressed={card.appearance.themeId === theme}
                  onClick={() =>
                    updateCard((current) => ({
                      ...current,
                      appearance: { ...current.appearance, themeId: theme },
                    }))
                  }
                  className={`flex aspect-[.72] flex-col rounded-xl border p-3 text-left ${theme === 'dark' ? 'bg-[#111612] text-white' : theme === 'editorial' ? 'bg-[#f4ecdc] text-[#34281f]' : 'bg-white text-[#171916]'} ${card.appearance.themeId === theme ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'border-[var(--border)]'}`}
                >
                  <span className="heading-font text-2xl">Aa</span>
                  <strong className="mt-auto text-xs capitalize">{theme}</strong>
                </button>
              ))}
            </div>
            <div>
              <h2 className="heading-font mb-3 mt-0 text-base">{l('Акцент', 'Accent')}</h2>
              <div className="flex gap-3" role="group" aria-label={l('Цвет акцента', 'Accent color')}>
                {accentOptions.map((option) => (
                  <button
                    key={option.id}
                    aria-label={`${l('Акцент', 'Accent')} ${option.id}`}
                    aria-pressed={card.appearance.accentPreset === option.id}
                    className={`grid size-11 place-items-center rounded-full ${card.appearance.accentPreset === option.id ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--background)]' : ''}`}
                    onClick={() =>
                      updateCard((current) => ({
                        ...current,
                        appearance: { ...current.appearance, accentPreset: option.id },
                      }))
                    }
                  >
                    <span className="size-8 rounded-full" style={{ backgroundColor: option.color }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">{l('Последний шаг — адрес визитки', 'Final step — card address')}</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {card.publication.published
                  ? l('Опубликованный адрес остаётся за вами.', 'Your published address stays reserved.')
                  : l('Выберите короткий уникальный адрес.', 'Choose a short, unique address.')}
              </p>
            </div>
            <label className="field-group">
              <span className="field-label">{l('Адрес', 'Address')}</span>
              <div className="field-control flex gap-1">
                <span className="text-[var(--text-muted)]">cardly.me/</span>
                <input
                  className="min-w-0 flex-1 bg-transparent font-semibold outline-none disabled:text-[var(--text-muted)]"
                  value={card.publication.slug}
                  disabled={card.publication.published}
                  onChange={(event) =>
                    updateCard((current) => ({
                      ...current,
                      publication: {
                        ...current.publication,
                        slug: event.target.value.toLowerCase(),
                      },
                    }))
                  }
                />
              </div>
              <span
                className={`helper-text ${slugState === 'available' ? '!text-[var(--success)]' : slugState === 'unavailable' ? '!text-[var(--error)]' : ''}`}
              >
                {slugState === 'checking'
                  ? l('Проверяем адрес…', 'Checking address…')
                  : slugState === 'available'
                    ? l('✓ Адрес свободен', '✓ Address is available')
                    : slugState === 'unavailable'
                      ? l('Адрес уже занят', 'Address is taken')
                      : l('Введите 3–30 латинских символов', 'Enter 3–30 Latin characters')}
              </span>
            </label>
            <div className="surface flex items-center gap-3 rounded-2xl p-4">
              <Avatar name={card.profile.displayName} src={owner.photoUrl} />
              <div className="min-w-0">
                <strong className="block truncate text-sm">{card.profile.displayName}</strong>
                <div className="truncate text-xs text-[var(--text-muted)]">@{owner.username}</div>
              </div>
            </div>
            <p className="m-0 text-xs leading-relaxed text-[var(--text-muted)]">
              {l(
                'Профиль и контакты можно изменить в любое время.',
                'You can change your profile and contacts at any time.',
              )}
            </p>
          </div>
        ) : null}
      </section>

      <Button fullWidth disabled={!canContinue} onClick={step === totalSteps - 1 ? finish : next}>
        {step === totalSteps - 1
          ? mode === 'revisit'
            ? l('Сохранить изменения', 'Save changes')
            : l('Создать черновик', 'Create draft')
          : l('Продолжить', 'Continue')}
        <ArrowRight size={17} />
      </Button>
    </main>
  )
}
