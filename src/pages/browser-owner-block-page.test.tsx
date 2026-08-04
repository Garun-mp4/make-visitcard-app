import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BrowserOwnerBlockPage } from './browser-owner-block-page'

describe('BrowserOwnerBlockPage', () => {
  it('explains that owner tools require Telegram', () => {
    render(<BrowserOwnerBlockPage />)
    expect(screen.getByRole('heading')).toHaveTextContent(/Telegram/)
    expect(screen.getByRole('button', { name: 'Открыть бота' })).toBeInTheDocument()
  })
})
