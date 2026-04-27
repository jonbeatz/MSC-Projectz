import type { Project, User } from '@/lib/types'

/**
 * True when the current session user is the vault owner of the project row
 * (same as server `user` on `msc-vault-projects` — not membership).
 */
export function msc_isVaultProjectOwner(project: Project, user: User | null | undefined): boolean {
  if (user?.payloadUserId == null || project.ownerUserId == null) return false
  return String(project.ownerUserId) === String(user.payloadUserId)
}
