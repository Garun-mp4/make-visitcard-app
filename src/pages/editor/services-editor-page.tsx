import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { EditorShell } from '@/features/editor/editor-shell'
import { moveItem } from '@/lib/utils'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useState } from 'react'

export default function ServicesEditorPage() {
  const { card, updateCard } = useCardStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const add = () => {
    if (card.services.length >= 6) return
    updateCard((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: crypto.randomUUID(),
          title: '',
          description: '',
          priceType: 'negotiable',
          price: null,
          currency: 'RUB',
          durationText: '',
          enabled: true,
          position: current.services.length,
        },
      ],
    }))
  }
  return (
    <EditorShell title="Услуги">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font m-0 text-lg">Ваши услуги</h2>
          <p className="helper-text">{card.services.length} из 6</p>
        </div>
        <Button variant="secondary" onClick={add} disabled={card.services.length >= 6}>
          <Plus size={17} />
          Добавить
        </Button>
      </div>
      {card.services.map((service, index) => (
        <article key={service.id} className="surface grid gap-3 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <input
              aria-label="Название услуги"
              className="field-control min-h-11 flex-1 font-semibold"
              value={service.title}
              placeholder="Название услуги"
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  services: current.services.map((item) =>
                    item.id === service.id ? { ...item, title: event.target.value } : item,
                  ),
                }))
              }
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={service.enabled}
                onChange={() =>
                  updateCard((current) => ({
                    ...current,
                    services: current.services.map((item) =>
                      item.id === service.id ? { ...item, enabled: !item.enabled } : item,
                    ),
                  }))
                }
              />
              Показывать
            </label>
          </div>
          <textarea
            aria-label="Описание услуги"
            className="field-control"
            value={service.description}
            placeholder="Коротко опишите результат для клиента"
            onChange={(event) =>
              updateCard((current) => ({
                ...current,
                services: current.services.map((item) =>
                  item.id === service.id ? { ...item, description: event.target.value } : item,
                ),
              }))
            }
          />
          <div className="flex justify-end gap-1">
            <button
              aria-label="Выше"
              className="grid size-10 place-items-center"
              disabled={index === 0}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  services: moveItem(current.services, index, -1),
                }))
              }
            >
              <ChevronUp size={17} />
            </button>
            <button
              aria-label="Ниже"
              className="grid size-10 place-items-center"
              disabled={index === card.services.length - 1}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  services: moveItem(current.services, index, 1),
                }))
              }
            >
              <ChevronDown size={17} />
            </button>
            <button
              aria-label="Удалить"
              className="grid size-10 place-items-center text-[var(--error)]"
              onClick={() => setPendingDelete(service.id)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </article>
      ))}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Удалить услугу?"
        description="Услуга исчезнет из редактора и публичной визитки."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          updateCard((current) => ({
            ...current,
            services: current.services.filter((item) => item.id !== pendingDelete),
          }))
          setPendingDelete(null)
        }}
      />
    </EditorShell>
  )
}
