import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react'

import { SystemState } from '@/components/feedback/system-state'

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
          title="Cardly не загрузился"
          description="Мы сохранили безопасное состояние. Перезагрузите приложение и повторите."
          actionLabel="Перезагрузить"
          onAction={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
