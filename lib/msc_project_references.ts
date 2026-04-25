import type { ProjectReference } from '@/lib/types'

function msc_generateRefId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `ref-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Normalizes persisted JSON into `ProjectReference[]` with `Date` instances. */
export function msc_parseReferencesJson(raw: string | null | undefined): ProjectReference[] {
  if (raw == null || !String(raw).trim()) return []
  try {
    const parsed = JSON.parse(String(raw)) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        const id = typeof o.id === 'string' ? o.id : msc_generateRefId()
        const title = typeof o.title === 'string' ? o.title : 'Untitled'
        const kind = o.kind === 'file' || o.kind === 'link' ? o.kind : 'link'
        const url = typeof o.url === 'string' ? o.url : undefined
        const fileDataUrl = typeof o.fileDataUrl === 'string' ? o.fileDataUrl : undefined
        const mime = typeof o.mime === 'string' ? o.mime : undefined
        const fileName = typeof o.fileName === 'string' ? o.fileName : undefined
        const createdRaw = o.createdAt
        const createdAt =
          typeof createdRaw === 'string' || typeof createdRaw === 'number'
            ? new Date(createdRaw)
            : new Date()
        return {
          id,
          title,
          kind,
          url,
          fileDataUrl,
          mime,
          fileName,
          createdAt,
        } satisfies ProjectReference
      })
      .filter(Boolean) as ProjectReference[]
  } catch {
    return []
  }
}

export function msc_stringifyReferencesJson(refs: ProjectReference[]): string {
  const serializable = refs.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }))
  return JSON.stringify(serializable)
}

export function msc_createEmptyReference(kind: ProjectReference['kind'], title: string): ProjectReference {
  return {
    id: msc_generateRefId(),
    title: title.trim() || (kind === 'link' ? 'Link' : 'File'),
    kind,
    createdAt: new Date(),
  }
}
