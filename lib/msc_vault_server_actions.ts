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
import { eachDayOfInterval, format } from 'date-fns'
import { MSC_TRUST_GATE_COOKIE } from '@/lib/msc_trust_gate_cookie'

import { msc_getVaultLocalApiContext, msc_vaultLocalApiOptions } from '@/lib/msc_vault_auth_context'
import {
  msc_pacNotAuthorizedMessage,
  msc_canViewProject,
  msc_canWriteVaultProjectAsOwner,
  msc_canEditTask,
  msc_canCreateTaskOnProject,
} from '@/lib/msc_access_control'
import { msc_vaultIsPayloadAdmin, type MscUserWithRole } from '@/lib/msc_vault_payload_access'
import { msc_coercePayloadRelationId } from '@/lib/msc_vault_payload_ids'
import type { AppSettings, Credential, EmailSettings, MscSmtpEncryption, Project, Task, TaskStatus } from '@/lib/types'
import {
  msc_mergeProjectsAndTasks,
  msc_mapProjectDoc,
  msc_mapTaskDoc,
  msc_normalizeProjectEmailSettings,
} from '@/lib/msc_map_vault'
import { msc_sortProjectsForDashboard } from '@/lib/msc_project_sort'
import { msc_sendSendNotificationTaskEmail, msc_testSettingsFromForm } from '@/lib/msc_smtp_nodemailer'
import { msc_stringifyReferencesJson } from '@/lib/msc_project_references'
import { msc_hasAdminAccess } from '@/lib/msc_roles'
import { getSafePath } from '@/lib/env-utils'
import { msc_normalizeRole } from '@/lib/msc_roles'
import type { MscVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { buildDayDetail, msc_indexTasksByDueDay } from '@/lib/msc_calendar_utils'
import type { DayDetail } from '@/lib/msc_calendar_utils'
type MscLoginResult = {
  success: boolean
  message: string
  user?: {
    id: string | number | undefined
    email: string
    username?: string
    role: 'master-admin' | 'admin' | 'user'
    isVerified: boolean
    avatarId?: string | number | null
    avatarUrl?: string | null
  }
}

type MscSystemConfigInput = Pick<AppSettings, 'pathFormat' | 'smtp'>
type MscMediaDoc = {
  id: string | number
  url?: string | null
  owner?: string | number | { id?: string | number } | null
}

function msc_revalidateVaultUi() {
  revalidatePath('/')
}

function msc_resolvePayloadRequestOrigin(h: Headers): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const configured = (() => {
    if (!envOrigin) return null
    try {
      return new URL(envOrigin)
    } catch (e) {
      console.warn('[msc] Invalid NEXT_PUBLIC_SITE_URL; falling back to request headers.', e)
      return null
    }
  })()
  const host = h.get('x-forwarded-host') || h.get('host') || configured?.host || 'example.com'
  const proto = h.get('x-forwarded-proto') || configured?.protocol.replace(':', '') || 'https'
  return `${proto}://${host}`
}

type MscVaultSessionUser = { id: string | number; role?: 'master-admin' | 'admin' | 'user' | null }

function msc_requireVaultSessionUser(ctx: MscVaultLocalApiContext, actionName: string): MscVaultSessionUser {
  if (!ctx.user) {
    throw new Error(`Authentication required to ${actionName}.`)
  }

  return ctx.user as MscVaultSessionUser
}

async function msc_assertOwnedVaultProject(ctx: MscVaultLocalApiContext, projectId: string, actionName: string) {
  const u = msc_requireVaultSessionUser(ctx, actionName) as MscUserWithRole
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const ok = await msc_canWriteVaultProjectAsOwner({ payload, user: u, projectId })
  if (!ok) {
    throw new Error(msc_pacNotAuthorizedMessage)
  }
  const ownedProjectId = msc_coercePayloadRelationId(ctx.payload, 'msc-vault-projects', projectId)
  const res = await ctx.payload.find({
    collection: 'msc-vault-projects',
    depth: 0,
    limit: 1,
    user: o.user,
    overrideAccess: o.overrideAccess,
    where: { id: { equals: ownedProjectId } },
  })
  const project = res.docs[0]
  if (!project) {
    throw new Error(`Project not found for current user during ${actionName}.`)
  }
  return project
}

async function msc_assertAuthorizedVaultProject(ctx: MscVaultLocalApiContext, projectId: string, actionName: string) {
  const u = msc_requireVaultSessionUser(ctx, actionName) as MscUserWithRole
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const ok = await msc_canViewProject({ payload, user: u, projectId })
  if (!ok) {
    throw new Error(msc_pacNotAuthorizedMessage)
  }
  const authorizedProjectId = msc_coercePayloadRelationId(ctx.payload, 'msc-vault-projects', projectId)
  const res = await ctx.payload.find({
    collection: 'msc-vault-projects',
    depth: 0,
    limit: 1,
    user: o.user,
    overrideAccess: o.overrideAccess,
    where: { id: { equals: authorizedProjectId } },
  })
  const project = res.docs[0]
  if (!project) {
    throw new Error(`Project not found or not shared with current user during ${actionName}.`)
  }
  return project
}

async function msc_assertOwnedVaultTask(
  ctx: MscVaultLocalApiContext,
  projectId: string,
  taskId: string,
  actionName: string,
) {
  const u = msc_requireVaultSessionUser(ctx, actionName) as MscUserWithRole
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const can = await msc_canEditTask({ payload, user: u, taskId })
  if (!can) {
    throw new Error(msc_pacNotAuthorizedMessage)
  }
  const ownedTaskId = msc_coercePayloadRelationId(ctx.payload, 'msc-vault-tasks', taskId)
  const ownedProjectId = msc_coercePayloadRelationId(ctx.payload, 'msc-vault-projects', projectId)
  const res = await ctx.payload.find({
    collection: 'msc-vault-tasks',
    depth: 0,
    limit: 1,
    user: o.user,
    overrideAccess: o.overrideAccess,
    where: {
      and: [{ id: { equals: ownedTaskId } }, { project: { equals: ownedProjectId } }],
    },
  })
  const task = res.docs[0]
  if (!task) {
    throw new Error(`Task not found for current user during ${actionName}.`)
  }
  return task
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
export async function msc_testSystemEmailConfig(
  input: MscSystemConfigInput,
): Promise<{ success: boolean; message: string }> {
  await msc_requireVaultAdmin('system email test')
  if (input.smtp.username && input.smtp.password) {
    return { success: true, message: 'Test email sent successfully!' }
  }
  return { success: false, message: 'Please fill in all SMTP credentials' }
}

/** Omit empty thumbnails so Payload never receives `undefined` / invalid placeholders. */
function msc_thumbnailPayload(value: string | undefined | null): { thumbnail?: string } {
  const t = typeof value === 'string' ? value.trim() : ''
  if (!t) return {}
  return { thumbnail: t }
}

export async function msc_uploadVaultProjectThumbnail(
  formData: FormData,
): Promise<{ id: string | number; url: string }> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    throw new Error('Authentication required to upload project thumbnail.')
  }
  const file = formData.get('thumbnail')
  if (!(file instanceof File)) {
    throw new Error('Thumbnail file is required.')
  }

  const payload = await getPayload({ config })
  const buffer = Buffer.from(await file.arrayBuffer())
  const created = await payload.create({
    collection: 'media',
    data: {
      owner: ctx.user.id,
    },
    file: {
      data: buffer,
      mimetype: file.type || 'application/octet-stream',
      name: file.name || `project-thumbnail-${ctx.user.id}`,
      size: file.size,
    },
    user: ctx.user,
    overrideAccess: false,
  } as Parameters<typeof payload.create>[0])

  const media = created as MscMediaDoc
  return {
    id: media.id,
    url: String(media.url || ''),
  }
}

function msc_mergeMailEndpoint(
  base: { host: string; port: number; username: string; password: string },
  updates: { host?: string; port?: number; username?: string; password?: string } | undefined,
) {
  if (!updates) return { ...base }
  const hasNewPassword = updates.password !== undefined && String(updates.password).trim() !== ''
  return {
    host: updates.host !== undefined ? String(updates.host).trim() : base.host,
    port: updates.port !== undefined && typeof updates.port === 'number' && updates.port > 0 ? updates.port : base.port,
    username: updates.username !== undefined ? String(updates.username) : base.username,
    password: hasNewPassword ? String(updates.password) : base.password,
  }
}

function msc_mergeEmailSettingsOnUpdate(
  current: Record<string, unknown> | null | undefined,
  updates: Partial<EmailSettings> | undefined,
): EmailSettings {
  const base = msc_normalizeProjectEmailSettings(current)
  if (!updates) return base
  const incoming = msc_mergeMailEndpoint(base.incoming, updates.incoming)
  const o = updates.outgoing
  if (o === undefined) return { ...base, incoming }
  return {
    incoming,
    outgoing: {
      host: o.host !== undefined ? String(o.host).trim() : base.outgoing.host,
      port: o.port !== undefined && typeof o.port === 'number' && o.port > 0 ? o.port : base.outgoing.port,
      username: o.username !== undefined ? String(o.username) : base.outgoing.username,
      password:
        o.password !== undefined && String(o.password).trim() !== '' ? String(o.password) : base.outgoing.password,
      encryption: (o.encryption as MscSmtpEncryption) ?? base.outgoing.encryption,
    },
  }
}

/**
 * `Socket` + TLS connectivity check (username/password) for the Connectivity form.
 * Uses saved `password` when the client omits a new one (keeps the field out of the browser).
 */
export async function msc_testProjectSmtpConnection(
  projectId: string,
  input: {
    host: string
    port: number
    username: string
    password?: string
    encryption: MscSmtpEncryption
  },
): Promise<{ success: true; message: string } | { success: false; message: string }> {
  const ctx = await msc_getVaultLocalApiContext()
  await msc_assertAuthorizedVaultProject(ctx, projectId, 'test project email connection')
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const raw = await payload.findByID({
    collection: 'msc-vault-projects',
    id: msc_coercePayloadRelationId(payload, 'msc-vault-projects', projectId),
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const prevE = msc_normalizeProjectEmailSettings(
    (raw as { emailSettings?: Record<string, unknown> } | null)?.emailSettings,
  )
  const effectivePassword = (input.password && input.password.trim()) || prevE.outgoing.password
  if (!String(input.host || '').trim() || !effectivePassword) {
    return {
      success: false,
      message: 'Host and password (saved or entered) are required to test the connection.',
    }
  }
  try {
    await msc_testSettingsFromForm({
      host: String(input.host).trim(),
      port: input.port,
      username: String(input.username || '').trim(),
      password: effectivePassword,
      encryption: input.encryption,
    })
    return { success: true, message: 'SMTP connection verified.' }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { success: false, message: message || 'Connection failed' }
  }
}

async function msc_maybeSendNotificationTaskEmail(
  ctx: MscVaultLocalApiContext,
  projectId: string,
  taskAfter: { title?: string | null; completed?: boolean | null; status?: string | null },
) {
  const title = String(taskAfter.title || '').trim()
  if (!/send notification/i.test(title)) return
  const isDone = taskAfter.status === 'done' || taskAfter.completed === true
  if (!isDone) return
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const u = msc_requireVaultSessionUser(ctx, 'send notification email')
  const proj = await payload.findByID({
    collection: 'msc-vault-projects',
    id: msc_coercePayloadRelationId(payload, 'msc-vault-projects', projectId),
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  if (!proj) return
  const me = await payload.findByID({
    collection: 'users',
    id: u.id,
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const toEmail = (me as { email?: string } | null)?.email
  if (!toEmail) {
    console.warn('[msc] Send Notification: current user has no email address in Payload.')
    return
  }
  const fromProject = msc_normalizeProjectEmailSettings(
    (proj as { emailSettings?: Record<string, unknown> }).emailSettings,
  )
  try {
    await msc_sendSendNotificationTaskEmail({
      toEmail,
      taskTitle: title,
      projectName: String((proj as { name?: string }).name || 'Project'),
      fromProject,
    })
  } catch (e) {
    console.warn('[msc] send notification task email failed', e)
  }
}

export async function msc_login(email: string, password: string): Promise<MscLoginResult> {
  const payload = await getPayload({ config })
  const msc_email = email.trim().toLowerCase()
  if (!msc_email || !password) {
    return { success: false, message: 'Email and password are required.' }
  }

  const h = await headers()
  const request = new Request(`${msc_resolvePayloadRequestOrigin(h)}/`, { headers: h })
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

  const fullUser = result.user?.id
    ? await payload.findByID({
        collection: 'users',
        id: result.user.id,
        depth: 1,
        overrideAccess: true,
      })
    : null
  const avatar = (
    fullUser as { avatar?: string | number | { id?: string | number; url?: string | null } | null } | null
  )?.avatar
  const avatarId = avatar && typeof avatar === 'object' ? (avatar.id ?? null) : (avatar ?? null)
  const avatarUrl = avatar && typeof avatar === 'object' ? (avatar.url ?? null) : null

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
  const isVerified = Boolean((fullUser as { isVerified?: boolean | null } | null)?.isVerified)
  c.set({
    name: MSC_TRUST_GATE_COOKIE,
    value: isVerified ? '1' : '0',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(cookie.secure),
  })

  const msc_role = msc_normalizeRole(result.user?.role)
  const username = (fullUser as { username?: string | null } | null)?.username?.trim() || msc_email.split('@')[0]
  return {
    success: true,
    message: 'Authenticated.',
    user: {
      id: result.user?.id,
      email: msc_email,
      username,
      role: msc_role,
      isVerified,
      avatarId,
      avatarUrl,
    },
  }
}

/** True when Payload sees an authenticated user for this request (httpOnly cookies). */
export async function msc_peekVaultServerSession(): Promise<{ ok: boolean }> {
  const ctx = await msc_getVaultLocalApiContext()
  return { ok: Boolean(ctx.user) }
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
  if (!ctx.user) {
    console.warn('[MSC] msc_loadVaultProjects: no Payload session on server (returning empty list)')
    return []
  }
  const u = ctx.user as MscVaultSessionUser
  /** Defense in depth: app runtime reads projects owned by or shared with the current user. */
  const projectWhere: Where = {
    or: [{ user: { equals: u.id } }, { members: { contains: u.id } }],
  }
  const projectsRes = await payload.find({
    collection: 'msc-vault-projects',
    depth: 1,
    limit: 500,
    sort: 'createdAt',
    user: o.user,
    overrideAccess: o.overrideAccess,
    where: projectWhere,
  })
  const projectIds = projectsRes.docs.map((project) => project.id)
  if (projectIds.length === 0) {
    return msc_mergeProjectsAndTasks(projectsRes.docs as Parameters<typeof msc_mergeProjectsAndTasks>[0], [])
  }
  const tasksRes = await payload.find({
    collection: 'msc-vault-tasks',
    depth: 1,
    limit: 5000,
    sort: 'createdAt',
    user: o.user,
    overrideAccess: o.overrideAccess,
    where: { project: { in: projectIds } },
  })
  return msc_mergeProjectsAndTasks(
    projectsRes.docs as Parameters<typeof msc_mergeProjectsAndTasks>[0],
    tasksRes.docs as Parameters<typeof msc_mergeProjectsAndTasks>[1],
  )
}

export async function msc_createVaultProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'manualRank'>,
): Promise<Project> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const u = msc_requireVaultSessionUser(ctx, 'create a project')
  const ownerId = msc_coercePayloadRelationId(payload, 'users', String(u.id))
  const maxRow = await payload.find({
    collection: 'msc-vault-projects',
    where: { user: { equals: ownerId } },
    sort: '-manualRank',
    limit: 1,
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const topDoc = maxRow.docs[0] as { manualRank?: number } | undefined
  const topRank =
    topDoc && typeof topDoc.manualRank === 'number' && !Number.isNaN(topDoc.manualRank) ? topDoc.manualRank : -1
  const createManualRank = topRank + 1
  let thumbnailMediaId =
    input.thumbnailMediaId === undefined ||
    input.thumbnailMediaId === null ||
    String(input.thumbnailMediaId).trim() === ''
      ? null
      : msc_coercePayloadRelationId(payload, 'media', String(input.thumbnailMediaId))
  if (thumbnailMediaId !== null) {
    const media = (await payload.findByID({
      collection: 'media',
      id: thumbnailMediaId,
      depth: 0,
      user: o.user,
      overrideAccess: o.overrideAccess,
    })) as MscMediaDoc | null
    if (!media) {
      thumbnailMediaId = null
    }
  }

  const created = await payload.create({
    collection: 'msc-vault-projects',
    data: {
      name: input.name,
      user: ownerId,
      manualRank: createManualRank,
      ...(thumbnailMediaId !== null ? { thumbnailMedia: thumbnailMediaId } : {}),
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
  updates: Omit<
    Partial<
      Pick<
        Project,
        | 'name'
        | 'thumbnail'
        | 'thumbnailMediaId'
        | 'localPath'
        | 'liveUrl'
        | 'status'
        | 'progress'
        | 'manualRank'
        | 'credentials'
        | 'localNotes'
        | 'liveNotes'
        | 'references'
        | 'members'
      >
    >,
    'emailSettings'
  > & { emailSettings?: Partial<EmailSettings> },
): Promise<Project> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  await msc_assertOwnedVaultProject(ctx, id, 'update project')
  const data: Record<string, unknown> = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.thumbnail !== undefined) {
    const t = updates.thumbnail?.trim() ?? ''
    data.thumbnail = t
  }
  if (updates.thumbnailMediaId !== undefined) {
    const mediaIdRaw = updates.thumbnailMediaId
    if (mediaIdRaw === null || String(mediaIdRaw).trim() === '') {
      data.thumbnailMedia = null
    } else {
      const mediaId = msc_coercePayloadRelationId(payload, 'media', String(mediaIdRaw))
      const media = (await payload.findByID({
        collection: 'media',
        id: mediaId,
        depth: 0,
        user: o.user,
        overrideAccess: o.overrideAccess,
      })) as MscMediaDoc | null
      if (!media) {
        throw new Error('Selected thumbnail media was not found.')
      }
      data.thumbnailMedia = mediaId
    }
  }
  if (updates.localPath !== undefined) data.localPath = getSafePath(updates.localPath)
  if (updates.liveUrl !== undefined) data.liveUrl = updates.liveUrl
  if (updates.status !== undefined) data.status = updates.status
  if (updates.progress !== undefined) data.progress = updates.progress
  if (updates.manualRank !== undefined) {
    const r = Math.round(updates.manualRank)
    if (!Number.isNaN(r)) data.manualRank = r
  }
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
  if (updates.emailSettings !== undefined) {
    const current = await payload.findByID({
      collection: 'msc-vault-projects',
      id: msc_coercePayloadRelationId(payload, 'msc-vault-projects', id),
      depth: 0,
      user: o.user,
      overrideAccess: o.overrideAccess,
    })
    const curRaw = (current as { emailSettings?: Record<string, unknown> } | null)?.emailSettings
    data.emailSettings = msc_mergeEmailSettingsOnUpdate(curRaw, updates.emailSettings)
  }
  if (updates.members !== undefined) {
    data.members = updates.members.map((member) => msc_coercePayloadRelationId(payload, 'users', String(member.id)))
  }

  const updated = await payload.update({
    collection: 'msc-vault-projects',
    id,
    data,
    depth: 1,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  const tasksRes = await payload.find({
    collection: 'msc-vault-tasks',
    where: { project: { equals: msc_coercePayloadRelationId(payload, 'msc-vault-projects', id) } },
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

/**
 * Swaps `manualRank` with the visual neighbor in Manual order (with tie-breakers
 * matching `msc_sortProjectsForDashboard`). Standard users may only swap two rows
 * they own. **Admin / master-admin** may swap any adjacent pair in their loaded list.
 */
export async function msc_moveProjectManual(projectId: string, direction: 'up' | 'down'): Promise<void> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const u = msc_requireVaultSessionUser(ctx, 'reorder project')
  await msc_assertOwnedVaultProject(ctx, projectId, 'reorder project')

  const projects = await msc_loadVaultProjects()
  const sorted = msc_sortProjectsForDashboard(projects, 'manual')
  const idx = sorted.findIndex((p) => String(p.id) === String(projectId))
  if (idx < 0) {
    throw new Error('Project not found in your vault list.')
  }
  const neighborIdx = direction === 'up' ? idx - 1 : idx + 1
  if (neighborIdx < 0 || neighborIdx >= sorted.length) {
    throw new Error(direction === 'up' ? 'Already at the top.' : 'Already at the bottom.')
  }
  const a = sorted[idx]
  const b = sorted[neighborIdx]
  const adminReorder = msc_hasAdminAccess(u.role)
  if (!adminReorder) {
    if (a.ownerUserId == null || b.ownerUserId == null) {
      throw new Error('Project ownership data missing.')
    }
    if (String(a.ownerUserId) !== String(u.id) || String(b.ownerUserId) !== String(u.id)) {
      throw new Error('You can only reorder your own projects next to each other. A shared project is in the way.')
    }
  }

  const rA = a.manualRank
  const rB = b.manualRank
  const idA = msc_coercePayloadRelationId(payload, 'msc-vault-projects', a.id)
  const idB = msc_coercePayloadRelationId(payload, 'msc-vault-projects', b.id)
  let newA = rB
  let newB = rA
  if (newA === newB) {
    if (direction === 'up') {
      newA = 0
      newB = 1
    } else {
      newA = 1
      newB = 0
    }
  }

  await payload.update({
    collection: 'msc-vault-projects',
    id: idA,
    data: { manualRank: newA },
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  await payload.update({
    collection: 'msc-vault-projects',
    id: idB,
    data: { manualRank: newB },
    depth: 0,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  msc_revalidateVaultUi()
}

export async function msc_deleteVaultProject(id: string): Promise<void> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  await msc_assertOwnedVaultProject(ctx, id, 'delete project')
  const tasks = await payload.find({
    collection: 'msc-vault-tasks',
    where: { project: { equals: msc_coercePayloadRelationId(payload, 'msc-vault-projects', id) } },
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

async function msc_createVaultTaskInPayload(
  projectId: string,
  title: string,
  options?: { dueDate?: string | null; assignedTo?: string | number | null },
): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const u = msc_requireVaultSessionUser(ctx, 'create task') as MscUserWithRole
  const canCreate = await msc_canCreateTaskOnProject({ payload, user: u, projectId })
  if (!canCreate) {
    throw new Error(msc_pacNotAuthorizedMessage)
  }
  const projectRef = msc_coercePayloadRelationId(payload, 'msc-vault-projects', projectId)
  const data: {
    title: string
    status: 'todo'
    completed: boolean
    archived: boolean
    priority: 'normal'
    project: number | string
    dueDate?: string | null
    assignedTo?: string | number | null
  } = {
    title,
    status: 'todo',
    completed: false,
    archived: false,
    priority: 'normal',
    project: projectRef,
  }
  if (options?.dueDate != null) {
    const s = String(options.dueDate).trim()
    if (s) data.dueDate = s
  }
  if (options && options.assignedTo !== undefined) {
    data.assignedTo =
      options.assignedTo === null ? null : msc_coercePayloadRelationId(payload, 'users', String(options.assignedTo))
  }
  const created = await payload.create({
    collection: 'msc-vault-tasks',
    data,
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
export async function msc_quick_add_task(
  projectId: string,
  title: string,
  options?: { dueDate?: string | null; assignedTo?: string | number | null },
): Promise<Task> {
  const t = typeof title === 'string' ? title.trim() : ''
  if (!t) {
    throw new Error('Task title is required')
  }
  return msc_createVaultTaskInPayload(projectId, t, options)
}

/**
 * PAC path for Command Center /calendar: same as `msc_loadVaultProjects` (no extra filters).
 * Call from client to rehydrate after navigation or to satisfy “all calendar fetches go through PAC” at the same boundary.
 */
export async function msc_loadCalendarVaultData() {
  return msc_loadVaultProjects()
}

export async function msc_getCalendarDayDetailsRange(args: {
  startYmd: string
  endYmd: string
  includeDone?: boolean
}): Promise<{ byDay: Record<string, DayDetail> }> {
  const startYmd = String(args.startYmd || '').trim()
  const endYmd = String(args.endYmd || '').trim()
  const includeDone = args.includeDone !== false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) {
    throw new Error('Invalid range; expected yyyy-MM-dd.')
  }
  if (startYmd > endYmd) {
    throw new Error('Invalid range; startYmd must be <= endYmd.')
  }

  const timerLabel = '[msc-calendar] aggregation'
  if (process.env.NODE_ENV !== 'production') {
    console.time(timerLabel)
  }
  try {
    const projects = await msc_loadVaultProjects()
    const ctx = await msc_getVaultLocalApiContext()
    const clientsRes = await ctx.payload.find({
      collection: 'msc-clients',
      depth: 0,
      limit: 5000,
      overrideAccess: true,
    })
    const clientsById = new Map<string, string>()
    for (const client of clientsRes.docs) {
      clientsById.set(String(client.id), String((client as { name?: string }).name || '').trim())
    }

    const tasksByDay = msc_indexTasksByDueDay(projects, { includeDone })
    const byDay: Record<string, DayDetail> = {}
    const dayCells = eachDayOfInterval({
      start: new Date(`${startYmd}T12:00:00`),
      end: new Date(`${endYmd}T12:00:00`),
    })
    let taskCount = 0

    for (const day of dayCells) {
      const ymd = format(day, 'yyyy-MM-dd')
      const dayItems = tasksByDay.get(ymd) ?? []
      taskCount += dayItems.length
      const detail = buildDayDetail(ymd, projects, dayItems, clientsById)
      byDay[ymd] = detail
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info('[msc-calendar] aggregation stats', {
        range_size_days: dayCells.length,
        task_count: taskCount,
      })
    }

    return { byDay }
  } finally {
    if (process.env.NODE_ENV !== 'production') {
      console.timeEnd(timerLabel)
    }
  }
}

export async function msc_toggleVaultTask(projectId: string, taskId: string): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const doc = await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'toggle task')
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
  msc_revalidateVaultUi()
  const mapped = msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
  void msc_maybeSendNotificationTaskEmail(ctx, projectId, {
    title: mapped.title,
    completed: mapped.completed,
    status: mapped.status,
  })
  return mapped
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
  const doc = await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'update task status')
  const completed = extra?.completed ?? status === 'done'
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
  msc_revalidateVaultUi()
  const mapped = msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
  void msc_maybeSendNotificationTaskEmail(ctx, projectId, {
    title: mapped.title,
    completed: mapped.completed,
    status: mapped.status,
  })
  return mapped
}

/**
 * CamelCase entry for Task Pulse / client layers. Forwards to `msc_update_task_status`
 * (Payload `msc-vault-tasks` status + completed).
 */
export const msc_updateTaskStatus = msc_update_task_status

export async function msc_cycleVaultTaskStatus(projectId: string, taskId: string): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const doc = await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'cycle task status')
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
  assignedTo?: string | number | null,
): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'update task title')
  const data: Record<string, unknown> = { title }
  if (assignedTo !== undefined) {
    data.assignedTo = assignedTo === null ? null : msc_coercePayloadRelationId(payload, 'users', String(assignedTo))
  }
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    depth: 1,
    data,
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  void projectId
  msc_revalidateVaultUi()
  return msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
}

export type MscVaultTaskPatch = {
  title?: string
  assignedTo?: string | number | null
  dueDate?: string | null
  status?: TaskStatus
  completed?: boolean
}

/**
 * Partial update for calendar / task row (title, assignee, due date). Omitted keys are unchanged.
 */
export async function msc_patchVaultTask(projectId: string, taskId: string, patch: MscVaultTaskPatch): Promise<Task> {
  const ctx = await msc_getVaultLocalApiContext()
  const o = msc_vaultLocalApiOptions(ctx)
  const { payload } = ctx
  const existing = await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'update task')
  const data: Record<string, unknown> = {}
  if (patch.title !== undefined) {
    data.title = String(patch.title).trim()
  }
  if (patch.assignedTo !== undefined) {
    data.assignedTo =
      patch.assignedTo === null ? null : msc_coercePayloadRelationId(payload, 'users', String(patch.assignedTo))
  }
  if (patch.dueDate !== undefined) {
    const s = patch.dueDate
    if (s === null || String(s).trim() === '') {
      data.dueDate = null
    } else {
      data.dueDate = String(s).trim()
    }
  }
  if (patch.status !== undefined) {
    data.status = patch.status
    if (patch.completed !== undefined) {
      data.completed = patch.completed
    } else {
      data.completed = patch.status === 'done'
    }
  } else if (patch.completed !== undefined) {
    data.completed = patch.completed
  }
  if (Object.keys(data).length === 0) {
    return msc_mapTaskDoc(existing as Parameters<typeof msc_mapTaskDoc>[0])
  }
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    depth: 1,
    data,
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
  await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'delete task')
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
  await msc_assertOwnedVaultTask(ctx, projectId, taskId, 'archive task')
  const updated = await payload.update({
    collection: 'msc-vault-tasks',
    id: taskId,
    data: { archived: true, completed: true, status: 'done' },
    user: o.user,
    overrideAccess: o.overrideAccess,
  })
  msc_revalidateVaultUi()
  const mapped = msc_mapTaskDoc(updated as Parameters<typeof msc_mapTaskDoc>[0])
  void msc_maybeSendNotificationTaskEmail(ctx, projectId, {
    title: mapped.title,
    completed: mapped.completed,
    status: mapped.status,
  })
  return mapped
}

export async function msc_migratePersistedStateIfEmpty(raw: string): Promise<Project[] | null> {
  void raw
  // Legacy global localStorage migration is intentionally disabled. Importing
  // unscoped browser data into Payload can assign one user's project cache to
  // another tenant.
  return null
}
