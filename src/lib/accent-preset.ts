import type { CSSProperties } from 'react'
import { accentPresets } from '@shared/accent-presets'
import type { Appearance } from '@shared/types'

export function accentStyle(preset: Appearance['accentPreset'], dark = false): CSSProperties {
  const value = accentPresets[preset]
  return {
    '--accent': value.base,
    '--accent-hover': value.hover,
    '--accent-soft': dark ? `color-mix(in srgb, ${value.base} 24%, #171d19)` : value.soft,
    '--accent-contrast': value.contrast,
    '--mini-accent': value.base,
  } as CSSProperties
}

export const accentOptions = Object.entries(accentPresets).map(([id, value]) => ({
  id: id as Appearance['accentPreset'],
  color: value.base,
}))
