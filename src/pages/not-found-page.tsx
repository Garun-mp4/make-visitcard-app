import { useNavigate } from 'react-router-dom'

import { SystemState } from '@/components/feedback/system-state'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const l = useLocaleText()
  return (
    <SystemState
      title={l('Страница не найдена', 'Page not found')}
      description={l(
        'Проверьте адрес или вернитесь к своей визитке.',
        'Check the address or return to your card.',
      )}
      actionLabel={l('К визитке', 'Go to card')}
      onAction={() => navigate('/app/card')}
    />
  )
}
