import { ChevronDown, ChevronUp, MoreVertical, Plus, Trash2 } from 'lucide-react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { EditorShell } from '@/features/editor/editor-shell'
import { formatPrice, moveItem } from '@/lib/utils'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useState } from 'react'
import { useLocaleText } from '@/i18n/use-locale-text'
import { Switch } from '@/components/ui/switch'

export default function ServicesEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const add = () => {
    if (card.services.length >= 6) return
    const id = crypto.randomUUID()
    updateCard((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id,
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
    setEditingId(id)
  }
  return (
    <EditorShell title={l('Услуги', 'Services')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font m-0 text-lg">{l('Ваши услуги', 'Your services')}</h2>
          <p className="helper-text">{card.services.length} из 6</p>
        </div>
        <Button variant="secondary" onClick={add} disabled={card.services.length >= 6}>
          <Plus size={17} />
          {l('Добавить', 'Add')}
        </Button>
      </div>
      {card.services.map((service, index) => (
        <article key={service.id} className="surface grid gap-3 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <button
              className="min-w-0 flex-1 text-left"
              aria-expanded={editingId === service.id}
              onClick={() => setEditingId(editingId === service.id ? null : service.id)}
            >
              <strong className="block truncate text-sm">
                {service.title || l('Новая услуга', 'New service')}
              </strong>
              <span className="mt-1 block truncate text-[11px] text-[var(--text-muted)]">
                {service.priceType === 'negotiable'
                  ? l('Цена по договорённости', 'Price by agreement')
                  : `${service.priceType === 'from' ? l('от ', 'from ') : ''}${formatPrice(service.price, service.currency)}${service.durationText ? ` · ${service.durationText}` : ''}`}
              </span>
            </button>
            <Switch
              aria-label={l('Показывать услугу', 'Show service')}
              checked={service.enabled}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  services: current.services.map((item) =>
                    item.id === service.id ? { ...item, enabled: !item.enabled } : item,
                  ),
                }))
              }
            />
            <MoreVertical size={18} className="mt-1 text-[var(--text-muted)]" aria-hidden="true" />
          </div>
          {editingId === service.id ? (
            <div className="grid gap-3 border-t border-[var(--border)] pt-3">
              <input
                aria-label={l('Название услуги', 'Service name')}
                className="field-control min-h-11 font-semibold"
                value={service.title}
                placeholder={l('Название услуги', 'Service name')}
                onChange={(event) =>
                  updateCard((current) => ({
                    ...current,
                    services: current.services.map((item) =>
                      item.id === service.id ? { ...item, title: event.target.value } : item,
                    ),
                  }))
                }
              />
              <textarea
                aria-label={l('Описание услуги', 'Service description')}
                className="field-control"
                value={service.description}
                placeholder={l(
                  'Коротко опишите результат для клиента',
                  'Briefly describe the outcome for the client',
                )}
                onChange={(event) =>
                  updateCard((current) => ({
                    ...current,
                    services: current.services.map((item) =>
                      item.id === service.id ? { ...item, description: event.target.value } : item,
                    ),
                  }))
                }
              />
              {!service.title.trim() ? (
                <p className="error-text m-0">
                  {l('Укажите название услуги', 'Enter a service name')}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className={`justify-end gap-1 ${editingId === service.id ? 'flex' : 'hidden'}`}>
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
        title={l('Удалить услугу?', 'Delete service?')}
        description={l(
          'Услуга исчезнет из редактора и публичной визитки.',
          'The service will be removed from the editor and public card.',
        )}
        confirmLabel={l('Удалить', 'Delete')}
        cancelLabel={l('Отмена', 'Cancel')}
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
