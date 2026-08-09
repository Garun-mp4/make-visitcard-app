import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { ProjectDialog } from './project-dialog'

vi.mock('@/lib/telegram', () => ({ telegram: { openLink: vi.fn() } }))

describe('ProjectDialog', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
  })

  it('shows the external action for a valid project URL', () => {
    render(
      <ProjectDialog project={demoCard.projects[0]} open onClose={() => undefined} theme="clean" />,
    )
    expect(screen.getByRole('button', { name: /Открыть проект/ })).toBeInTheDocument()
  })

  it.each(['', 'javascript:alert(1)', 'not-a-url'])(
    'omits the external action for an empty or unsafe URL: %s',
    (projectUrl) => {
      render(
        <ProjectDialog
          project={{ ...demoCard.projects[0], projectUrl }}
          open
          onClose={() => undefined}
          theme="clean"
        />,
      )
      expect(screen.queryByRole('button', { name: /Открыть проект/ })).not.toBeInTheDocument()
    },
  )
})
