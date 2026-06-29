import type { Access, Where, TypedUser } from 'payload'
import { msc_hasAdminAccess } from '@/lib/msc_roles'

export type MscUserWithRole = TypedUser & {
  id: number | string
  role?: 'master-admin' | 'admin' | 'user' | null
}

/** Project doc shape for in-memory access checks (Payload `findByID` is wider). */
type MscProjectRowLike = { user?: unknown; members?: unknown }

/**
 * In-memory read check mirroring `msc_vaultReadOwnProjects`: admin sees all; else owner
 * or hasMany `members` contains the user. Used by `msc_access_control` (source of truth
 * for PAC must stay aligned with this).
 */
export function msc_vaultUserMayReadProject(
  user: MscUserWithRole | null | undefined,
  project: MscProjectRowLike | null | undefined,
): boolean {
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true
  if (!project) return false
  const owner = project.user
  const ownerId = typeof owner === 'object' && owner !== null && 'id' in owner ? owner.id : owner
  if (String(ownerId) === String(user.id)) return true
  const members = project.members
  if (!Array.isArray(members)) return false
  for (const m of members) {
    const mid = m && typeof m === 'object' && m !== null && 'id' in m ? (m as { id: string | number }).id : m
    if (mid != null && String(mid) === String(user.id)) return true
  }
  return false
}

/**
 * Mirrors `msc_vaultWriteOwnProjects` (project row update/delete): admin or project owner
 * only — not collaborators listed in `members` alone.
 */
export function msc_vaultUserOwnsProjectForWrite(
  user: MscUserWithRole | null | undefined,
  project: MscProjectRowLike | null | undefined,
): boolean {
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true
  if (!project) return false
  const owner = project.user
  const ownerId = typeof owner === 'object' && owner !== null && 'id' in owner ? owner.id : owner
  return String(ownerId) === String(user.id)
}

export function msc_vaultIsPayloadAdmin(user: MscUserWithRole | null | undefined): user is MscUserWithRole {
  return Boolean(user && msc_hasAdminAccess((user as MscUserWithRole).role))
}

function msc_vaultProjectVisibilityWhere(userId: string | number): Where {
  return {
    or: [{ user: { equals: userId } }, { members: { contains: userId } }],
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

type MscSnippetRowLike = {
  author?: string | number | { id: string | number } | null
  project?: string | number | { id: string | number } | null
}

function msc_snippetAuthorId(row: MscSnippetRowLike | null | undefined): string | number | null {
  const a = row?.author
  if (a == null) return null
  if (typeof a === 'object' && 'id' in a) return (a as { id: string | number }).id
  return a
}

function msc_snippetProjectId(row: MscSnippetRowLike | null | undefined): string | number | null {
  const p = row?.project
  if (p == null) return null
  if (typeof p === 'object' && 'id' in p) return (p as { id: string | number }).id
  return p
}

/**
 * Snippets: projects the user can read (owner or member), then either authored by them or
 * published with project visibility (shared library).
 */
export const msc_vaultReadOwnSnippets: Access = async ({ req }) => {
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
  return {
    and: [
      { project: { in: ids } },
      {
        or: [
          { author: { equals: u.id } },
          {
            and: [{ status: { equals: 'published' } }, { visibility: { equals: 'project' } }],
          },
        ],
      },
    ],
  } as Where
}

/**
 * Create: any user who can **read** the target project (owner or member), or admin.
 */
export const msc_vaultCreateSnippet: Access = async ({ req, data }) => {
  const u = req.user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_hasAdminAccess(u.role)) return true
  const projectId = (data as { project?: string | number } | undefined)?.project
  if (projectId === undefined || projectId === null) return false
  const doc = (await req.payload.findByID({
    collection: 'msc-vault-projects',
    id: projectId,
    depth: 0,
    overrideAccess: true,
  })) as MscProjectRowLike | null
  if (!doc) return false
  return msc_vaultUserMayReadProject(u, doc)
}

/**
 * Update / delete: snippet author, or project owner (moderation), or admin.
 * Status transitions to `published` are further gated in `beforeChange` on the collection.
 */
async function msc_vaultSnippetAuthorOrOwnerAccess(args: {
  req: { user?: unknown; payload: import('payload').Payload }
  id?: string | number | null
}): Promise<boolean> {
  const u = args.req.user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_hasAdminAccess(u.role)) return true
  const sid = args.id
  if (sid === undefined || sid === null) return false
  const snippet = (await args.req.payload.findByID({
    collection: 'msc-vault-snippets',
    id: sid,
    depth: 0,
    overrideAccess: true,
  })) as MscSnippetRowLike | null
  if (!snippet) return false
  if (String(msc_snippetAuthorId(snippet)) === String(u.id)) return true
  const pid = msc_snippetProjectId(snippet)
  if (pid == null) return false
  const project = (await args.req.payload.findByID({
    collection: 'msc-vault-projects',
    id: pid,
    depth: 0,
    overrideAccess: true,
  })) as MscProjectRowLike | null
  return msc_vaultUserOwnsProjectForWrite(u, project)
}

export const msc_vaultUpdateOwnSnippets: Access = async ({ req, id }) => {
  return msc_vaultSnippetAuthorOrOwnerAccess({ req, id })
}

export const msc_vaultDeleteOwnSnippets: Access = async ({ req, id }) => {
  return msc_vaultSnippetAuthorOrOwnerAccess({ req, id })
}
