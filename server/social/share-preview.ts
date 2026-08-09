import type { CardView } from '../../shared/types.js'

export interface SharePreviewMetadata {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
  imageAlt: string
  version: string
  themeColor: string
}

function compactText(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  const characters = Array.from(normalized)
  if (characters.length <= maximum) return normalized
  return `${characters
    .slice(0, Math.max(0, maximum - 1))
    .join('')
    .trimEnd()}…`
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  )
}

function normalizedOrigin(origin: string): string {
  return new URL(origin).origin
}

export function createSharePreviewVersion(card: CardView): string {
  return Date.parse(card.updatedAt).toString(36)
}

export function buildSharePreviewMetadata(card: CardView, origin: string): SharePreviewMetadata {
  const safeOrigin = normalizedOrigin(origin)
  const version = createSharePreviewVersion(card)
  const slug = card.publication.slug
  const title = compactText(`${card.profile.displayName} — ${card.profile.profession}`, 120)
  const description = compactText(
    card.profile.bio || `${card.profile.profession}. Цифровая визитка в Cardly.`,
    160,
  )
  return {
    title,
    description,
    canonicalUrl: `${safeOrigin}/c/${slug}`,
    imageUrl: `${safeOrigin}/api/public/cards/${slug}/og.png?v=${encodeURIComponent(version)}`,
    imageAlt: compactText(`Визитка ${card.profile.displayName}`, 120),
    version,
    themeColor:
      card.appearance.themeId === 'dark'
        ? '#141613'
        : card.appearance.themeId === 'editorial'
          ? '#f3ecdd'
          : '#f8f8f5',
  }
}

export function renderPublicCardHtml(indexHtml: string, metadata: SharePreviewMetadata): string {
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const canonicalUrl = escapeHtml(metadata.canonicalUrl)
  const imageUrl = escapeHtml(metadata.imageUrl)
  const imageAlt = escapeHtml(metadata.imageAlt)
  const themeColor = escapeHtml(metadata.themeColor)
  const tags = [
    `<title>${title}</title>`,
    `<meta data-cardly-share name="description" content="${description}" />`,
    `<link data-cardly-share rel="canonical" href="${canonicalUrl}" />`,
    `<meta data-cardly-share property="og:type" content="profile" />`,
    `<meta data-cardly-share property="og:site_name" content="Cardly" />`,
    `<meta data-cardly-share property="og:title" content="${title}" />`,
    `<meta data-cardly-share property="og:description" content="${description}" />`,
    `<meta data-cardly-share property="og:url" content="${canonicalUrl}" />`,
    `<meta data-cardly-share property="og:image" content="${imageUrl}" />`,
    `<meta data-cardly-share property="og:image:secure_url" content="${imageUrl}" />`,
    '<meta data-cardly-share property="og:image:type" content="image/png" />',
    '<meta data-cardly-share property="og:image:width" content="1200" />',
    '<meta data-cardly-share property="og:image:height" content="630" />',
    `<meta data-cardly-share property="og:image:alt" content="${imageAlt}" />`,
    '<meta data-cardly-share name="twitter:card" content="summary_large_image" />',
    `<meta data-cardly-share name="twitter:title" content="${title}" />`,
    `<meta data-cardly-share name="twitter:description" content="${description}" />`,
    `<meta data-cardly-share name="twitter:image" content="${imageUrl}" />`,
    `<meta data-cardly-share name="theme-color" content="${themeColor}" />`,
  ].join('\n    ')

  return indexHtml
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
    .replace(/<meta\s+name=["']theme-color["'][^>]*>/i, '')
    .replace(/\s*<[^>]+data-cardly-share[^>]*>\s*/gi, '\n')
    .replace('</head>', `    ${tags}\n  </head>`)
}
