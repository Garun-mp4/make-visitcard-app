import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { slugSchema } from '@shared/schemas'
import { PageSkeleton } from '@/components/feedback/page-skeleton'
import { SystemState } from '@/components/feedback/system-state'
import { PublicCardRenderer } from '@/features/public-card/public-card-renderer'
import { loadPublicCard } from '@/services/public-card-repository'
import { apiRequest } from '@/services/api-client'
import { clientEnv } from '@/config/client-env'

export default function PublicCardPage() {
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
      void apiRequest(`/api/public/cards/${slug}/events`, {
        method: 'POST',
        body: JSON.stringify({ type: 'card_view', source: 'web' }),
      }).catch(() => undefined)
    }
  }, [query.data, slug])

  if (!parsedSlug.success)
    return (
      <SystemState
        title="Некорректный адрес"
        description="Адрес визитки содержит недопустимые символы."
      />
    )
  if (query.isLoading) return <PageSkeleton />
  if (query.isError)
    return (
      <SystemState
        title="Не удалось загрузить визитку"
        description="Проверьте подключение к сети и попробуйте ещё раз."
        actionLabel="Повторить"
        onAction={() => void query.refetch()}
      />
    )
  if (!query.data)
    return (
      <SystemState
        title="Визитка не найдена"
        description="Возможно, владелец снял её с публикации или изменил адрес."
      />
    )

  return <PublicCardRenderer card={query.data} />
}
