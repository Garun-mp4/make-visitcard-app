import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import '@/i18n'
import '@/styles/index.css'
import { CardStoreProvider } from '@/app/card-store'
import { App } from '@/app/app'
import { ErrorBoundary } from '@/components/feedback/error-boundary'
import { AuthProvider } from '@/features/auth/auth-provider'
import { FeedbackProvider } from '@/components/feedback/feedback-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <FeedbackProvider>
              <CardStoreProvider>
                <App />
              </CardStoreProvider>
            </FeedbackProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
