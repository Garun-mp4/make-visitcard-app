import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { EditorShell } from '@/features/editor/editor-shell'
import { moveItem } from '@/lib/utils'
import { isSafeExternalUrl } from '@shared/schemas'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function ContactsEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const action = card.primaryAction
  const addLink = () => {
    if (card.links.length >= 10) return
    updateCard((current) => ({
      ...current,
      links: [
        ...current.links,
        {
          id: crypto.randomUUID(),
          type: 'website',
          label: '',
          url: '',
          enabled: true,
          public: true,
          position: current.links.length,
        },
      ],
    }))
  }
  return (
    <EditorShell title={l('Контакты', 'Contacts')}>
      <section className="stack-16">
        <h2 className="heading-font m-0 text-lg">{l('Главное действие', 'Primary action')}</h2>
        <Field
          label={l('Текст кнопки', 'Button label')}
          value={action.label}
          onChange={(event) =>
            updateCard((current) => ({
              ...current,
              primaryAction: { ...current.primaryAction, label: event.target.value },
            }))
          }
        />
        <Field
          label={l('Ссылка или контакт', 'Link or contact')}
          value={action.value}
          onChange={(event) =>
            updateCard((current) => ({
              ...current,
              primaryAction: { ...current.primaryAction, value: event.target.value },
            }))
          }
        />
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
          <article key={link.id} className="surface grid gap-3 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <input
                className="field-control min-h-11 flex-1"
                aria-label="Название ссылки"
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
              <button
                aria-label={link.public ? 'Скрыть ссылку' : 'Сделать ссылку публичной'}
                className="grid size-11 place-items-center"
                onClick={() =>
                  updateCard((current) => ({
                    ...current,
                    links: current.links.map((item) =>
                      item.id === link.id ? { ...item, public: !item.public } : item,
                    ),
                  }))
                }
              >
                {link.public ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <input
              className="field-control min-h-11"
              aria-label="URL ссылки"
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
            <div className="flex justify-end gap-1">
              <button
                aria-label="Переместить выше"
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
                aria-label="Переместить ниже"
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
                aria-label="Удалить ссылку"
                className="grid size-10 place-items-center text-[var(--error)]"
                onClick={() =>
                  updateCard((current) => ({
                    ...current,
                    links: current.links.filter((item) => item.id !== link.id),
                  }))
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
            {!link.label.trim() ? (
              <p className="error-text m-0">{l('Укажите название ссылки', 'Enter a link name')}</p>
            ) : null}
          </article>
        ))}
      </section>
    </EditorShell>
  )
}
