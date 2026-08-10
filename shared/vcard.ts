import type { CardLink, CardView } from './types.js'

export type ContactLocale = 'ru' | 'en'

export function publicContactLinks(card: CardView): CardLink[] {
  return card.links
    .filter((link) => link.enabled && link.public && link.url.trim())
    .sort((a, b) => a.position - b.position)
}

export function escapeVCard(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
}

function withoutScheme(value: string, scheme: 'tel:' | 'mailto:'): string {
  return value.replace(new RegExp(`^${scheme}`, 'i'), '')
}

export function contactDisplayValue(link: CardLink): string {
  if (link.type === 'phone') return withoutScheme(link.url, 'tel:')
  if (link.type === 'email') return withoutScheme(link.url, 'mailto:')
  if (link.type === 'telegram') {
    const match = link.url.match(/^https?:\/\/(?:www\.)?t\.me\/([^/?#]+)/i)
    return match?.[1] ? `@${match[1]}` : link.url
  }
  return link.url
}

export function createVCard(card: CardView, publicUrl: string): string {
  const name = card.profile.displayName.trim()
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(name)}`,
    `N:;${escapeVCard(name)};;;`,
  ]

  if (card.profile.profession.trim())
    lines.push(`TITLE:${escapeVCard(card.profile.profession.trim())}`)

  for (const link of publicContactLinks(card)) {
    const value = escapeVCard(contactDisplayValue(link))
    if (link.type === 'phone') lines.push(`TEL;TYPE=CELL:${value}`)
    else if (link.type === 'email') lines.push(`EMAIL;TYPE=INTERNET:${value}`)
    else if (link.type === 'telegram')
      lines.push(`X-SOCIALPROFILE;TYPE=telegram:${escapeVCard(link.url)}`)
    else lines.push(`URL;TYPE=WORK:${escapeVCard(link.url)}`)
  }

  lines.push(`item1.URL:${escapeVCard(publicUrl)}`)
  lines.push('item1.X-ABLabel:Cardly')
  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

const linkNames: Record<CardLink['type'], [string, string]> = {
  telegram: ['Telegram', 'Telegram'],
  website: ['Сайт', 'Website'],
  github: ['GitHub', 'GitHub'],
  behance: ['Behance', 'Behance'],
  youtube: ['YouTube', 'YouTube'],
  vk: ['VK', 'VK'],
  linkedin: ['LinkedIn', 'LinkedIn'],
  pinterest: ['Pinterest', 'Pinterest'],
  email: ['Email', 'Email'],
  phone: ['Телефон', 'Phone'],
  custom: ['Ссылка', 'Link'],
}

export function formatContactText(
  card: CardView,
  publicUrl: string,
  locale: ContactLocale,
): string {
  const index = locale === 'en' ? 1 : 0
  const lines = [card.profile.displayName.trim()]
  if (card.profile.profession.trim()) lines.push(card.profile.profession.trim())
  for (const link of publicContactLinks(card)) {
    const value = link.type === 'telegram' ? link.url : contactDisplayValue(link)
    lines.push(`${linkNames[link.type][index]}: ${value}`)
  }
  lines.push(`${locale === 'en' ? 'Business card' : 'Визитка'}: ${publicUrl}`)
  return lines.join('\n')
}
