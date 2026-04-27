export type MscAppRole = 'master-admin' | 'admin' | 'user'

export function msc_normalizeRole(role: unknown): MscAppRole {
  if (role === 'master-admin') return 'master-admin'
  if (role === 'admin') return 'admin'
  return 'user'
}

export function msc_isMasterAdminRole(role: unknown): boolean {
  return msc_normalizeRole(role) === 'master-admin'
}

export function msc_hasAdminAccess(role: unknown): boolean {
  const normalized = msc_normalizeRole(role)
  return normalized === 'admin' || normalized === 'master-admin'
}
