import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function formatPrice(value: number | null, currency: 'RUB' | 'USD' | 'EUR'): string {
  if (value === null) return ''
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const copy = [...items]
  const current = copy[index]
  const next = copy[nextIndex]
  if (current === undefined || next === undefined) return items
  copy[index] = next
  copy[nextIndex] = current
  return copy
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
    const input = document.createElement('textarea')
    input.value = value
    input.readOnly = true
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    return copied
  } catch {
    return false
  }
}
