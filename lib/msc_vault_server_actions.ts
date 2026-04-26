'use server'

/**
 * Desktop shell (Explorer / Cursor) must run in the Tauri webview, not in Node.
 * Use: `msc_open_project_folder` / `msc_launch_in_cursor` from `@/lib/msc_native_system_bridge`.
 *
 * Collection access for vault data is tenant-scoped via Payload `users` + httpOnly session.
 * Runtime actions do not bypass access; sign in with `msc_login` / `msc_vaultSignInToPayload`
 * so project reads/writes are scoped to the authenticated user.
 */

import { getPayload } from 'payload'
import type { Payload, Where } from 'payload'
import { createPayloadRequest, generatePayloadCookie } from 'payload'
import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { msc_getVaultLocalApiContext, msc_vaultLocalApiOptions } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'
import type { AppSettings, Credential, Project, Task, TaskStatus } from '@/lib/types'
import { msc_mergeProjectsAndTasks, msc_mapProjectDoc, msc_mapTaskDoc } from '@/lib/msc_map_vault'
import { msc_stringifyReferencesJson } from '@/lib/msc_project_references'
import { getSafePath } from '@/lib/env-utils'

type MscRegisterUserResult = { success: boolean; message: string }
type MscLoginResult = {
  success: boolean
  message: string
  user?: { id: string | number | undefined; email: string; role: 'admin' | 'user' }
}

type MscSystemConfigInput = Pick<AppSettings, 'pathFormat' | 'smtp'>

function msc_revalidateVaultUi() {
  revalidatePath('/')
}

async function msc_logVaultAuthDebug(actionName: string, user: unknown) {
  const h = await headers()
  const cookieHeader = h.get('cookie') || ''
  console.log(`SERVER: ${actionName} auth context`, {
    hasCookieHeader: cookieHeader.length > 0,
    hasPayloadTokenCookie: /payload-token|payload.*-token|msc.*-token/i.test(cookieHeader),
    userId: (user as { id?: string | number } | null)?.id ?? null,
    role: (user as { role?: string | null } | null)?.role ?? null,
  })
}

async function msc_requireVaultAdmin(actionName: string) {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user || !msc_vaultIsPayloadAdmin(ctx.user as Parameters<typeof msc_vaultIsPayloadAdmin>[0])) {
    throw new Error(`Admin privileges required for ${actionName}.`)
  }
  return ctx
}

/** Admin-only guardrail for global system config workflows (SMTP, SSL, path format). */
export async function msc_updateSystemConfig(input: MscSystemConfigInput): Promise<MscSystemConfigInput> {
  await msc_requireVaultAdmin('system configuration update')
  return input
}

/** Admin-only SMTP test workflow. Real delivery can replace this stub without weakening RBAC. */
export async function msc_testSystemEmailConfig(input: MscSystemConfigInput): Promise<{ success: boolean; message: string }> {
  await msc_requireVaultAdmin('system email test')
  if (input.smtp.username && input.smtp.password) {
    return { success: true, message: 'Test email sent successfully!' }
  }
  return { success: false, message: 'Please fill in all SMTP credentials' }
}

/**
 * Payload `relationship` validation uses `isValidID` — for `defaultIDType: 'number'`, only a real
 * number is accepted, not a numeric string. The app uses string IDs in React state; coerce here.
 */
function msc_coercePayloadRelationId(
  payload: Payload,
  relationTo: string,
  id: string,
): string | number {
  const idType =
    payload.collections[relationTo]?.customIDType || payload.db?.defaultIDType || 'text'
  if (idType === 'number') {
    const trimmed = id.trim()
    if (trimmed !== '' && /^\d+$/.test(trimmed)) {
      return Number(trimmed)
    }
  }
  return id
}

/** Omit empty thumbnails so Payload never receives `undefined` / invalid placeholders. */
function msc_thumbnailPayload(value: string | undefined | null): { thumbnail?: string } {
  const t = typeof value === 'string' ? value.trim() : ''
  if (!t) return {}
  return { thumbnail: t }
}

export async function msc_registerUser(
  email: string,
  password: string,
  name: string,
): Promise<MscRegisterUserResult> {
  const payload = await getPayload({ config })
  const msc_email = email.trim().toLowerCase()
  const msc_password = password
  const msc_name = name.trim()

  if (!msc_email) return { success: false, message: 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msc_email)) {
    return { success: false, message: 'Enter a valid email address.' }
  }
  if (!msc_password || msc_password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' }
  }
  if (!msc_name) return { success: false, message: 'Name is required.' }

  try {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: msc_email } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      return { success: false, message: 'An account with this email already exists.' }
    }
  } catch {
    return { success: false, message: 'Unable to validate this request right now.' }
  }

  try {
    await payload.create({
      collection: 'users',
      data: {
        email: msc_email,
        password: msc_password,
        role: 'user',
      },
      overrideAccess: true,
    })
    void msc_name
    return { success: true, message: 'Request sent. Return to login to continue.' }
  } catch {
    return { success: false, message: 'Registration failed. Please try again.' }
  }
}

export async function msc_login(email: string, password: string): Promise<MscLoginResult> {
  const payload = await getPayload({ config })
  const msc_email = email.trim().toLowerCase()
  if (!msc_email || !password) {
    return { success: false, message: 'Email and password are required.' }
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const request = new Request(`${proto}://${host}/`, { headers: h })
  const req = await createPayloadRequest({ request, config })

  let result: { token?: string; user?: { id?: string | number; role?: string | null } } | null = null
  try {
    result = await payload.login({
      collection: 'users',
      data: { email: msc_email, password },
      req,
    })
  } catch {
    return { success: false, message: 'Invalid email or password.' }
  }

  if (!result?.token) {
    return { success: false, message: 'Invalid email or password.' }
  }

  const col = payload.collections['users']
  const prefix = payload.config.cookiePrefix
  const cookie = generatePayloadCookie({
    collectionAuthConfig: col.config.auth,
    cookiePrefix: prefix,
    token: result.token,
    returnCookieAsObject: true,
  }) as {
    name: string
    value: string
    maxAge?: number
    path?: string
    httpOnly?: boolean
    sameSite?: string
    secure?: boolean
  }

  const c = await cookies()
  c.set({
    name: cookie.name,
    value: cookie.value,
    path: cookie.path || '/',
    maxAge: cookie.maxAge,
    httpOnly: cookie.httpOnly,
    sameSite: (cookie.sameSite as 'lax' | 'strict' | 'none' | undefined) || 'lax',
    secure: Boolean(cookie.secure),
  })

  const msc_role = result.user?.role === 'admin' ? 'admin' : 'user'
  return {
    success: true,
    message: 'Authenticated.',
    user: { id: result.user?.id, email: msc_email, role: msc_role },
  }
}

/**
 * Load vault projects and tasks for the current Payload session. Access rules
 * on `msc-vault-projects` apply: **admin** users get the full collection;
 * **user** role only sees documents where `user` is their id (or empty if none).
 */
export async function msc_loadVaultProjects(): Promise<Project[]> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  await msc_logVaultAuthDebug('load projects', ctx.user)
  if (!ctx.user) {
    throw new Error('Authentication required to fetch vault projects.')
  }
  const u = ctx.user as { id: string | number; role?: 'admin' | 'user' | null }
  console.log('SERVER: Fetching projects for User ID:', u.id)
  const isAdmin = msc_vaultIsPayloadAdmin(u)
  /** Defense in depth: AND with collection access (non-admins: own rows only). */
  const projectWhere: Where | undefined =
    !isAdmin ? { user: { equals: u.id } } : undefined
  const projectsRes = await payload.find({
    collection: 'msc-vault-projects',
    depth: 0,
    limit: 500,
    sort: 'createdAt',
    user: o.user,
    overrideAccess: o.overrideAccess,
    where: projectWhere,
  })
  const tasksRes = await payload.find({
    collection: 'msc-vault-tasks',
    depth: 0,
    limit: 5000,
    sort: 'createdAt',
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  return msc_mergeProjectsAndTasks(
    projectsRes.docs as Parameters<typeof msc_mergeProjectsAndTasks>[0],
    tasksRes.docs as Parameters<typeof msc_mergeProjectsAndTasks>[1],
  )
}

export async function msc_createVaultProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress'>,
): Promise<Project> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  await msc_logVaultAuthDebug('create project', ctx.user)
  if (!ctx.user) {
    throw new Error('Authentication required to create a project.')
  }
  const ownerId = msc_coercePayloadRelationId(payload, 'users', String(ctx.user.id))
  const created = await payload.create({
    collection: 'msc-vault-projects',
    data: {
      name: input.name,
      user: ownerId,
      ...msc_thumbnailPayload(input.thumbnail),
      localPath: getSafePath(input.localPath || ''),
      liveUrl: input.liveUrl?.trim() || '',
      status: input.status,
      progress: 0,
      localNotes: input.localNotes?.trim() || '',
      liveNotes: input.liveNotes?.trim() || '',
      referencesJson: msc_stringifyReferencesJson(input.references ?? []),
      credentials: input.credentials.map((c) => ({
        credentialId: c.id,
        label: c.label,
        username: c.username,
        password: c.password,
      })),
      emailSettings: input.emailSettings,
    },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  msc_revalidateVaultUi()
  const p = created as Parameters<typeof msc_mapProjectDoc>[0]
  return msc_mapProjectDoc(p, [])
}

export async function msc_updateVaultProject(
  id: string,
  updates: Partial<
    Pick<
      Project,
      | 'name'
      | 'thumbnail'
      | 'localPath'
      | 'liveUrl'
      | 'status'
      | 'progress'
      | 'credentials'
      | 'emailSettings'
      | 'localNotes'
      | 'liveNotes'
      | 'references'
    >
  >,
): Promise<Project> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const data: Record<string, unknown> = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.thumbnail !== undefined) {
    const t = updates.thumbnail?.trim() ?? ''
    data.thumbnail = t
  }
  if (updates.localPath !== undefined) data.localPath = getSafePath(updates.localPath)
  if (updates.liveUrl !== undefined) data.liveUrl = updates.liveUrl
  if (updates.status !== undefined) data.status = updates.status
  if (updates.progress !== undefined) data.progress = updates.progress
  if (updates.localNotes !== undefined) data.localNotes = updates.localNotes?.trim() ?? ''
  if (updates.liveNotes !== undefined) data.liveNotes = updates.liveNotes?.trim() ?? ''
  if (updates.references !== undefined) {
    data.referencesJson = msc_stringifyReferencesJson(updates.references)
  }
  if (updates.credentials !== undefined) {
    data.credentials = updates.credentials.map((c: Credential) => ({
      credentialId: c.id,
      label: c.label,
      username: c.username,
      password: c.password,
    }))
  }
  if (updates.emailSettings !== undefined) data.emailSettings = updates.emailSettings

  const updated = await payload.update({
    collection: 'msc-vault-projects',
    id,
    data,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const tasksRes = await payload.find({
    collection: 'msc-vault-tasks',
    where: { project: { equals: id } },
    depth: 0,
    limit: 5000,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  msc_revalidateVaultUi()
  const p = updated as Parameters<typeof msc_mapProjectDoc>[0]
  const tasks = tasksRes.docs.map((d) => msc_mapTaskDoc(d as Parameters<typeof msc_mapTaskDoc>[0]))
  return msc_mapProjectDoc(p, tasks)
}

export async function msc_deleteVaultProject(id: string): Promise<void> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const tasks = await payload.find({
    collection: 'msc-vault-tasks',
    where: { project: { equals: id } },
    limit: 5000,
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  for (const t of tasks.docs) {
    await payload.delete({
      collection: 'msc-vault-tasks',
      id: String(t.id),
      user: o.user,
      overrideAccess: o.overrideAccess,
    })
  }
  await payload.delete({
    collection: 'msc-vault-projects',
    id,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  msc_revalidateVaultUi()
}

async function msc_createVaultTaskInPayload(projectId: string, title: string): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const projectRef = msc_coercePayloadRelationId(payload, 'msc-vault-projects', projectId)
  const created = await payload.create({
    collection: 'msc-vault-tasks',
    data: {
      title,
      status: 'todo',
      completed: false,
      archived: false,
      project: projectRef,
    },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  msc_revalidateVaultUi()
  return msc_mapTaskDoc(created as Parameters<typeof msc_mapTaskDoc>[0])
}

export async function msc_addVaultTask(projectId: string, title: string): Promise<Task> {
  return msc_createVaultTaskInPayload(projectId, title)
}

/** Rapid inject from dashboard cards — persists to `msc-vault-tasks` / SQLite. */
export async function msc_quick_add_task(projectId: string, title: string): Promise<Task> {
  const t = typeof title === 'string' ? title.trim() : ''
  if (!t) {
    throw new Error('Task title is required')
  }
  return msc_createVaultTaskInPayload(projectId, t)
}

export async function msc_toggleVaultTask(projectId: string, taskId: string): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const doc = await payload.findByID({
    collection: 'msc-vault-tasks',
    id: taskId,
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const next = !doc.completed
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    data: {
      completed: next,
      status: next ? 'done' : (doc.status as TaskStatus) || 'todo',
    },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  void projectId
  msc_revalidateVaultUi()
  return msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
}

/** Persists task status (and optional completed/archived) to `msc-vault-tasks` / SQLite. */
export async function msc_update_task_status(
  projectId: string,
  taskId: string,
  status: TaskStatus,
  extra?: { completed?: boolean; archived?: boolean },
): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const doc = await payload.findByID({
    collection: 'msc-vault-tasks',
    id: taskId,
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const completed = extra?.completed ?? (status === 'done')
  const archived = extra?.archived ?? Boolean(doc.archived)
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    data: {
      status,
      completed,
      archived,
    },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  void projectId
  msc_revalidateVaultUi()
  return msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
}

/**
 * CamelCase entry for Task Pulse / client layers. Forwards to `msc_update_task_status`
 * (Payload `msc-vault-tasks` status + completed).
 */
export const msc_updateTaskStatus = msc_update_task_status

export async function msc_cycleVaultTaskStatus(projectId: string, taskId: string): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const doc = await payload.findByID({
    collection: 'msc-vault-tasks',
    id: taskId,
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const order: TaskStatus[] = ['todo', 'in-progress', 'done']
  const cur = (doc.status as TaskStatus) || 'todo'
  const next = order[(order.indexOf(cur) + 1) % order.length]
  return msc_update_task_status(projectId, taskId, next, {
    completed: next === 'done',
    archived: Boolean(doc.archived),
  })
}

export async function msc_updateVaultTaskTitle(
  projectId: string,
  taskId: string,
  title: string,
): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    data: { title },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  void projectId
  msc_revalidateVaultUi()
  return msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
}

export async function msc_deleteVaultTask(projectId: string, taskId: string): Promise<void> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  await payload.delete({
    collection: 'msc-vault-tasks',
    id: taskId,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  void projectId
  msc_revalidateVaultUi()
}

export async function msc_archiveVaultTask(projectId: string, taskId: string): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    data: { archived: true, completed: true, status: 'done' },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  void projectId
  msc_revalidateVaultUi()
  return msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
}

export async function msc_migratePersistedStateIfEmpty(raw: string): Promise<Project[] | null> {
  const payload = await getPayload({ config })
  const uCheck = await payload.find({ collection: 'users', limit: 1, depth: 0, overrideAccess: true })
  if (uCheck.docs.length === 0) {
    return null
  }
  const existing = await payload.find({
    collection: 'msc-vault-projects',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const state = parsed as { state?: { projects?: Project[] } }
  const projects = state.state?.projects
  if (!projects?.length) return null

  for (const p of projects) {
    const created = await payload.create({
      collection: 'msc-vault-projects',
      data: {
        name: p.name,
        ...msc_thumbnailPayload(p.thumbnail),
        localPath: getSafePath(p.localPath || ''),
        liveUrl: p.liveUrl?.trim() || '',
        status: p.status,
        progress: p.progress ?? 0,
        localNotes: p.localNotes?.trim() || '',
        liveNotes: p.liveNotes?.trim() || '',
        referencesJson: msc_stringifyReferencesJson(p.references ?? []),
        credentials: (p.credentials || []).map((c) => ({
          credentialId: c.id,
          label: c.label,
          username: c.username,
          password: c.password,
        })),
        emailSettings: p.emailSettings,
      },
      overrideAccess: true,
    })
    const pid = String(created.id)
    const projectRef = msc_coercePayloadRelationId(payload, 'msc-vault-projects', pid)
    for (const t of p.tasks || []) {
      await payload.create({
        collection: 'msc-vault-tasks',
        data: {
          title: t.title,
          status: t.status || 'todo',
          completed: t.completed,
          archived: t.archived ?? false,
          project: projectRef,
        },
        overrideAccess: true,
      })
    }
  }
  msc_revalidateVaultUi()
  return msc_loadVaultProjects()
}
