import { useCardStore } from '@/app/card-store'
import { Field, TextareaField } from '@/components/ui/field'
import { EditorShell } from '@/features/editor/editor-shell'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function BasicEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const profile = card.profile
  const update = (field: keyof typeof profile, value: string) =>
    updateCard((current) => ({ ...current, profile: { ...current.profile, [field]: value } }))
  return (
    <EditorShell title={l('Основное', 'Basic')}>
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
