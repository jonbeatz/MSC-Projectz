import 'server-only'

import type { Payload } from 'payload'

import { msc_coercePayloadRelationId } from '@/lib/msc_vault_payload_ids'
import { msc_hasAdminAccess } from '@/lib/msc_roles'
import {
  msc_vaultUserMayReadProject,
  msc_vaultUserOwnsProjectForWrite,
  type MscUserWithRole,
} from '@/lib/msc_vault_payload_access'

type MscPacUser = MscUserWithRole

/** Use with thrown `Error` when PAC denies (matches existing server-action tone). */
export const msc_pacNotAuthorizedMessage = 'Not authorized to perform this action for the current user.'

type MscTaskRowLike = { id?: string | number; project?: string | number | { id: string | number } | null }

/**
 * Resolves a task's `project` relation to a string | number id for follow-up checks.
 */
function msc_pacTaskProjectId(task: MscTaskRowLike | null | undefined): string | number | null {
  if (!task) return null
  const p = task.project
  if (p === undefined || p === null) return null
  if (typeof p === 'object' && 'id' in p) return p.id
  return p
}

/**
 * `msc_vaultReadOwnProjects`: admin = all; else user is project owner or in `members`.
 * Loads the project with `overrideAccess: true` only to evaluate visibility (defense in
 * depth when the caller will use `overrideAccess: false` on subsequent writes).
 */
export async function msc_canViewProject(arg: {
  payload: Payload
  user: MscPacUser | null | undefined
  projectId: string | number
}): Promise<boolean> {
  const { payload, user } = arg
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true
  const pid = msc_coercePayloadRelationId(payload, 'msc-vault-projects', String(arg.projectId))
  let project: { user?: unknown; members?: unknown } | null
  try {
    project = (await payload.findByID({
      collection: 'msc-vault-projects',
      id: pid,
      depth: 0,
      overrideAccess: true,
    })) as { user?: unknown; members?: unknown } | null
  } catch {
    return false
  }
  if (!project) return false
  return msc_vaultUserMayReadProject(user, project)
}

/**
 * Same as Payload `msc_vaultReadOwnTasks` / `msc_vaultUpdateOwnTasks`: if the task's
 * project is readable, the user may list/update the task.
 */
export async function msc_canViewTask(arg: {
  payload: Payload
  user: MscPacUser | null | undefined
  taskId: string | number
}): Promise<boolean> {
  const { payload, user } = arg
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true
  const tid = msc_coercePayloadRelationId(payload, 'msc-vault-tasks', String(arg.taskId))
  let task: MscTaskRowLike | null
  try {
    task = (await payload.findByID({
      collection: 'msc-vault-tasks',
      id: tid,
      depth: 0,
      overrideAccess: true,
    })) as MscTaskRowLike | null
  } catch {
    return false
  }
  if (!task) return false
  const pr = msc_pacTaskProjectId(task)
  if (pr == null) return false
  return msc_canViewProject({ payload, user, projectId: pr })
}

/**
 * Aligned with `msc_vaultUpdateOwnTasks` / `msc_vaultDeleteOwnTasks` (identical to read
 * on task collection): owner or project member (or admin) may edit/delete an **existing** task.
 */
export async function msc_canEditTask(arg: {
  payload: Payload
  user: MscPacUser | null | undefined
  taskId: string | number
}): Promise<boolean> {
  return msc_canViewTask(arg)
}

/**
 * `msc_vaultCreateTask`: only admin or user who **owns** the project (not members-only)
 * may create a task. Call from create-task server paths before `payload.create`.
 */
export async function msc_canCreateTaskOnProject(arg: {
  payload: Payload
  user: MscPacUser | null | undefined
  projectId: string | number
}): Promise<boolean> {
  const { payload, user } = arg
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true
  const pid = msc_coercePayloadRelationId(payload, 'msc-vault-projects', String(arg.projectId))
  let project: { user?: unknown } | null
  try {
    project = (await payload.findByID({
      collection: 'msc-vault-projects',
      id: pid,
      depth: 0,
      overrideAccess: true,
    })) as { user?: unknown } | null
  } catch {
    return false
  }
  if (!project) return false
  const owner = project.user
  const ownerId =
    typeof owner === 'object' && owner !== null && 'id' in owner ? (owner as { id: string | number }).id : owner
  return String(ownerId) === String(user.id)
}

/**
 * Project **write** (update/delete project row, reorder when owned, delete project):
 * `msc_vaultWriteOwnProjects` — admin or project owner, not members-only.
 */
export async function msc_canWriteVaultProjectAsOwner(arg: {
  payload: Payload
  user: MscPacUser | null | undefined
  projectId: string | number
}): Promise<boolean> {
  const { payload, user } = arg
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true
  const pid = msc_coercePayloadRelationId(payload, 'msc-vault-projects', String(arg.projectId))
  let project: { user?: unknown } | null
  try {
    project = (await payload.findByID({
      collection: 'msc-vault-projects',
      id: pid,
      depth: 0,
      overrideAccess: true,
    })) as { user?: unknown } | null
  } catch {
    return false
  }
  if (!project) return false
  return msc_vaultUserOwnsProjectForWrite(user, project)
}
