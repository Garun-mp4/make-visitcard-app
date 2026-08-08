import type { CSSProperties } from 'react'
import type { Appearance } from '@shared/types'

const accents: Record<
  Appearance['accentPreset'],
  { base: string; hover: string; soft: string; contrast: string }
> = {
  green: { base: '#1f6b4f', hover: '#17563f', soft: '#e0eee7', contrast: '#ffffff' },
  orange: { base: '#b85b24', hover: '#964719', soft: '#f5e6dc', contrast: '#ffffff' },
  blue: { base: '#3267a8', hover: '#28558c', soft: '#e2eaf5', contrast: '#ffffff' },
  violet: { base: '#7153a6', hover: '#5b418b', soft: '#ebe5f4', contrast: '#ffffff' },
  red: { base: '#a94e4e', hover: '#8d3e3e', soft: '#f3e2e2', contrast: '#ffffff' },
}

export function accentStyle(preset: Appearance['accentPreset'], dark = false): CSSProperties {
  const value = accents[preset]
  return {
    '--accent': value.base,
    '--accent-hover': value.hover,
    '--accent-soft': dark ? `color-mix(in srgb, ${value.base} 24%, #171d19)` : value.soft,
    '--accent-contrast': value.contrast,
    '--mini-accent': value.base,
  } as CSSProperties
}

export const accentOptions = Object.entries(accents).map(([id, value]) => ({
  id: id as Appearance['accentPreset'],
  color: value.base,
}))
