import { ArrowLeft, ArrowRight, Check, Send, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Appearance } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, TextareaField } from '@/components/ui/field'

const totalSteps = 6

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { card, owner, updateCard } = useCardStore()
  const [step, setStep] = useState(() =>
    Number(sessionStorage.getItem('cardly-onboarding-step') ?? 0),
  )
  useEffect(() => sessionStorage.setItem('cardly-onboarding-step', String(step)), [step])
  const next = () => setStep((current) => Math.min(totalSteps - 1, current + 1))
  const back = () => setStep((current) => Math.max(0, current - 1))
  const finish = () => {
    updateCard((current) => ({
      ...current,
      onboardingCompleted: true,
      publication: {
        ...current.publication,
        published: true,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
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
          ? card.publication.slug.length >= 3
          : true
  return (
    <main className="app-shell mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-5 pb-[max(20px,var(--tg-safe-bottom))]">
      <header className="flex min-h-20 items-center justify-between">
        <button
          aria-label="Назад"
          className={`grid size-11 place-items-center ${step === 0 ? 'invisible' : ''}`}
          onClick={back}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs text-[var(--text-muted)]">Черновик сохранён</span>
      </header>
      <div className="grid grid-cols-6 gap-1.5" aria-label={`Шаг ${step + 1} из ${totalSteps}`}>
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
              <h1 className="page-title text-3xl">Визитка, которая работает за вас</h1>
              <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
                Импортируем профиль Telegram и за несколько коротких шагов соберём профессиональную
                страницу.
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
              <h1 className="page-title">Расскажите о себе</h1>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Коротко и по делу — посетитель должен сразу понять вашу специализацию.
              </p>
            </div>
            <Field
              label="Имя"
              value={card.profile.displayName}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, displayName: event.target.value },
                }))
              }
            />
            <Field
              label="Профессия"
              value={card.profile.profession}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, profession: event.target.value },
                }))
              }
            />
            <TextareaField
              label="О себе"
              value={card.profile.bio}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  profile: { ...current.profile, bio: event.target.value },
                }))
              }
            />
            <Field
              label="Город"
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
              <h1 className="page-title">Главное действие</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Что посетитель должен сделать после знакомства?
              </p>
            </div>
            <Field
              label="Текст кнопки"
              value={card.primaryAction.label}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  primaryAction: { ...current.primaryAction, label: event.target.value },
                }))
              }
            />
            <Field
              label="Ссылка или контакт"
              value={card.primaryAction.value}
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  primaryAction: { ...current.primaryAction, value: event.target.value },
                }))
              }
            />
            <div className="surface rounded-2xl p-5">
              <p className="mb-3 text-xs text-[var(--text-muted)]">Предпросмотр</p>
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
              <h1 className="page-title">Навыки и контакты</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Мы уже добавили данные из примера — их можно изменить после запуска.
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
              <strong className="text-sm">Публичные ссылки</strong>
              <p className="mb-0 text-xs text-[var(--text-muted)]">
                {card.links.filter((link) => link.public).length} контакта будут видны посетителям.
              </p>
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="stack-20">
            <div>
              <h1 className="page-title">Выберите характер визитки</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Тему и акцент можно изменить после публикации.
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
              <h1 className="page-title">Последний шаг — адрес визитки</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Выберите короткий уникальный адрес.
              </p>
            </div>
            <label className="field-group">
              <span className="field-label">Адрес</span>
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
              <span className="helper-text !text-[var(--success)]">Адрес свободен</span>
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
        {step === totalSteps - 1 ? 'Опубликовать визитку' : step === 0 ? 'Начать' : 'Продолжить'}
        <ArrowRight size={17} />
      </Button>
    </main>
  )
}
