import { Download, QrCode, RefreshCw, Share2, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

import { useFeedback } from '@/components/feedback/feedback-provider'
import { useQrPng } from '@/components/qr/use-qr-png'
import { Button } from '@/components/ui/button'
import { useLocaleText } from '@/i18n/use-locale-text'
import { downloadQrPng, shareQrPng } from '@/lib/qr-code'

export function QrCodeDialog({
  open,
  value,
  slug,
  ownerName,
  onClose,
  onShared,
}: {
  open: boolean
  value: string
  slug: string
  ownerName: string
  onClose(): void
  onShared?: () => void
}) {
  const l = useLocaleText()
  const feedback = useFeedback()
  const { svgRef, asset, failed, retry } = useQrPng(value, slug, open)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sharing) onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose, open, sharing])

  if (!open) return null

  const download = () => {
    if (!asset) return
    downloadQrPng(asset)
    feedback.notify(l('QR-код скачан как PNG', 'QR code downloaded as PNG'), 'success')
  }
  const share = async () => {
    if (!asset) return
    setSharing(true)
    const result = await shareQrPng(asset, {
      title: l(`QR-код · ${ownerName}`, `QR code · ${ownerName}`),
      text: value,
    })
    setSharing(false)
    if (result === 'cancelled') return
    if (result === 'shared') {
      onShared?.()
      feedback.notify(l('Окно отправки открыто', 'Share dialog opened'), 'success')
      return
    }
    downloadQrPng(asset)
    feedback.notify(
      l(
        'Устройство не поддерживает отправку файлов — PNG скачан, его можно прикрепить вручную.',
        'This device cannot share files — the PNG was downloaded so you can attach it manually.',
      ),
      'info',
    )
  }

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-end bg-[#10120f99] p-3 md:place-items-center"
      onMouseDown={() => {
        if (!sharing) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cardly-qr-title"
        className="surface grid max-h-[calc(100dvh-var(--tg-safe-top)-24px)] w-full max-w-md gap-4 overflow-y-auto rounded-2xl p-5 shadow-[var(--shadow-modal)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="cardly-qr-title" className="heading-font m-0 text-xl">
              {l('QR-код визитки', 'Business card QR code')}
            </h2>
            <p className="mb-0 mt-1 text-sm text-[var(--text-secondary)]">
              {l('Наведите камеру, чтобы открыть визитку.', 'Scan it to open the business card.')}
            </p>
          </div>
          <button
            aria-label={l('Закрыть', 'Close')}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
            disabled={sharing}
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="mx-auto grid aspect-square w-full max-w-[300px] place-items-center rounded-2xl border border-[var(--border)] bg-white p-5">
          <QRCodeSVG
            ref={svgRef}
            value={value}
            title={l('QR-код визитки', 'Business card QR code')}
            role="img"
            aria-label={l('QR-код визитки', 'Business card QR code')}
            level="H"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#183d2e"
            className="size-full"
          />
        </div>

        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
          <QrCode size={16} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <span className="truncate">{value}</span>
        </div>

        {failed ? (
          <div className="grid gap-2 rounded-xl bg-[var(--warning-soft)] p-3 text-xs text-[var(--warning)]">
            <span>{l('Не удалось подготовить PNG-файл.', 'Could not prepare the PNG file.')}</span>
            <button className="justify-self-start font-semibold" onClick={retry}>
              <RefreshCw className="mr-1 inline" size={14} aria-hidden="true" />
              {l('Повторить', 'Retry')}
            </button>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" disabled={!asset || sharing} onClick={download}>
            <Download size={17} aria-hidden="true" />
            {asset ? l('Скачать PNG', 'Download PNG') : l('Готовим PNG…', 'Preparing PNG…')}
          </Button>
          <Button disabled={!asset || sharing} aria-busy={sharing} onClick={() => void share()}>
            <Share2 size={17} aria-hidden="true" />
            {sharing
              ? l('Открываем…', 'Opening…')
              : asset
                ? l('Поделиться QR', 'Share QR')
                : l('Готовим QR…', 'Preparing QR…')}
          </Button>
        </div>
      </section>
    </div>
  )
}
