import type { CardView } from '@shared/types'

export const cleanProjectColors = ['#dce9e2', '#e9e2d5', '#dde3ed', '#e9e0ea']
export const darkProjectColors = ['#253a32', '#3a3026', '#283241', '#352a35']
export const editorialProjectColors = ['#b9c9be', '#d8c4aa', '#b8c1cf', '#cbb8c5']

export function cardInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function orderedPublicData(card: CardView) {
  return {
    skills: card.skills.slice().sort((a, b) => a.position - b.position),
    services: card.services.filter((item) => item.enabled).sort((a, b) => a.position - b.position),
    projects: card.projects.filter((item) => item.enabled).sort((a, b) => a.position - b.position),
  }
}
