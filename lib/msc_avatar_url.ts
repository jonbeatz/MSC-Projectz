/**
 * Single resolution path for Payload-shaped avatar fields before UI:
 * `avatar` may be a URL string, media id, populated `{ url }`, or unset; `avatarUrl` may be set separately.
 * Does not fetch media by id — missing URL yields null for caller fallback UI.
 */

export type MscAvatarSource = {
  avatar?: string | number | { url?: string | null } | null
  avatarUrl?: string | null
}

export function msc_resolveAvatarUrl(member: MscAvatarSource | null | undefined): string | null {
  if (member == null) return null

  const raw = member.avatar
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw
  }
  if (raw && typeof raw === 'object' && 'url' in raw) {
    const u = (raw as { url?: string | null }).url
    if (typeof u === 'string' && u.trim() !== '') return u
  }

  const fallback = member.avatarUrl
  if (typeof fallback === 'string' && fallback.trim() !== '') {
    return fallback
  }

  return null
}
