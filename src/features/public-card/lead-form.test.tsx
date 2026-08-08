import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LeadForm } from './lead-form'

vi.mock('@/services/api-client', () => {
  class MockApiError extends Error {
    status = 500
  }
  return { ApiError: MockApiError, apiRequest: vi.fn().mockResolvedValue({ ok: true }) }
})

describe('LeadForm', () => {
  beforeEach(() => Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }))

  it('validates required data and shows success after submission', async () => {
    render(<LeadForm slug="alexey" ownerName="Алексей Волков" />)
    await userEvent.type(screen.getByLabelText('Имя'), 'Мария')
    await userEvent.type(screen.getByLabelText('Контакт'), 'maria@example.com')
    await userEvent.type(screen.getByLabelText('Сообщение'), 'Хочу обсудить дизайн продукта')
    await userEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Заявка отправлена')
  })
})
