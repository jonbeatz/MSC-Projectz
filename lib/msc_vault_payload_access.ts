import type { Access, Where, TypedUser } from 'payload'

type MscUserWithRole = TypedUser & { id: number | string; role?: 'admin' | 'user' | null }

export function msc_vaultIsPayloadAdmin(
  user: MscUserWithRole | null | undefined,
): user is MscUserWithRole {
  return Boolean(user && (user as MscUserWithRole).role === 'admin')
}

/**
 * Zero-leak: non-admins only read rows where `user` = session id; admins read all.
 * Unauthenticated `false` (Local API may still `overrideAccess` for migrations only).
 */
export const msc_vaultReadOwnProjects: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as MscUserWithRole).role === 'admin') return true
  return { user: { equals: user.id } } as Where
}

export const msc_vaultUpdateOwnProject: Access = msc_vaultReadOwnProjects
export const msc_vaultDeleteOwnProject: Access = msc_vaultReadOwnProjects

export const msc_vaultCreateProject: Access = ({ req }) => Boolean(req.user)

/**
 * Task rows: non-admins only see tasks for projects they own. Resolve with a scoped `project.in` filter.
 */
export const msc_vaultReadOwnTasks: Access = async ({ req }) => {
  const u = req.user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_vaultIsPayloadAdmin(u)) return true
  const pl = req.payload
  const projs = await pl.find({
    collection: 'msc-vault-projects',
    where: { user: { equals: u.id } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })
  const ids = projs.docs.map((d) => d.id)
  if (ids.length === 0) {
    return false
  }
  return { project: { in: ids } } as unknown as Where
}

type MscProjectRow = { user?: string | number | { id: string | number } | null }

export const msc_vaultUpdateOwnTasks: Access = msc_vaultReadOwnTasks
export const msc_vaultDeleteOwnTasks: Access = msc_vaultReadOwnTasks

/**
 * Create: only if the target project is owned by the current user (or user is admin).
 */
export const msc_vaultCreateTask: Access = async ({ req, data }) => {
  const u = req.user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_vaultIsPayloadAdmin(u)) return true
  const pl = req.payload
  const projectId = (data as { project?: string | number } | undefined)?.project
  if (projectId === undefined || projectId === null) return false
  const doc = (await pl.findByID({
    collection: 'msc-vault-projects',
    id: projectId,
    depth: 0,
    overrideAccess: true,
  })) as MscProjectRow
  if (!doc) return false
  const owner = doc.user
  const ownerId = typeof owner === 'object' && owner !== null && 'id' in owner ? owner.id : owner
  return String(ownerId) === String(u.id)
}
