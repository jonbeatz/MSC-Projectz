'use client'

import { msc_createProjectSnippet } from '@/lib/msc_vault_snippet_actions'
import { msc_getScopedKey, type MscScopedUserId } from '@/lib/msc_scoped_storage'

/** Same base key as legacy `VaultLayout` (scoped per user via `msc_getScopedKey`). */
export const MSC_VAULT_LEGACY_SNIPPETS_KEY_BASE = 'msc-projectz-vault-snippets'

export type MscMigrateLegacySnippetsResult =
  { ok: true; imported: number } | { ok: false; error: string; imported: number }

export function msc_hasLegacyVaultSnippets(userId: MscScopedUserId): boolean {
  if (typeof window === 'undefined') return false
  if (userId === null || userId === undefined || String(userId).trim() === '') return false
  try {
    const key = msc_getScopedKey(MSC_VAULT_LEGACY_SNIPPETS_KEY_BASE, userId)
    const raw = window.localStorage.getItem(key)
    return raw !== null && raw !== ''
  } catch {
    return false
  }
}

/**
 * Reads legacy `localStorage` snippets for this user and creates Payload `msc-vault-snippets`
 * rows for the given project. Removes the legacy key only after every create succeeds.
 */
export async function msc_migrateLegacySnippets(params: {
  userId: string | number
  projectId: string
}): Promise<MscMigrateLegacySnippetsResult> {
  const { userId, projectId } = params
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Migration runs in the browser only.', imported: 0 }
  }

  let key: string
  try {
    key = msc_getScopedKey(MSC_VAULT_LEGACY_SNIPPETS_KEY_BASE, userId)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid user id.', imported: 0 }
  }

  const raw = window.localStorage.getItem(key)
  if (raw === null || raw === '') {
    return { ok: true, imported: 0 }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Legacy snippet data is not valid JSON.', imported: 0 }
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'Legacy snippet data must be a JSON array.', imported: 0 }
  }

  if (parsed.length === 0) {
    window.localStorage.removeItem(key)
    return { ok: true, imported: 0 }
  }

  const rows = parsed.filter(
    (item): item is Record<string, unknown> => item !== null && typeof item === 'object' && !Array.isArray(item),
  )

  if (rows.length === 0) {
    return { ok: false, error: 'Legacy data contained no importable snippets.', imported: 0 }
  }

  let imported = 0
  for (const rec of rows) {
    const title = String(rec.title ?? 'Untitled').trim() || 'Untitled'
    const content = String(rec.content ?? '')
    const res = await msc_createProjectSnippet({
      projectId,
      title,
      content,
      language: 'typescript',
      category: 'general',
      visibility: 'personal',
      status: 'draft',
    })
    if (!res.ok) {
      return { ok: false, error: res.error, imported }
    }
    imported++
  }

  window.localStorage.removeItem(key)
  return { ok: true, imported }
}
