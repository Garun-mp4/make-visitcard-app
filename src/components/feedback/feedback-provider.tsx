import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

type FeedbackTone = 'success' | 'error' | 'info'

interface FeedbackContextValue {
  notify(message: string, tone?: FeedbackTone): void
  revealLink(title: string, value: string): void
}

const FeedbackContext = createContext<FeedbackContextValue>({
  notify: () => undefined,
  revealLink: () => undefined,
})

export function FeedbackProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation()
  const [toast, setToast] = useState<{ message: string; tone: FeedbackTone } | null>(null)
  const [link, setLink] = useState<{ title: string; value: string } | null>(null)
  const notify = useCallback((message: string, tone: FeedbackTone = 'info') => {
    setToast({ message, tone })
    window.setTimeout(
      () => setToast((current) => (current?.message === message ? null : current)),
      3200,
    )
  }, [])
  const value = useMemo<FeedbackContextValue>(
    () => ({ notify, revealLink: (title, linkValue) => setLink({ title, value: linkValue }) }),
    [notify],
  )
  const ToastIcon =
    toast?.tone === 'success' ? CheckCircle2 : toast?.tone === 'error' ? CircleAlert : Info
  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className="fixed inset-x-3 bottom-[calc(88px+var(--tg-safe-bottom))] z-[70] mx-auto flex min-h-12 max-w-md items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-[var(--shadow-modal)] lg:bottom-6"
          role="status"
          aria-live="polite"
        >
          <ToastIcon
            size={18}
            className={toast.tone === 'error' ? 'text-[var(--error)]' : 'text-[var(--accent)]'}
            aria-hidden="true"
          />
          <span className="flex-1">{toast.message}</span>
          <button
            aria-label={t('feedback.close')}
            className="grid size-8 place-items-center"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
      {link ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-end bg-[#10120f99] p-3 md:place-items-center"
          onMouseDown={() => setLink(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-link-title"
            className="surface w-full max-w-md rounded-2xl p-5 shadow-[var(--shadow-modal)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="manual-link-title" className="heading-font m-0 text-xl">
                {link.title}
              </h2>
              <button
                aria-label={t('feedback.close')}
                className="grid size-10 place-items-center"
                onClick={() => setLink(null)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{t('feedback.copyBlocked')}</p>
            <input
              className="field-control w-full"
              readOnly
              value={link.value}
              onFocus={(event) => event.currentTarget.select()}
              autoFocus
            />
          </section>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  return useContext(FeedbackContext)
}
