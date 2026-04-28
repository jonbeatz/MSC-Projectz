/**
 * Turns raw Payload/SQLite exceptions into short, operator-safe copy for Command Center UI.
 * Safe to call multiple times (idempotent for already-friendly strings).
 */

/** Canonical copy for migrated SQLite / Payload infra failures — CRM hides scary red banners for this text. */
export const MSC_UI_QUIET_INFRA_MESSAGE =
  'Could not reach the database for this action. Try refreshing the page. If it persists, repair your local Payload/SQLite database.'

export function msc_publicPayloadError(raw: string | null | undefined): string {
  if (raw == null) return ''
  const s = String(raw).trim()
  if (!s) return ''

  const lower = s.toLowerCase()
  const looksTechnical =
    lower.includes('failed query') ||
    lower.includes('payload_locked_documents') ||
    lower.includes('__new_payload') ||
    lower.includes('libsql') ||
    lower.includes('sqlite_error') ||
    lower.includes('sql error') ||
    /\bselect\b[\s\S]{0,120}\bfrom\b/i.test(s) ||
    /\binsert\b[\s\S]{0,80}\binto\b/i.test(s) ||
    (lower.includes('params:') && s.length > 80) ||
    s.includes('`') ||
    s.length > 220

  if (looksTechnical) {
    return MSC_UI_QUIET_INFRA_MESSAGE
  }

  return s.length > 220 ? `${s.slice(0, 217)}…` : s
}

/**
 * True when the error is (or maps to) {@link MSC_UI_QUIET_INFRA_MESSAGE}.
 * Command Center uses this to skip destructive red alerts for noisy local DB noise.
 */
export function msc_isQuietInfrastructureUiMessage(raw: string | null | undefined): boolean {
  if (raw == null || !String(raw).trim()) return false
  return msc_publicPayloadError(raw) === MSC_UI_QUIET_INFRA_MESSAGE
}
