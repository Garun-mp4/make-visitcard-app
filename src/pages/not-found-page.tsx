import { useNavigate } from 'react-router-dom'

import { SystemState } from '@/components/feedback/system-state'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <SystemState
      title="Страница не найдена"
      description="Проверьте адрес или вернитесь к своей визитке."
      actionLabel="К визитке"
      onAction={() => navigate('/app/card')}
    />
  )
}
