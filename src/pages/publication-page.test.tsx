import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { ApiError } from '@/services/api-client'
import PublicationPage from './publication-page'

interface StoreMock {
  unpublishCard: ReturnType<typeof vi.fn>
  [key: string]: unknown
}

const state = vi.hoisted<{ value: StoreMock }>(() => ({ value: { unpublishCard: vi.fn() } }))
const notify = vi.hoisted(() => vi.fn())

vi.mock('@/app/card-store', () => ({ useCardStore: () => state.value }))
vi.mock('@/components/feedback/feedback-provider', () => ({
  useFeedback: () => ({ notify, revealLink: vi.fn() }),
}))

describe('PublicationPage', () => {
  beforeEach(() => {
    notify.mockReset()
    state.value = {
      card: demoCard,
      publicSync: { state: 'synced', syncedAt: demoCard.lastPublishedAt, invalidPaths: [] },
      saveStatus: 'saved',
      saveError: null,
      saveNow: vi.fn().mockResolvedValue(undefined),
      ensurePublicCardReady: vi.fn().mockResolvedValue(true),
      publicationOperation: 'idle',
      publicationError: null,
      publishCard: vi.fn().mockResolvedValue(undefined),
      unpublishCard: vi.fn().mockResolvedValue(undefined),
      updateCard: vi.fn(),
    }
  })

  it('locks the slug of a published card and confirms unpublishing once', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PublicationPage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('textbox', { name: /Адрес визитки/ })).not.toBeInTheDocument()
    expect(screen.getAllByText(/\/c\/alexey/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Снять с публикации' }))
    await user.click(screen.getByRole('button', { name: /^Снять$/ }))

    expect(state.value.unpublishCard).toHaveBeenCalledTimes(1)
  })

  it('shows a clear loading state while the card is being unpublished', () => {
    state.value = { ...state.value, publicationOperation: 'unpublishing' }
    render(
      <MemoryRouter>
        <PublicationPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Снять с публикации' })).toBeDisabled()
  })

  it('reports an unpublish timeout with its request id', async () => {
    const user = userEvent.setup()
    state.value = {
      ...state.value,
      unpublishCard: vi.fn().mockRejectedValue(
        new ApiError(408, {
          code: 'request_timeout',
          message: 'Сервер не ответил вовремя',
          requestId: 'client-timeout',
        }),
      ),
    }
    render(
      <MemoryRouter>
        <PublicationPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Снять с публикации' }))
    await user.click(screen.getByRole('button', { name: /^Снять$/ }))

    expect(notify).toHaveBeenCalledWith('Сервер не ответил вовремя · client-timeout', 'error')
  })

  it('opens the protected owner preview with a publication return target', async () => {
    const user = userEvent.setup()
    function LocationProbe() {
      const location = useLocation()
      return <output data-testid="location">{JSON.stringify(location)}</output>
    }
    render(
      <MemoryRouter>
        <PublicationPage />
        <LocationProbe />
      </MemoryRouter>,
    )

    await user.click(screen.getAllByRole('button', { name: 'Предпросмотр' })[0])

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('"pathname":"/app/preview"'),
    )
    expect(screen.getByTestId('location')).toHaveTextContent(
      '"state":{"returnTo":"/app/editor/publish"}',
    )
  })

  it('explains invalid draft fields before publication and links to their editor', () => {
    state.value = {
      ...state.value,
      card: {
        ...demoCard,
        links: [
          ...demoCard.links,
          {
            id: 'unfinished-portfolio',
            type: 'website',
            label: 'Portfolio',
            url: 'https://',
            enabled: true,
            public: true,
            position: demoCard.links.length,
          },
        ],
        publication: { ...demoCard.publication, slug: 'kizlyar', published: false },
      },
      publicSync: { state: 'not_published', syncedAt: null, invalidPaths: [] },
    }

    render(
      <MemoryRouter>
        <PublicationPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Исправьте данные визитки перед публикацией.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Опубликовать визитку' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Исправить' })).toBeInTheDocument()
  })
})
