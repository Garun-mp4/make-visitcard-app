import { ImageResponse } from '@vercel/og'
import React from 'react'

import { accentPresets } from '../../shared/accent-presets.js'
import type { CardView } from '../../shared/types.js'

const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maximumAvatarBytes = 2 * 1024 * 1024
const maximumAvatarRedirects = 3
const darkAccentColors = {
  green: '#61b78d',
  orange: '#e3834c',
  blue: '#6e9ed9',
  violet: '#9a7ac9',
  red: '#d67373',
} as const

interface ThemeTokens {
  background: string
  surface: string
  text: string
  muted: string
  border: string
  eyebrow: string
}

function themeTokens(card: CardView): ThemeTokens {
  if (card.appearance.themeId === 'dark')
    return {
      background: '#10130f',
      surface: '#1b201a',
      text: '#f3f4f1',
      muted: '#aeb6ab',
      border: '#343a31',
      eyebrow: 'DIGITAL CARD / CARDLY',
    }
  if (card.appearance.themeId === 'editorial')
    return {
      background: '#e8dfce',
      surface: '#f7efdf',
      text: '#352b22',
      muted: '#6c5a48',
      border: '#bfb3a0',
      eyebrow: 'CARDLY / PERSONAL EDITION',
    }
  return {
    background: '#edf0eb',
    surface: '#fbfcf9',
    text: '#171916',
    muted: '#555b52',
    border: '#d5dbd1',
    eyebrow: 'CARDLY · ЦИФРОВАЯ ВИЗИТКА',
  }
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toUpperCase() ?? '')
    .join('')
}

function clamp(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  const characters = Array.from(normalized)
  if (characters.length <= maximum) return normalized
  return `${characters
    .slice(0, maximum - 1)
    .join('')
    .trimEnd()}…`
}

export async function loadOpenGraphAvatar(url: string): Promise<string | null> {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!isAllowedTelegramAvatarUrl(parsed)) return null
  try {
    const response = await fetchTelegramAvatar(
      parsed,
      maximumAvatarRedirects,
      AbortSignal.timeout(1800),
    )
    if (!response) return null
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
    if (!allowedAvatarTypes.has(contentType)) return null
    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (declaredLength > maximumAvatarBytes) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > maximumAvatarBytes) return null
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

function isAllowedTelegramAvatarUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase()
  return (
    url.protocol === 'https:' &&
    (hostname === 't.me' ||
      hostname === 'telegram.org' ||
      hostname.endsWith('.telegram.org') ||
      hostname === 'telegram-cdn.org' ||
      hostname.endsWith('.telegram-cdn.org'))
  )
}

async function fetchTelegramAvatar(
  url: URL,
  redirectsLeft: number,
  signal: AbortSignal,
): Promise<Response | null> {
  const response = await fetch(url, {
    redirect: 'manual',
    signal,
    headers: { Accept: 'image/webp,image/png,image/jpeg' },
  })
  if (response.status >= 300 && response.status < 400) {
    if (redirectsLeft <= 0) return null
    const location = response.headers.get('location')
    if (!location) return null
    const redirect = new URL(location, url)
    if (!isAllowedTelegramAvatarUrl(redirect)) return null
    return fetchTelegramAvatar(redirect, redirectsLeft - 1, signal)
  }
  return response.ok ? response : null
}

export async function renderOpenGraphImage(card: CardView): Promise<ImageResponse> {
  const theme = themeTokens(card)
  const accent = accentPresets[card.appearance.accentPreset]
  const avatar = await loadOpenGraphAvatar(card.profile.avatarUrl)
  const editorial = card.appearance.themeId === 'editorial'
  const dark = card.appearance.themeId === 'dark'
  const accentColor = dark ? darkAccentColors[card.appearance.accentPreset] : accent.base
  const avatarRadius =
    card.appearance.avatarShape === 'circle'
      ? '999px'
      : card.appearance.avatarShape === 'square'
        ? '18px'
        : '42px'

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '42px',
        background: theme.background,
        color: theme.text,
        fontFamily: 'Noto Sans',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          border: `2px solid ${theme.border}`,
          borderRadius: editorial ? '8px' : '34px',
          background: theme.surface,
          padding: '46px 54px 42px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: editorial ? '16px' : '100%',
            height: editorial ? '100%' : '12px',
            display: 'flex',
            background: accentColor,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: dark ? accentColor : theme.muted,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.12em',
          }}
        >
          <span>{theme.eyebrow}</span>
          <span style={{ color: accentColor }}>/{card.publication.slug}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '54px',
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: editorial ? 64 : 58,
                lineHeight: 1.04,
                fontWeight: editorial ? 600 : 720,
                letterSpacing: editorial ? '-0.035em' : '-0.045em',
              }}
            >
              {clamp(card.profile.displayName, 60)}
            </div>
            <div
              style={{
                display: 'flex',
                maxWidth: '700px',
                color: accentColor,
                fontSize: 30,
                lineHeight: 1.24,
                fontWeight: 620,
              }}
            >
              {clamp(card.profile.profession, 80)}
            </div>
            {card.profile.bio ? (
              <div
                style={{
                  display: 'flex',
                  maxWidth: '690px',
                  color: theme.muted,
                  fontSize: 21,
                  lineHeight: 1.45,
                }}
              >
                {clamp(card.profile.bio, 150)}
              </div>
            ) : null}
          </div>

          <div
            style={{
              width: '190px',
              height: '190px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: avatarRadius,
              border: `3px solid ${accentColor}`,
              background: dark ? '#293129' : accent.soft,
              color: accentColor,
              fontSize: 54,
              fontWeight: 650,
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                width="190"
                height="190"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials(card.profile.displayName)
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '28px',
            color: theme.muted,
            fontSize: 18,
          }}
        >
          <span>{card.profile.availabilityText || 'Профессиональные контакты и проекты'}</span>
          <span style={{ color: theme.text, fontWeight: 700 }}>cardly</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=31536000',
      },
    },
  )
}
