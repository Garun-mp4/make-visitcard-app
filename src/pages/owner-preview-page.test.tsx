import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import OwnerPreviewPage from './owner-preview-page'

const store = vi.hoisted<{ value: { card: typeof demoCard; publicSync: unknown } }>(() => ({
  value: null as never,
}))
const loadPublicCard = vi.hoisted(() => vi.fn())
const rendererProps = vi.hoisted(() => vi.fn())
const telegramBack = vi.hoisted<{ callback: null | (() => void) }>(() => ({ callback: null }))

vi.mock('@/app/card-store', () => ({ useCardStore: () => store.value }))
vi.mock('@/services/public-card-repository', () => ({ loadPublicCard }))
vi.mock('@/features/public-card/public-card-renderer', () => ({
  PublicCardRenderer: (props: unknown) => {
    rendererProps(props)
    return <div>PUBLIC CARD SNAPSHOT</div>
  },
}))
vi.mock('@/hooks/use-telegram', () => ({
  useTelegramBack: (callback: () => void) => {
    telegramBack.callback = callback
  },
}))

function renderPage(returnTo: '/app/card' | '/app/editor/publish' | '/app/profile' = '/app/card') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/app/preview', state: { returnTo } }]}>
        <Routes>
          <Route path="/app/preview" element={<OwnerPreviewPage />} />
          <Route path="/app/card" element={<div>CARD OVERVIEW</div>} />
          <Route path="/app/editor/publish" element={<div>PUBLICATION SETTINGS</div>} />
          <Route path="/app/profile" element={<div>OWNER PROFILE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OwnerPreviewPage', () => {
  beforeEach(() => {
    loadPublicCard.mockReset().mockResolvedValue(demoCard)
    rendererProps.mockReset()
    telegramBack.callback = null
    store.value = {
      card: demoCard,
      publicSync: { state: 'synced', syncedAt: demoCard.lastPublishedAt, invalidPaths: [] },
    }
  })

  it('renders the authoritative public snapshot without public analytics', async () => {
    renderPage()

    expect(await screen.findByText('PUBLIC CARD SNAPSHOT')).toBeInTheDocument()
    expect(screen.getByText('Предпросмотр владельца')).toBeInTheDocument()
    expect(rendererProps).toHaveBeenCalledWith(
      expect.objectContaining({
        analyticsEnabled: false,
        publicUrl: expect.stringMatching(/\/c\/alexey$/),
      }),
    )
  })

  it('returns to the exact owner screen from the visible and Telegram back buttons', async () => {
    const user = userEvent.setup()
    renderPage('/app/editor/publish')

    await screen.findByText('PUBLIC CARD SNAPSHOT')
    await user.click(screen.getByRole('button', { name: 'Назад к публикации' }))
    expect(screen.getByText('PUBLICATION SETTINGS')).toBeInTheDocument()

    renderPage('/app/card')
    await screen.findAllByText('PUBLIC CARD SNAPSHOT')
    expect(telegramBack.callback).not.toBeNull()
    act(() => telegramBack.callback?.())
    expect(screen.getByText('CARD OVERVIEW')).toBeInTheDocument()
  })

  it('explains when the preview shows the last valid published snapshot', async () => {
    store.value = {
      ...store.value,
      publicSync: {
        state: 'pending_validation',
        syncedAt: demoCard.lastPublishedAt,
        invalidPaths: [],
      },
    }
    renderPage()

    expect(
      await screen.findByText('Показана последняя корректная опубликованная версия'),
    ).toBeInTheDocument()
  })
})
