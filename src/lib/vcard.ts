import { telegram } from './telegram'

export type ContactDownloadResult = 'downloading' | 'cancelled' | 'opened' | 'unsupported' | 'error'

export interface ContactDownloadOutcome {
  state: ContactDownloadResult
  requestId: string
}

export function contactFileName(slug: string): string {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'contact'
  return `cardly-${safeSlug}.vcf`
}

export function contactVCardUrl(publicUrl: string, slug: string): string {
  const origin = new URL(publicUrl).origin
  return `${origin}/api/public/cards/${encodeURIComponent(slug)}/contact.vcf`
}

export async function downloadVCard(url: string, slug: string): Promise<ContactDownloadOutcome> {
  const requestId = crypto.randomUUID()
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { state: 'unsupported', requestId }
  }
  const local = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !local) return { state: 'unsupported', requestId }

  try {
    const availability = await fetch(parsed, {
      method: 'HEAD',
      headers: { 'X-Request-Id': requestId },
    })
    const serverRequestId = availability.headers.get('x-request-id') ?? requestId
    if (!availability.ok) return { state: 'error', requestId: serverRequestId }
    const fileName = contactFileName(slug)
    const nativeResult = await telegram.downloadFile({ url: parsed.toString(), fileName })
    if (nativeResult !== 'unsupported') return { state: nativeResult, requestId: serverRequestId }

    if (telegram.available) {
      telegram.openLink(parsed.toString())
      return { state: 'opened', requestId: serverRequestId }
    }

    const anchor = document.createElement('a')
    anchor.href = parsed.toString()
    anchor.download = fileName
    anchor.rel = 'noopener'
    anchor.hidden = true
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    return { state: 'opened', requestId: serverRequestId }
  } catch {
    return { state: 'error', requestId }
  }
}
