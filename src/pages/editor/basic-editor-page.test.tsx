import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import BasicEditorPage from './basic-editor-page'

const updateCard = vi.fn()

vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({ card: demoCard, updateCard }),
}))

vi.mock('@/features/editor/editor-shell', () => ({
  EditorShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

describe('BasicEditorPage Telegram avatar', () => {
  it('does not offer a manual avatar upload', () => {
    const { container } = render(<BasicEditorPage />)

    expect(screen.queryByRole('button', { name: /Загрузить фото/ })).not.toBeInTheDocument()
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
  })
})
