import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { ContactSaveDialog } from './contact-save-dialog'

const { copyText, downloadVCard, notify } = vi.hoisted(() => ({
  copyText: vi.fn(),
  downloadVCard: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/lib/utils', () => ({
  copyText,
  cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' '),
  initials: (value: string) =>
    value
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2),
}))
vi.mock('@/lib/vcard', () => ({
  contactFileName: (slug: string) => `cardly-${slug}.vcf`,
  contactVCardUrl: (url: string, slug: string) =>
    `${new URL(url).origin}/api/public/cards/${slug}/contact.vcf`,
  downloadVCard,
}))
vi.mock('@/components/feedback/feedback-provider', () => ({
  useFeedback: () => ({ notify }),
}))

describe('ContactSaveDialog', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })
  })

  beforeEach(() => vi.clearAllMocks())

  it('previews only public contact details and starts a confirmed download', async () => {
    downloadVCard.mockResolvedValueOnce({ state: 'downloading', requestId: 'request-ok' })
    render(
      <ContactSaveDialog
        card={demoCard}
        publicUrl="https://cardly.test/c/alexey"
        open
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Сохранить контакт' })).toBeInTheDocument()
    expect(screen.getByText('Алексей Волков')).toBeInTheDocument()
    expect(screen.getByText('alexey@example.com')).toBeInTheDocument()
    expect(screen.queryByText('private@example.com')).not.toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Добавить в контакты' }))
    expect(downloadVCard).toHaveBeenCalledWith(
      'https://cardly.test/api/public/cards/alexey/contact.vcf',
      'alexey',
    )
    expect(notify).toHaveBeenCalledWith(
      'Скачивание контакта началось. Откройте cardly-alexey.vcf',
      'success',
    )
  })

  it('shows selectable contact text when clipboard access is blocked', async () => {
    copyText.mockResolvedValueOnce(false)
    render(
      <ContactSaveDialog
        card={demoCard}
        publicUrl="https://cardly.test/c/alexey"
        open
        onClose={vi.fn()}
      />,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'Скопировать данные' }))
    await waitFor(() => expect(screen.getByLabelText('Данные контакта')).toBeInTheDocument())
    expect(screen.getByLabelText<HTMLTextAreaElement>('Данные контакта').value).toContain(
      'https://cardly.test/c/alexey',
    )
  })

  it('explains that a card with no contact links still saves core identity', () => {
    render(
      <ContactSaveDialog
        card={{ ...demoCard, links: [] }}
        publicUrl="https://cardly.test/c/alexey"
        open
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Сохраним имя, профессию и ссылку на визитку.')).toBeInTheDocument()
  })

  it('keeps the dialog open on cancellation and provides retry after an error', async () => {
    downloadVCard
      .mockResolvedValueOnce({ state: 'cancelled', requestId: 'request-cancelled' })
      .mockResolvedValueOnce({ state: 'error', requestId: 'request-failed' })
    render(
      <ContactSaveDialog
        card={demoCard}
        publicUrl="https://cardly.test/c/alexey"
        open
        onClose={vi.fn()}
      />,
    )

    const add = screen.getByRole('button', { name: 'Добавить в контакты' })
    await userEvent.setup().click(add)
    expect(screen.getByRole('dialog', { name: 'Сохранить контакт' })).toBeInTheDocument()
    expect(notify).not.toHaveBeenCalled()

    await userEvent.setup().click(add)
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось открыть контакт')
    expect(screen.getByRole('alert')).toHaveTextContent('request-failed')
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })
})
