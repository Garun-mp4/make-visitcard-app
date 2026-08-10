import type { ShareSource, ShareSourceCreate, ShareSourcePatch } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { apiRequest } from '@/services/api-client'

const demoKey = 'cardly:demo-share-sources'

function demoSources(): ShareSource[] {
  try {
    return JSON.parse(localStorage.getItem(demoKey) ?? '[]') as ShareSource[]
  } catch {
    return []
  }
}

function saveDemo(sources: ShareSource[]) {
  localStorage.setItem(demoKey, JSON.stringify(sources))
}

export async function loadShareSources(): Promise<ShareSource[]> {
  if (clientEnv.demoMode) return demoSources()
  return (await apiRequest<{ sources: ShareSource[] }>('/api/owner/share-sources')).sources
}

export async function createShareSource(input: ShareSourceCreate): Promise<ShareSource> {
  if (!clientEnv.demoMode)
    return (
      await apiRequest<{ source: ShareSource }>('/api/owner/share-sources', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).source
  const now = new Date().toISOString()
  const source: ShareSource = {
    id: crypto.randomUUID(),
    name: input.name,
    token: crypto.randomUUID().replaceAll('-', ''),
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  saveDemo([source, ...demoSources()])
  return source
}

export async function patchShareSource(id: string, patch: ShareSourcePatch): Promise<ShareSource> {
  if (!clientEnv.demoMode)
    return (
      await apiRequest<{ source: ShareSource }>(`/api/owner/share-sources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    ).source
  const sources = demoSources()
  const index = sources.findIndex((source) => source.id === id)
  if (index < 0) throw new Error('share_source_not_found')
  sources[index] = { ...sources[index], ...patch, updatedAt: new Date().toISOString() }
  saveDemo(sources)
  return sources[index]
}
