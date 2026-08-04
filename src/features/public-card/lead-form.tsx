import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { leadSchema } from '@shared/schemas'
import type { LeadInput } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Field, TextareaField } from '@/components/ui/field'
import { clientEnv } from '@/config/client-env'
import { apiRequest, ApiError } from '@/services/api-client'
import { telegram } from '@/lib/telegram'

export function LeadForm({ slug }: { slug: string }) {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      senderName: '',
      senderContact: '',
      message: '',
      source: telegram.available ? 'telegram' : 'web',
      website: '',
    },
  })

  const submit = async (value: LeadInput) => {
    setServerError('')
    if (!navigator.onLine) {
      setServerError('Нет подключения к сети. Данные формы сохранены.')
      return
    }
    try {
      if (!clientEnv.demoMode)
        await apiRequest(`/api/public/cards/${slug}/leads`, {
          method: 'POST',
          body: JSON.stringify(value),
        })
      setSuccess(true)
      reset()
      telegram.notify('success')
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.status === 429
          ? 'Слишком много попыток. Попробуйте позже.'
          : 'Не удалось отправить заявку. Проверьте данные и повторите.',
      )
    }
  }

  if (success)
    return (
      <section className="grid gap-3 py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto text-[var(--success)]" size={34} aria-hidden="true" />
        <h2 className="heading-font m-0 text-2xl">Заявка отправлена</h2>
        <p className="m-0 text-sm text-[var(--text-secondary)]">
          Алексей получил сообщение и сможет ответить по указанному контакту.
        </p>
        <Button variant="secondary" onClick={() => setSuccess(false)}>
          Отправить ещё одну
        </Button>
      </section>
    )

  return (
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(submit)(event)} noValidate>
      <h2 className="heading-font m-0 text-2xl">Обсудим задачу?</h2>
      <p className="m-0 text-sm text-[var(--text-secondary)]">
        Обычно Алексей отвечает в течение рабочего дня.
      </p>
      <Field
        label="Имя"
        autoComplete="name"
        error={errors.senderName?.message}
        {...register('senderName')}
      />
      <Field
        label="Контакт"
        placeholder="@username или email"
        autoComplete="email"
        error={errors.senderContact?.message}
        {...register('senderContact')}
      />
      <TextareaField label="Сообщение" error={errors.message?.message} {...register('message')} />
      <label className="visually-hidden">
        Сайт
        <input tabIndex={-1} autoComplete="off" {...register('website')} />
      </label>
      {serverError ? (
        <p className="error-text" role="alert">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        <Send size={17} aria-hidden="true" />
        {isSubmitting ? 'Отправляем…' : 'Отправить заявку'}
      </Button>
    </form>
  )
}
