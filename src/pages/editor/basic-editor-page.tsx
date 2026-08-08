import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { Field, TextareaField } from '@/components/ui/field'
import { EditorShell } from '@/features/editor/editor-shell'
import { useLocaleText } from '@/i18n/use-locale-text'
import { uploadCardImage } from '@/services/image-upload-service'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function BasicEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const profile = card.profile
  const update = (field: keyof typeof profile, value: string) =>
    updateCard((current) => ({ ...current, profile: { ...current.profile, [field]: value } }))
  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      setUploadError(l('JPEG, PNG или WebP до 5 МБ', 'JPEG, PNG or WebP up to 5 MB'))
      return
    }
    try {
      setUploadError('')
      setUploadProgress(0)
      const url = await uploadCardImage(card.ownerUid, file, 'avatar', setUploadProgress)
      update('avatarUrl', url)
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
  return (
    <EditorShell title={l('Основное', 'Basic')}>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <Button
          fullWidth
          variant="secondary"
          className="h-28"
          disabled={uploadProgress !== null}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={22} />
          {uploadProgress === null
            ? l('Загрузить фото', 'Upload photo')
            : l(`Загружаем… ${uploadProgress}%`, `Uploading… ${uploadProgress}%`)}
        </Button>
        {uploadError ? (
          <p className="error-text mt-2">{uploadError}</p>
        ) : (
          <p className="helper-text mt-2">{l('PNG или JPG до 5 МБ', 'PNG or JPG up to 5 MB')}</p>
        )}
      </div>
      <Field
        label={l('Имя', 'Name')}
        value={profile.displayName}
        maxLength={60}
        onChange={(event) => update('displayName', event.target.value)}
      />
      <Field
        label={l('Профессия', 'Profession')}
        value={profile.profession}
        maxLength={80}
        onChange={(event) => update('profession', event.target.value)}
      />
      <TextareaField
        label={l('О себе', 'About')}
        value={profile.bio}
        maxLength={300}
        onChange={(event) => update('bio', event.target.value)}
      />
      <Field
        label={l('Город', 'City')}
        value={profile.location}
        maxLength={80}
        onChange={(event) => update('location', event.target.value)}
      />
      <label className="field-group">
        <span className="field-label">{l('Формат работы', 'Work format')}</span>
        <select
          className="field-control"
          value={profile.workFormat}
          onChange={(event) =>
            updateCard((current) => ({
              ...current,
              profile: {
                ...current.profile,
                workFormat: event.target.value as typeof profile.workFormat,
              },
            }))
          }
        >
          <option value="remote">{l('Удалённо', 'Remote')}</option>
          <option value="hybrid">{l('Удалённо · гибрид', 'Remote · hybrid')}</option>
          <option value="office">{l('В офисе', 'Office')}</option>
          <option value="flexible">{l('Гибкий формат', 'Flexible')}</option>
        </select>
      </label>
    </EditorShell>
  )
}
