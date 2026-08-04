import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { Field, TextareaField } from '@/components/ui/field'
import { EditorShell } from '@/features/editor/editor-shell'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function BasicEditorPage() {
  const { card, updateCard } = useCardStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const profile = card.profile
  const update = (field: keyof typeof profile, value: string) =>
    updateCard((current) => ({ ...current, profile: { ...current.profile, [field]: value } }))
  const upload = (file: File | undefined) => {
    if (!file) return
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      setUploadError('JPEG, PNG или WebP до 5 МБ')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setUploadError('')
      update('avatarUrl', String(reader.result))
    }
    reader.readAsDataURL(file)
  }
  return (
    <EditorShell title="Основное">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => upload(event.target.files?.[0])}
        />
        <Button
          fullWidth
          variant="secondary"
          className="h-28"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={22} />
          Загрузить фото
        </Button>
        {uploadError ? (
          <p className="error-text mt-2">{uploadError}</p>
        ) : (
          <p className="helper-text mt-2">PNG или JPG до 5 МБ</p>
        )}
      </div>
      <Field
        label="Имя"
        value={profile.displayName}
        maxLength={60}
        onChange={(event) => update('displayName', event.target.value)}
      />
      <Field
        label="Профессия"
        value={profile.profession}
        maxLength={80}
        onChange={(event) => update('profession', event.target.value)}
      />
      <TextareaField
        label="О себе"
        value={profile.bio}
        maxLength={300}
        onChange={(event) => update('bio', event.target.value)}
      />
      <Field
        label="Город"
        value={profile.location}
        maxLength={80}
        onChange={(event) => update('location', event.target.value)}
      />
      <label className="field-group">
        <span className="field-label">Формат работы</span>
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
          <option value="remote">Удалённо</option>
          <option value="hybrid">Удалённо · гибрид</option>
          <option value="office">В офисе</option>
          <option value="flexible">Гибкий формат</option>
        </select>
      </label>
    </EditorShell>
  )
}
