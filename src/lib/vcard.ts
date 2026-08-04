import type { CardDraft } from '@shared/types'

export function escapeVCard(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
}

export function createVCard(card: CardDraft): string {
  const publicLinks = card.links.filter((link) => link.enabled && link.public)
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`FN:${escapeVCard(card.profile.displayName)}`)
  lines.push(`TITLE:${escapeVCard(card.profile.profession)}`)

  for (const link of publicLinks) {
    if (link.type === 'phone') lines.push(`TEL:${escapeVCard(link.url.replace(/^tel:/, ''))}`)
    if (link.type === 'email') lines.push(`EMAIL:${escapeVCard(link.url.replace(/^mailto:/, ''))}`)
    if (link.type === 'website') lines.push(`URL:${escapeVCard(link.url)}`)
    if (link.type === 'telegram')
      lines.push(`X-SOCIALPROFILE;TYPE=telegram:${escapeVCard(link.url)}`)
  }

  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

export function downloadVCard(card: CardDraft): void {
  const blob = new Blob([createVCard(card)], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${card.publication.slug || 'contact'}.vcf`
  anchor.click()
  URL.revokeObjectURL(url)
}
