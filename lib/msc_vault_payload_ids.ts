import type { Payload } from 'payload'

/**
 * Payload `relationship` validation / SQLite IDs: coerces string to number when
 * the collection uses numeric IDs. Used by server actions and PAC; keep in sync
 * with collection `customIDType` / `defaultIDType`.
 */
export function msc_coercePayloadRelationId(payload: Payload, relationTo: string, id: string): string | number {
  const idType = payload.collections[relationTo]?.customIDType || payload.db?.defaultIDType || 'text'
  if (idType === 'number') {
    const trimmed = id.trim()
    if (trimmed !== '' && /^\d+$/.test(trimmed)) {
      return Number(trimmed)
    }
  }
  return id
}
