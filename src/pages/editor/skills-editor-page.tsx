import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { EditorShell } from '@/features/editor/editor-shell'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function SkillsEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const [skill, setSkill] = useState('')
  const [adding, setAdding] = useState(false)
  const add = () => {
    const label = skill.trim().replace(/\s+/g, ' ')
    if (
      !label ||
      label.length > 30 ||
      card.skills.length >= 10 ||
      card.skills.some((item) => item.label.toLowerCase() === label.toLowerCase())
    )
      return
    updateCard((current) => ({
      ...current,
      skills: [
        ...current.skills,
        { id: crypto.randomUUID(), label, position: current.skills.length },
      ],
    }))
    setSkill('')
    setAdding(false)
  }
  return (
    <EditorShell title={l('Навыки', 'Skills')}>
      <p className="helper-text">
        {l(
          `До 10 навыков · ${card.skills.length} добавлено`,
          `Up to 10 skills · ${card.skills.length} added`,
        )}
      </p>
      <div className="stack-12">
        {card.skills.map((item) => (
          <div key={item.id} className="surface flex min-h-14 items-center gap-2 rounded-xl px-3">
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <button
              aria-label={l(`Удалить ${item.label}`, `Remove ${item.label}`)}
              className="grid size-10 place-items-center text-[var(--error)]"
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  skills: current.skills.filter((skillItem) => skillItem.id !== item.id),
                }))
              }
            >
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="surface grid gap-3 rounded-xl p-4">
          <Field
            label={l('Новый навык', 'New skill')}
            value={skill}
            autoFocus
            maxLength={30}
            onChange={(event) => setSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              {l('Отмена', 'Cancel')}
            </Button>
            <Button onClick={add} disabled={!skill.trim() || card.skills.length >= 10}>
              {l('Добавить', 'Add')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          fullWidth
          variant="secondary"
          onClick={() => setAdding(true)}
          disabled={card.skills.length >= 10}
        >
          <Plus size={17} />
          {l('Добавить навык', 'Add skill')}
        </Button>
      )}
    </EditorShell>
  )
}
