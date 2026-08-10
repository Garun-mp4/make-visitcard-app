import { telegram } from './telegram'

export type ContactDownloadResult = 'downloading' | 'cancelled' | 'opened' | 'unsupported' | 'error'

export function contactFileName(slug: string): string {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'contact'
  return `cardly-${safeSlug}.vcf`
}

export function contactVCardUrl(publicUrl: string, slug: string): string {
  const origin = new URL(publicUrl).origin
  return `${origin}/api/public/cards/${encodeURIComponent(slug)}/contact.vcf`
}

export async function downloadVCard(url: string, slug: string): Promise<ContactDownloadResult> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'unsupported'
  }
  const local = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !local) return 'unsupported'

  try {
    const fileName = contactFileName(slug)
    const nativeResult = await telegram.downloadFile({ url: parsed.toString(), fileName })
    if (nativeResult !== 'unsupported') return nativeResult

    if (telegram.available) {
      telegram.openLink(parsed.toString())
      return 'opened'
    }

    const anchor = document.createElement('a')
    anchor.href = parsed.toString()
    anchor.download = fileName
    anchor.rel = 'noopener'
    anchor.hidden = true
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    return 'opened'
  } catch {
    return 'error'
  }
}
