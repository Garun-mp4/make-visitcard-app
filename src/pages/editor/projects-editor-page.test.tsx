import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import ProjectsEditorPage from './projects-editor-page'

const { updateCard, uploadCardImage, deleteCardImage } = vi.hoisted(() => ({
  updateCard: vi.fn(),
  uploadCardImage: vi.fn(),
  deleteCardImage: vi.fn(),
}))

vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({ card: demoCard, updateCard }),
}))

vi.mock('@/features/editor/editor-shell', () => ({
  EditorShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('@/services/image-upload-service', () => ({
  uploadCardImage,
  deleteCardImage,
}))

describe('ProjectsEditorPage', () => {
  beforeEach(() => {
    updateCard.mockReset()
    uploadCardImage.mockReset()
    deleteCardImage.mockReset()
    uploadCardImage.mockResolvedValue('https://images.example/project.webp')
    deleteCardImage.mockResolvedValue(undefined)
  })

  it('creates a private empty draft instead of publishing placeholder content', async () => {
    render(<ProjectsEditorPage />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Добавить' }))

    expect(updateCard).toHaveBeenCalledTimes(1)
    const updater = updateCard.mock.calls[0][0] as (card: typeof demoCard) => typeof demoCard
    const created = updater(demoCard).projects.at(-1)
    expect(created).toMatchObject({
      title: '',
      category: '',
      description: '',
      coverUrl: '',
      projectUrl: '',
      enabled: false,
    })
  })

  it('shows live character limits for every project text field', async () => {
    render(<ProjectsEditorPage />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Finflow/ }))

    const project = demoCard.projects[0]
    expect(screen.getByRole('dialog', { name: 'Редактировать проект' })).toBeInTheDocument()
    expect(screen.getByText(`${project.title.length}/100`)).toBeInTheDocument()
    expect(screen.getByText(`${project.category.length}/60`)).toBeInTheDocument()
    expect(screen.getByText(`${project.description.length}/400`)).toBeInTheDocument()
    expect(screen.getByText(`${project.projectUrl.length}/2048`)).toBeInTheDocument()
  })

  it('uploads a project cover and stores the returned Blob URL', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProjectsEditorPage />)
    await user.click(screen.getByRole('button', { name: /Finflow/ }))
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    const file = new File(['cover'], 'finflow.webp', { type: 'image/webp' })

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() =>
      expect(uploadCardImage).toHaveBeenCalledWith(
        demoCard.ownerUid,
        file,
        'project',
        expect.any(Function),
      ),
    )
    await waitFor(() => expect(updateCard).toHaveBeenCalled())
    const updater = updateCard.mock.calls.at(-1)?.[0] as (card: typeof demoCard) => typeof demoCard
    expect(updater(demoCard).projects[0].coverUrl).toBe('https://images.example/project.webp')
  })
})
