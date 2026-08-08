import { ArrowLeft, ArrowRight, Check, Send, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Appearance } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, TextareaField } from '@/components/ui/field'
import { apiRequest } from '@/services/api-client'
import { clientEnv } from '@/config/client-env'
import { slugSchema } from '@shared/schemas'
import { useLocaleText } from '@/i18n/use-locale-text'

const totalSteps = 6

export default function OnboardingPage() {
  const l = useLocaleText()
  const navigate = useNavigate()
  const { card, owner, updateCard } = useCardStore()
  const [step, setStep] = useState(() =>
    Number(sessionStorage.getItem('cardly-onboarding-step') ?? 0),
  )
  const [slugState, setSlugState] = useState<'idle' | 'checking' | 'available' | 'unavailable'>(
    'idle',
  )
  useEffect(() => sessionStorage.setItem('cardly-onboarding-step', String(step)), [step])
  const next = () => setStep((current) => Math.min(totalSteps - 1, current + 1))
  const back = () => setStep((current) => Math.max(0, current - 1))
  useEffect(() => {
    if (step !== 5 || !slugSchema.safeParse(card.publication.slug).success) {
      setSlugState('idle')
      return
    }
    let active = true
    const timer = window.setTimeout(() => {
      setSlugState('checking')
      if (clientEnv.demoMode) setSlugState('available')
      else
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
  }, [card.publication.slug, step])
  const finish = () => {
    updateCard((current) => ({
      ...current,
      onboardingCompleted: true,
    }))
    sessionStorage.removeItem('cardly-onboarding-step')
    void navigate('/app/card')
  }
  const canContinue =
    step === 1
      ? card.profile.displayName.trim().length >= 2 && card.profile.profession.trim().length >= 2
      : step === 2
        ? card.primaryAction.label.trim().length >= 2 && card.primaryAction.value.trim().length >= 2
        : step === 5
          ? slugState === 'available'
          : true
  return (
    <main className="app-shell mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-5 pb-[max(20px,var(--tg-safe-bottom))]">
      <header className="flex min-h-20 items-center justify-between">
        <button
          aria-label={l('Назад', 'Back')}
          className={`grid size-11 place-items-center ${step === 0 ? 'invisible' : ''}`}
          onClick={back}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs text-[var(--text-muted)]">
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
      <section className="mt-8 flex-1">
        {step === 0 ? (
          <div className="grid justify-items-center gap-5 text-center">
            <div className="grid size-20 place-items-center rounded-3xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles size={34} />
            </div>
            <div>
              <h1 className="page-title text-3xl">
                {l('Визитка, которая работает за вас', 'A card that works for you')}
              </h1>
              <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
                {l(
                  'Импортируем профиль Telegram и за несколько коротких шагов соберём профессиональную страницу.',
                  'We import your Telegram profile and build a professional page in a few short steps.',
                )}
              </p>
            </div>
            <div className="surface flex w-full items-center gap-3 rounded-2xl p-4">
              <Avatar name={`${owner.firstName} ${owner.lastName}`} />
              <div className="text-left">
                <strong>
                  {owner.firstName} {owner.lastName}
                </strong>
                <div className="text-xs text-[var(--text-muted)]">@{owner.username}</div>
              </div>
              <Check className="ml-auto text-[var(--success)]" />
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="stack-16">
            <div>
              <h1 className="page-title">{l('Расскажите о себе', 'Tell us about yourself')}</h1>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
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
            <TextareaField
              label={l('О себе', 'About')}
              value={card.profile.bio}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, bio: event.target.value },
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
          </div>
        ) : null}
        {step === 2 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">{l('Главное действие', 'Primary action')}</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {l(
                  'Что посетитель должен сделать после знакомства?',
                  'What should a visitor do after learning about you?',
                )}
              </p>
            </div>
            <Field
              label={l('Текст кнопки', 'Button label')}
              value={card.primaryAction.label}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  primaryAction: { ...current.primaryAction, label: event.target.value },
                }))
              }
            />
            <Field
              label={l('Ссылка или контакт', 'Link or contact')}
              value={card.primaryAction.value}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  primaryAction: {
                    ...current.primaryAction,
                    value: event.target.value,
                    enabled: Boolean(event.target.value.trim()),
                  },
                }))
              }
            />
            <div className="surface rounded-2xl p-5">
              <p className="mb-3 text-xs text-[var(--text-muted)]">
                {l('Предпросмотр', 'Preview')}
              </p>
              <Button fullWidth>
                <Send size={17} />
                {card.primaryAction.label}
              </Button>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">{l('Навыки и контакты', 'Skills and contacts')}</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {l(
                  'Проверьте импортированный Telegram-контакт. Остальное можно добавить в редакторе.',
                  'Review the imported Telegram contact. You can add everything else in the editor.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {card.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs"
                >
                  {skill.label}
                </span>
              ))}
            </div>
            <div className="surface rounded-2xl p-4">
              <strong className="text-sm">{l('Публичные ссылки', 'Public links')}</strong>
              <p className="mb-0 text-xs text-[var(--text-muted)]">
                {l(
                  `${card.links.filter((link) => link.public).length} контакта будут видны посетителям.`,
                  `${card.links.filter((link) => link.public).length} contacts will be visible to visitors.`,
                )}
              </p>
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">
                {l('Выберите характер визитки', 'Choose your card style')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
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
                  onClick={() =>
                    updateCard((current) => ({
                      ...current,
                      appearance: { ...current.appearance, themeId: theme },
                    }))
                  }
                  className={`aspect-[.72] rounded-xl border p-3 text-left ${theme === 'dark' ? 'bg-[#111612] text-white' : theme === 'editorial' ? 'bg-[#f4ecdc] text-[#34281f]' : 'bg-white'} ${card.appearance.themeId === theme ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'border-[var(--border)]'}`}
                >
                  <span className="heading-font text-2xl">Aa</span>
                  <strong className="mt-auto block pt-20 text-xs capitalize">{theme}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {step === 5 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">
                {l('Последний шаг — адрес визитки', 'Final step — card address')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {l('Выберите короткий уникальный адрес.', 'Choose a short, unique address.')}
              </p>
            </div>
            <label className="field-group">
              <span className="field-label">{l('Адрес', 'Address')}</span>
              <div className="field-control flex gap-1">
                <span className="text-[var(--text-muted)]">cardly.me/</span>
                <input
                  className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
                  value={card.publication.slug}
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
                    ? l('Адрес свободен', 'Address is available')
                    : slugState === 'unavailable'
                      ? l('Адрес уже занят', 'Address is taken')
                      : l('Введите 3–30 латинских символов', 'Enter 3–30 Latin characters')}
              </span>
            </label>
            <div className="surface flex items-center gap-3 rounded-2xl p-4">
              <Avatar name={card.profile.displayName} />
              <div>
                <strong>{card.profile.displayName}</strong>
                <div className="text-xs text-[var(--text-muted)]">@{owner.username}</div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
      <Button fullWidth disabled={!canContinue} onClick={step === totalSteps - 1 ? finish : next}>
        {step === totalSteps - 1
          ? l('Создать черновик', 'Create draft')
          : step === 0
            ? l('Начать', 'Start')
            : l('Продолжить', 'Continue')}
        <ArrowRight size={17} />
      </Button>
    </main>
  )
}
