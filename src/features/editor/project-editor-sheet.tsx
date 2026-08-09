import type { ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

import type { Project } from '@shared/types'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Switch } from '@/components/ui/switch'
import { useLocaleText } from '@/i18n/use-locale-text'
import { isSafeExternalUrl } from '@shared/schemas'
import { deleteCardImage, uploadCardImage } from '@/services/image-upload-service'

interface ProjectEditorSheetProps {
  ownerUid: string
  project: Project
  index: number
  total: number
  onChange: (patch: Partial<Project>) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onClose: () => void
}

function CountedField({
  label,
  value,
  maxLength,
  placeholder,
  multiline = false,
  error,
  onChange,
}: {
  label: string
  value: string
  maxLength: number
  placeholder: string
  multiline?: boolean
  error?: string
  onChange: (value: string) => void
}) {
  const id = `project-${label.toLowerCase().replaceAll(/[^a-zа-я0-9]+/gi, '-')}`
  return (
    <label className="field-group" htmlFor={id}>
      <span className="flex items-center justify-between gap-3">
        <span className="field-label">{label}</span>
        <span className="text-xs tabular-nums text-[var(--text-muted)]" aria-live="polite">
          {value.length}/{maxLength}
        </span>
      </span>
      {multiline ? (
        <textarea
          id={id}
          className="field-control min-h-28 resize-y"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className="field-control"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? <span className="error-text">{error}</span> : null}
    </label>
  )
}

export function ProjectEditorSheet({
  ownerUid,
  project,
  index,
  total,
  onChange,
  onMove,
  onDelete,
  onClose,
}: ProjectEditorSheetProps) {
  const l = useLocaleText()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const trimmedUrl = project.projectUrl.trim()
  const urlError =
    trimmedUrl && !isSafeExternalUrl(trimmedUrl)
      ? l('Укажите полную HTTPS-ссылку', 'Enter a complete HTTPS URL')
      : ''
  const titleError =
    project.title.trim().length > 0 && project.title.trim().length < 2
      ? l('Минимум 2 символа', 'At least 2 characters')
      : ''
  const canPublish = project.title.trim().length >= 2 && !urlError

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const previousUrl = project.coverUrl
    try {
      setUploadName(file.name)
      setUploadError('')
      setUploadProgress(0)
      const coverUrl = await uploadCardImage(ownerUid, file, 'project', setUploadProgress)
      onChange({ coverUrl })
      if (previousUrl && previousUrl !== coverUrl)
        void deleteCardImage(previousUrl).catch(() => undefined)
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : l('Не удалось загрузить изображение', 'Could not upload the image'),
      )
    } finally {
      setUploadProgress(null)
    }
  }

  const removeCover = () => {
    const previousUrl = project.coverUrl
    onChange({ coverUrl: '' })
    if (previousUrl) void deleteCardImage(previousUrl).catch(() => undefined)
  }

  return (
    <div
      className="fixed inset-0 z-40 grid items-end bg-[#10120f99] p-0 md:place-items-center md:p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-editor-title"
        className="max-h-[calc(100dvh-12px)] w-full overflow-y-auto rounded-t-[24px] border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-modal)] md:max-w-xl md:rounded-[24px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-5 py-4">
          <div>
            <h2 id="project-editor-title" className="heading-font m-0 text-xl">
              {l('Редактировать проект', 'Edit project')}
            </h2>
            <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">
              {l(`Проект ${index + 1} из ${total}`, `Project ${index + 1} of ${total}`)}
            </p>
          </div>
          <IconButton aria-label={l('Закрыть', 'Close')} onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="grid gap-5 p-5">
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              aria-label={l('Изображение проекта', 'Project image')}
              onChange={(event) => void upload(event)}
            />
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)]">
              {project.coverUrl ? (
                <img
                  src={project.coverUrl}
                  alt={l('Обложка проекта', 'Project cover')}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-content-center justify-items-center gap-2 text-center text-[var(--text-muted)]">
                  <ImagePlus size={30} strokeWidth={1.6} aria-hidden="true" />
                  <span className="text-sm">
                    {l('Добавьте обложку проекта', 'Add a project cover')}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                disabled={uploadProgress !== null}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={17} aria-hidden="true" />
                {project.coverUrl ? l('Заменить', 'Replace') : l('Загрузить', 'Upload')}
              </Button>
              <Button variant="tertiary" disabled={!project.coverUrl} onClick={removeCover}>
                <Trash2 size={17} aria-hidden="true" />
                {l('Удалить фото', 'Remove image')}
              </Button>
            </div>
            {uploadProgress !== null ? (
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate">{uploadName}</span>
                  <span className="tabular-nums text-[var(--text-muted)]">{uploadProgress}%</span>
                </div>
                <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
            {uploadError ? <p className="error-text mt-2">{uploadError}</p> : null}
            <p className="helper-text mt-2">
              {l('JPG, PNG или WebP до 5 МБ', 'JPG, PNG or WebP up to 5 MB')}
            </p>
          </div>

          <CountedField
            label={l('Название проекта', 'Project name')}
            value={project.title}
            maxLength={100}
            placeholder={l('Например, Finflow', 'For example, Finflow')}
            error={titleError}
            onChange={(title) => onChange({ title })}
          />
          <CountedField
            label={l('Категория', 'Category')}
            value={project.category}
            maxLength={60}
            placeholder={l('Например, Fintech', 'For example, Fintech')}
            onChange={(category) => onChange({ category })}
          />
          <CountedField
            label={l('Описание', 'Description')}
            value={project.description}
            maxLength={400}
            placeholder={l(
              'Коротко опишите задачу, решение и результат',
              'Briefly describe the challenge, solution and result',
            )}
            multiline
            onChange={(description) => onChange({ description })}
          />
          <div className="relative">
            <Link2
              className="pointer-events-none absolute left-4 top-[43px] text-[var(--text-muted)]"
              size={17}
            />
            <div className="[&_input]:pl-11">
              <CountedField
                label={l('Ссылка на проект (необязательно)', 'Project URL (optional)')}
                value={project.projectUrl}
                maxLength={2048}
                placeholder="https://example.com"
                error={urlError}
                onChange={(projectUrl) => onChange({ projectUrl })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div>
              <strong className="block text-sm">{l('Показывать в визитке', 'Show on card')}</strong>
              <span className="mt-1 block text-xs text-[var(--text-muted)]">
                {canPublish
                  ? l('Проект готов к публикации', 'Project is ready to publish')
                  : l(
                      'Сначала заполните название и исправьте ссылку',
                      'Add a name and fix the URL first',
                    )}
              </span>
            </div>
            <Switch
              aria-label={l('Показывать проект', 'Show project')}
              checked={project.enabled}
              disabled={!project.enabled && !canPublish}
              onClick={() => onChange({ enabled: !project.enabled })}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <div className="flex gap-1">
              <IconButton
                aria-label={l('Выше', 'Move up')}
                disabled={index === 0}
                onClick={() => onMove(-1)}
              >
                <ArrowUp size={18} />
              </IconButton>
              <IconButton
                aria-label={l('Ниже', 'Move down')}
                disabled={index === total - 1}
                onClick={() => onMove(1)}
              >
                <ArrowDown size={18} />
              </IconButton>
            </div>
            <Button variant="tertiary" className="text-[var(--error)]" onClick={onDelete}>
              <Trash2 size={17} aria-hidden="true" />
              {l('Удалить проект', 'Delete project')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
