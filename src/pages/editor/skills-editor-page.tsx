import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { EditorShell } from '@/features/editor/editor-shell'
import { moveItem } from '@/lib/utils'

export default function SkillsEditorPage() {
  const { card, updateCard } = useCardStore()
  const [skill, setSkill] = useState('')
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
  }
  return (
    <EditorShell title="Навыки">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field
            label="Новый навык"
            value={skill}
            maxLength={30}
            onChange={(event) => setSkill(event.target.value)}
          />
        </div>
        <Button onClick={add} disabled={!skill.trim() || card.skills.length >= 10}>
          <Plus size={17} />
        </Button>
      </div>
      <p className="helper-text">До 10 навыков · {card.skills.length} добавлено</p>
      <div className="stack-12">
        {card.skills.map((item, index) => (
          <div key={item.id} className="surface flex min-h-14 items-center gap-2 rounded-xl px-3">
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <button
              aria-label="Выше"
              className="grid size-10 place-items-center"
              disabled={index === 0}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  skills: moveItem(current.skills, index, -1),
                }))
              }
            >
              <ChevronUp size={17} />
            </button>
            <button
              aria-label="Ниже"
              className="grid size-10 place-items-center"
              disabled={index === card.skills.length - 1}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  skills: moveItem(current.skills, index, 1),
                }))
              }
            >
              <ChevronDown size={17} />
            </button>
            <button
              aria-label="Удалить"
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
    </EditorShell>
  )
}
