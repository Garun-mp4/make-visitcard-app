import { Send } from 'lucide-react'

import { UnauthorizedState } from '@/components/feedback/system-state'
import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'

export function BrowserOwnerBlockPage() {
  const username = clientEnv.telegramBotUsername || 'cardly_bot'
  const url = `https://t.me/${username}`
  return <UnauthorizedState onAction={() => telegram.openTelegramLink(url)} />
}

export default BrowserOwnerBlockPage
