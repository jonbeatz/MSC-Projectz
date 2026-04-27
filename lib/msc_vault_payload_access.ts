import type { Access, Where, TypedUser } from 'payload'
import { msc_hasAdminAccess } from '@/lib/msc_roles'

type MscUserWithRole = TypedUser & {
  id: number | string
  role?: 'master-admin' | 'admin' | 'user' | null
}

export function msc_vaultIsPayloadAdmin(
  user: MscUserWithRole | null | undefined,
): user is MscUserWithRole {
  return Boolean(user && msc_hasAdminAccess((user as MscUserWithRole).role))
}

function msc_vaultProjectVisibilityWhere(userId: string | number): Where {
  return {
    or: [
      { user: { equals: userId } },
      { members: { contains: userId } },
    ],
  } as Where
}

/**
 * Zero-leak: non-admins only read rows where `user` = session id or they are a project member.
 * Unauthenticated `false` (Local API may still `overrideAccess` for migrations only).
 */
export const msc_vaultReadOwnProjects: Access = ({ req: { user } }) => {
  const u = user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_hasAdminAccess(u.role)) return true
  return msc_vaultProjectVisibilityWhere(u.id)
}

/**
 * Write-strict: admins may update/delete any project. Non-admins may only change rows they own
 * (`user` = session), not projects where they are only a member (compare to read, which includes members).
 */
export const msc_vaultWriteOwnProjects: Access = ({ req: { user } }) => {
  const u = user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_hasAdminAccess(u.role)) return true
  return { user: { equals: u.id } } as Where
}

export const msc_vaultCreateProject: Access = ({ req }) => Boolean(req.user)

/**
 * Task rows: non-admins only see tasks for projects they own or where they are members.
 */
export const msc_vaultReadOwnTasks: Access = async ({ req }) => {
  const u = req.user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_hasAdminAccess(u.role)) return true
  const pl = req.payload
  const projs = await pl.find({
    collection: 'msc-vault-projects',
    where: msc_vaultProjectVisibilityWhere(u.id),
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
  if (msc_hasAdminAccess(u.role)) return true
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
