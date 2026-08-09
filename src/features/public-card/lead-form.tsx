import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { leadSchema } from '@shared/schemas'
import type { LeadInput } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Field, TextareaField } from '@/components/ui/field'
import { clientEnv } from '@/config/client-env'
import { apiRequest, ApiError } from '@/services/api-client'
import { telegram } from '@/lib/telegram'
import { useLocaleText } from '@/i18n/use-locale-text'

export function LeadForm({
  slug,
  ownerName,
  previewMode = false,
  variant = 'clean',
}: {
  slug: string
  ownerName: string
  previewMode?: boolean
  variant?: 'clean' | 'dark' | 'editorial'
}) {
  const recipientName = ownerName.trim().split(/\s+/)[0] || ownerName
  const { t } = useTranslation()
  const l = useLocaleText()
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
    if (previewMode) {
      setServerError(
        l(
          'Это предпросмотр владельца — заявка не отправлена.',
          'This is the owner preview — the request was not sent.',
        ),
      )
      return
    }
    if (!navigator.onLine) {
      setServerError(
        l(
          'Нет подключения к сети. Данные формы сохранены.',
          'No internet connection. Your form data is preserved.',
        ),
      )
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
          ? l('Слишком много попыток. Попробуйте позже.', 'Too many attempts. Try again later.')
          : l(
              'Не удалось отправить заявку. Проверьте данные и повторите.',
              'Could not send the request. Check the data and try again.',
            ),
      )
    }
  }

  if (success)
    return (
      <section className="grid gap-3 py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto text-[var(--success)]" size={34} aria-hidden="true" />
        <h2 className="heading-font m-0 text-2xl">{t('publicCard.sent')}</h2>
        <p className="m-0 text-sm text-[var(--text-secondary)]">
          {t('publicCard.received', { name: recipientName })}
        </p>
        <Button variant="secondary" onClick={() => setSuccess(false)}>
          {t('publicCard.sendAgain')}
        </Button>
      </section>
    )

  return (
    <form
      className="public-lead-form grid gap-2.5"
      data-public-form-theme={variant}
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <h2 className="heading-font m-0 text-2xl">{t('publicCard.formTitle')}</h2>
      <p className="sr-only">{t('publicCard.usuallyReplies', { name: recipientName })}</p>
      <Field
        label={t('publicCard.name')}
        placeholder={l('Как к вам обращаться', 'Your name')}
        autoComplete="name"
        error={errors.senderName ? t('validation.name') : undefined}
        {...register('senderName')}
      />
      <Field
        label={t('publicCard.contact')}
        placeholder={l('@username или email', '@username or email')}
        autoComplete="email"
        error={errors.senderContact ? t('validation.contact') : undefined}
        {...register('senderContact')}
      />
      <TextareaField
        label={t('publicCard.message')}
        placeholder={l('Коротко о задаче', 'A few words about the project')}
        error={errors.message ? t('validation.message') : undefined}
        {...register('message')}
      />
      <label className="hidden" aria-hidden="true">
        {l('Сайт', 'Website')}
        <input tabIndex={-1} aria-hidden="true" autoComplete="off" {...register('website')} />
      </label>
      {serverError ? (
        <p className="error-text" role="alert">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        <Send size={17} aria-hidden="true" />
        {isSubmitting ? t('publicCard.submitting') : t('publicCard.submit')}
      </Button>
    </form>
  )
}
