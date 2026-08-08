import { ChevronDown, ChevronUp, Globe2, Mail, Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { isSafeExternalUrl } from '@shared/schemas'
import type { CardDraft } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { EditorShell } from '@/features/editor/editor-shell'
import { useLocaleText } from '@/i18n/use-locale-text'
import { moveItem } from '@/lib/utils'

const actionLabels: Record<CardDraft['primaryAction']['type'], [string, string]> = {
  telegram: ['Написать в Telegram', 'Message in Telegram'],
  email: ['Отправить email', 'Send an email'],
  phone: ['Позвонить', 'Make a call'],
  booking: ['Записаться', 'Book a meeting'],
  website: ['Открыть сайт', 'Open website'],
  custom: ['Другое действие', 'Custom action'],
}

export default function ContactsEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const action = card.primaryAction

  const selectAction = (type: CardDraft['primaryAction']['type']) =>
    updateCard((current) => ({
      ...current,
      primaryAction: {
        ...current.primaryAction,
        type,
        label: l(...actionLabels[type]),
        value: current.primaryAction.type === type ? current.primaryAction.value : '',
        enabled: true,
      },
    }))

  const addLink = () => {
    if (card.links.length >= 10) return
    const id = crypto.randomUUID()
    updateCard((current) => ({
      ...current,
      links: [
        ...current.links,
        {
          id,
          type: 'website',
          label: '',
          url: '',
          enabled: true,
          public: true,
          position: current.links.length,
        },
      ],
    }))
    setEditingId(id)
  }

  return (
    <EditorShell title={l('Контакты', 'Contacts')}>
      <section className="stack-12">
        <h2 className="heading-font m-0 text-lg">{l('Главное действие', 'Primary action')}</h2>
        <label className="field-group">
          <span className="field-label">{l('Тип действия', 'Action type')}</span>
          <select
            className="field-control"
            value={action.type}
            onChange={(event) =>
              selectAction(event.target.value as CardDraft['primaryAction']['type'])
            }
          >
            {(['telegram', 'email', 'phone', 'booking', 'website', 'custom'] as const).map(
              (type) => (
                <option key={type} value={type}>
                  {l(...actionLabels[type])}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="field-group">
          <span className="field-label">{l('Ссылка или контакт', 'Link or contact')}</span>
          <div className="field-control flex items-center gap-2">
            {action.type === 'telegram' ? <Send size={17} /> : <Globe2 size={17} />}
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              value={action.value}
              placeholder={
                action.type === 'email'
                  ? 'name@example.com'
                  : action.type === 'phone'
                    ? '+7 900 000-00-00'
                    : 'https://…'
              }
              onChange={(event) =>
                updateCard((current) => ({
                  ...current,
                  primaryAction: { ...current.primaryAction, value: event.target.value },
                }))
              }
            />
          </div>
        </label>
      </section>

      <section className="stack-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-font m-0 text-lg">{l('Ссылки', 'Links')}</h2>
            <p className="helper-text">{card.links.length} из 10</p>
          </div>
          <Button variant="secondary" onClick={addLink} disabled={card.links.length >= 10}>
            <Plus size={16} />
            {l('Добавить', 'Add')}
          </Button>
        </div>

        {card.links.map((link, index) => (
          <article key={link.id} className="surface rounded-xl p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                {link.type === 'email' ? <Mail size={17} /> : <Globe2 size={17} />}
              </span>
              <button
                className="min-w-0 flex-1 text-left"
                aria-expanded={editingId === link.id}
                onClick={() => setEditingId(editingId === link.id ? null : link.id)}
              >
                <strong className="block truncate text-sm">
                  {link.label || l('Новая ссылка', 'New link')}
                </strong>
                <span className="block truncate text-[11px] text-[var(--text-muted)]">
                  {link.url || l('Добавьте адрес', 'Add an address')}
                </span>
              </button>
              <Switch
                aria-label={l('Показывать ссылку', 'Show link')}
                checked={link.public}
                onClick={() =>
                  updateCard((current) => ({
                    ...current,
                    links: current.links.map((item) =>
                      item.id === link.id ? { ...item, public: !item.public } : item,
                    ),
                  }))
                }
              />
            </div>

            {editingId === link.id ? (
              <div className="mt-3 grid gap-3 border-t border-[var(--border)] pt-3">
                <input
                  className="field-control min-h-11"
                  aria-label={l('Название ссылки', 'Link name')}
                  value={link.label}
                  placeholder={l('Например, Портфолио', 'For example, Portfolio')}
                  onChange={(event) =>
                    updateCard((current) => ({
                      ...current,
                      links: current.links.map((item) =>
                        item.id === link.id ? { ...item, label: event.target.value } : item,
                      ),
                    }))
                  }
                />
                <input
                  className="field-control min-h-11"
                  aria-label={l('URL ссылки', 'Link URL')}
                  value={link.url}
                  placeholder="https://example.com"
                  onChange={(event) =>
                    updateCard((current) => ({
                      ...current,
                      links: current.links.map((item) =>
                        item.id === link.id ? { ...item, url: event.target.value } : item,
                      ),
                    }))
                  }
                />
                {link.url && !isSafeExternalUrl(link.url, import.meta.env.DEV) ? (
                  <p className="error-text m-0">
                    {l(
                      'Введите безопасную ссылку HTTPS, email или телефон',
                      'Enter a safe HTTPS link, email, or phone number',
                    )}
                  </p>
                ) : null}
                {!link.label.trim() ? (
                  <p className="error-text m-0">
                    {l('Укажите название ссылки', 'Enter a link name')}
                  </p>
                ) : null}
                <div className="flex justify-end gap-1">
                  <button
                    aria-label={l('Переместить выше', 'Move up')}
                    className="grid size-10 place-items-center"
                    disabled={index === 0}
                    onClick={() =>
                      updateCard((current) => ({
                        ...current,
                        links: moveItem(current.links, index, -1),
                      }))
                    }
                  >
                    <ChevronUp size={17} />
                  </button>
                  <button
                    aria-label={l('Переместить ниже', 'Move down')}
                    className="grid size-10 place-items-center"
                    disabled={index === card.links.length - 1}
                    onClick={() =>
                      updateCard((current) => ({
                        ...current,
                        links: moveItem(current.links, index, 1),
                      }))
                    }
                  >
                    <ChevronDown size={17} />
                  </button>
                  <button
                    aria-label={l('Удалить ссылку', 'Delete link')}
                    className="grid size-10 place-items-center text-[var(--error)]"
                    onClick={() => {
                      updateCard((current) => ({
                        ...current,
                        links: current.links.filter((item) => item.id !== link.id),
                      }))
                      setEditingId(null)
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </EditorShell>
  )
}
