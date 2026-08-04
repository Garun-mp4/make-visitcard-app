import { useEffect } from 'react'

import { telegram } from '@/lib/telegram'

export function useTelegramBack(callback: (() => void) | null): void {
  useEffect(() => telegram.setBackButton(callback), [callback])
}
