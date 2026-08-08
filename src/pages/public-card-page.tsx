import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { slugSchema } from '@shared/schemas'
import { PageSkeleton } from '@/components/feedback/page-skeleton'
import { SystemState } from '@/components/feedback/system-state'
import { PublicCardRenderer } from '@/features/public-card/public-card-renderer'
import { loadPublicCard } from '@/services/public-card-repository'
import { recordPublicEvent } from '@/services/public-analytics'
import { clientEnv } from '@/config/client-env'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function PublicCardPage() {
  const l = useLocaleText()
  const params = useParams()
  const parsedSlug = slugSchema.safeParse(params.slug)
  const slug = parsedSlug.success ? parsedSlug.data : ''
  const query = useQuery({
    queryKey: ['public-card', slug],
    queryFn: () => loadPublicCard(slug),
    enabled: Boolean(slug),
  })

  useEffect(() => {
    if (!clientEnv.demoMode && slug && query.data) {
      recordPublicEvent(slug, 'card_view')
    }
  }, [query.data, slug])

  if (!parsedSlug.success)
    return (
      <SystemState
        title={l('Некорректный адрес', 'Invalid address')}
        description={l(
          'Адрес визитки содержит недопустимые символы.',
          'The card address contains invalid characters.',
        )}
      />
    )
  if (query.isLoading) return <PageSkeleton />
  if (query.isError)
    return (
      <SystemState
        title={l('Не удалось загрузить визитку', 'Could not load the card')}
        description={l(
          'Проверьте подключение к сети и попробуйте ещё раз.',
          'Check your connection and try again.',
        )}
        actionLabel={l('Повторить', 'Retry')}
        onAction={() => void query.refetch()}
      />
    )
  if (!query.data)
    return (
      <SystemState
        title={l('Визитка не найдена', 'Card not found')}
        description={l(
          'Возможно, владелец снял её с публикации или изменил адрес.',
          'The owner may have unpublished the card or changed its address.',
        )}
      />
    )

  return <PublicCardRenderer card={query.data} />
}
