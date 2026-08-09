import { startParameterSchema } from '@shared/schemas'
import type { TelegramUser } from '@shared/types'

type EventName = 'themeChanged' | 'viewportChanged' | 'safeAreaChanged' | 'contentSafeAreaChanged'

interface TelegramBackButton {
  show(): void
  hide(): void
  onClick(callback: () => void): void
  offClick(callback: () => void): void
}

interface TelegramWebApp {
  initData?: string
  initDataUnsafe?: {
    user?: TelegramUser
    start_param?: string
  }
  colorScheme?: 'light' | 'dark'
  themeParams?: Record<string, string>
  viewportHeight?: number
  viewportStableHeight?: number
  safeAreaInset?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  contentSafeAreaInset?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  platform?: string
  version?: string
  BackButton?: TelegramBackButton
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
  }
  ready?(): void
  expand?(): void
  openLink?(url: string, options?: { try_instant_view?: boolean }): void
  openTelegramLink?(url: string): void
  onEvent?(event: EventName, callback: () => void): void
  offEvent?(event: EventName, callback: () => void): void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

function webApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp
}

function readInset(
  source: TelegramWebApp['safeAreaInset'],
  side: 'top' | 'right' | 'bottom' | 'left',
) {
  return Math.max(0, source?.[side] ?? 0)
}

function syncViewportVariables(): void {
  const app = webApp()
  const root = document.documentElement
  const viewport = app?.viewportHeight ?? window.innerHeight
  const stableViewport = app?.viewportStableHeight ?? viewport
  root.style.setProperty('--tg-viewport-height', `${viewport}px`)
  root.style.setProperty('--tg-viewport-stable-height', `${stableViewport}px`)
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    root.style.setProperty(`--tg-safe-${side}`, `${readInset(app?.safeAreaInset, side)}px`)
    root.style.setProperty(
      `--tg-content-safe-${side}`,
      `${readInset(app?.contentSafeAreaInset, side)}px`,
    )
  }
}

function syncTheme(): void {
  const app = webApp()
  document.documentElement.dataset.telegramTheme = app?.colorScheme ?? 'light'
  if (app?.themeParams?.bg_color) {
    document.documentElement.style.setProperty('--tg-theme-bg', app.themeParams.bg_color)
  }
}

export const telegram = {
  get available() {
    return Boolean(webApp()?.initData)
  },
  get initData() {
    return webApp()?.initData ?? ''
  },
  get previewUser() {
    return webApp()?.initDataUnsafe?.user
  },
  get platform() {
    return webApp()?.platform ?? 'browser'
  },
  get version() {
    return webApp()?.version ?? 'unknown'
  },
  get startParameter() {
    const queryValue = new URLSearchParams(window.location.search).get('tgWebAppStartParam')
    const raw = webApp()?.initDataUnsafe?.start_param ?? queryValue ?? ''
    const result = startParameterSchema.safeParse(raw)
    return result.success ? result.data : null
  },
  initialize() {
    webApp()?.ready?.()
    webApp()?.expand?.()
    syncViewportVariables()
    syncTheme()
    const app = webApp()
    const viewportHandler = () => syncViewportVariables()
    const themeHandler = () => syncTheme()
    app?.onEvent?.('viewportChanged', viewportHandler)
    app?.onEvent?.('safeAreaChanged', viewportHandler)
    app?.onEvent?.('contentSafeAreaChanged', viewportHandler)
    app?.onEvent?.('themeChanged', themeHandler)
    return () => {
      app?.offEvent?.('viewportChanged', viewportHandler)
      app?.offEvent?.('safeAreaChanged', viewportHandler)
      app?.offEvent?.('contentSafeAreaChanged', viewportHandler)
      app?.offEvent?.('themeChanged', themeHandler)
    }
  },
  setBackButton(callback: (() => void) | null) {
    const button = webApp()?.BackButton
    if (!button) return () => undefined
    if (!callback) {
      button.hide()
      return () => undefined
    }
    button.show()
    button.onClick(callback)
    return () => {
      button.offClick(callback)
      button.hide()
    }
  },
  haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    webApp()?.HapticFeedback?.impactOccurred(type)
  },
  notify(type: 'error' | 'success' | 'warning') {
    webApp()?.HapticFeedback?.notificationOccurred(type)
  },
  openLink(url: string) {
    try {
      if (/^https:\/\/t\.me\//i.test(url) && webApp()?.openTelegramLink)
        webApp()?.openTelegramLink?.(url)
      else if (webApp()?.openLink) webApp()?.openLink?.(url)
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  },
  openTelegramLink(url: string) {
    if (webApp()?.openTelegramLink) webApp()?.openTelegramLink?.(url)
    else window.location.assign(url)
  },
  shareUrl(data: ShareData) {
    const app = webApp()
    if (!app?.openTelegramLink) return false

    const url = data.url?.trim() ?? ''
    const text = data.text?.trim() || data.title?.trim() || ''
    if (!url && !text) return false

    const target = new URL('https://t.me/share/url')
    target.searchParams.set('url', url)
    if (text) target.searchParams.set('text', text)
    try {
      app.openTelegramLink(target.toString())
      return true
    } catch {
      return false
    }
  },
}
