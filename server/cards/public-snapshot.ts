import { cardDraftSchema } from '../../shared/schemas.js'

export function sanitizePublicSnapshot(input: unknown) {
  const card = cardDraftSchema.parse(input)
  return {
    profile: { ...card.profile },
    primaryAction: card.primaryAction.enabled
      ? card.primaryAction
      : { ...card.primaryAction, value: '', enabled: false },
    skills: card.appearance.showSkills
      ? card.skills.slice(0, 10).sort((a, b) => a.position - b.position)
      : [],
    links: card.links
      .filter((link) => link.enabled && link.public)
      .map(({ id, type, label, url, position }) => ({
        id,
        type,
        label,
        url,
        enabled: true,
        public: true,
        position,
      })),
    services: card.appearance.showServices
      ? card.services.filter((service) => service.enabled).slice(0, 6)
      : [],
    projects: card.appearance.showProjects
      ? card.projects.filter((project) => project.enabled).slice(0, 6)
      : [],
    appearance: card.appearance,
    publication: {
      slug: card.publication.slug,
      published: true,
      publishedAt: card.publication.publishedAt,
      updatedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  }
}

export type PublicSnapshot = ReturnType<typeof sanitizePublicSnapshot>
