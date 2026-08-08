import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react'

import { SystemState } from '@/components/feedback/system-state'
import i18n from '@/i18n'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Production reporting can be attached here without exposing the error to users.
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <SystemState
          title={i18n.language.startsWith('en') ? 'Cardly failed to load' : 'Cardly не загрузился'}
          description={
            i18n.language.startsWith('en')
              ? 'Your safe state is preserved. Reload the app and try again.'
              : 'Мы сохранили безопасное состояние. Перезагрузите приложение и повторите.'
          }
          actionLabel={i18n.language.startsWith('en') ? 'Reload' : 'Перезагрузить'}
          onAction={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
