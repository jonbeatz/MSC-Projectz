'use server'

import { revalidatePath } from 'next/cache'

import { msc_canViewProject, msc_canWriteVaultProjectAsOwner } from '@/lib/msc_access_control'
import { msc_getVaultLocalApiContext, msc_vaultLocalApiOptions } from '@/lib/msc_vault_auth_context'
import { msc_coercePayloadRelationId } from '@/lib/msc_vault_payload_ids'
import type { MscUserWithRole } from '@/lib/msc_vault_payload_access'

export type MscVaultSnippetUi = {
  id: string
  title: string
  content: string
  language: string
  category: string
  visibility: 'personal' | 'project'
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
  authorId: string | number
}

export type MscVaultSnippetProjectFlags = {
  /** User may create snippets (project Reader: owner or member). */
  canCreate: boolean
  /** User may transition drafts to published (project owner or admin only). */
  canPublish: boolean
}

export type MscGetProjectSnippetsResult =
  | { ok: true; snippets: MscVaultSnippetUi[]; flags: MscVaultSnippetProjectFlags }
  | { ok: false; error: string }

export type MscSnippetMutationResult =
  | { ok: true; id?: string | number }
  | { ok: false; error: string }

function msc_mapSnippetDoc(doc: Record<string, unknown>): MscVaultSnippetUi {
  const author = doc.author
  const authorId =
    author && typeof author === 'object' && author !== null && 'id' in author
      ? (author as { id: string | number }).id
      : (author as string | number)
  const updated = doc.updatedAt
  const updatedAt =
    typeof updated === 'string'
      ? updated
      : updated instanceof Date
        ? updated.toISOString()
        : String(updated ?? '')

  return {
    id: String(doc.id),
    title: String(doc.title ?? ''),
    content: String(doc.content ?? ''),
    language: String(doc.language ?? 'typescript'),
    category: String(doc.category ?? 'general'),
    visibility: (doc.visibility as MscVaultSnippetUi['visibility']) || 'personal',
    status: (doc.status as MscVaultSnippetUi['status']) || 'draft',
    updatedAt,
    authorId,
  }
}

async function msc_assertSnippetBelongsToProject(
  ctx: Awaited<ReturnType<typeof msc_getVaultLocalApiContext>>,
  snippetId: string,
  projectId: string,
): Promise<void> {
  const { payload } = ctx
  const sid = msc_coercePayloadRelationId(payload, 'msc-vault-snippets', snippetId)
  const doc = (await payload.findByID({
    collection: 'msc-vault-snippets',
    id: sid,
    depth: 0,
    overrideAccess: true,
  })) as { project?: string | number | { id: string | number } | null } | null
  if (!doc) {
    throw new Error('Snippet not found.')
  }
  const p = doc.project
  const pid = p != null && typeof p === 'object' && 'id' in p ? (p as { id: string | number }).id : p
  const expected = msc_coercePayloadRelationId(payload, 'msc-vault-projects', projectId)
  if (String(pid) !== String(expected)) {
    throw new Error('Snippet does not belong to this project.')
  }
}

/**
 * Lists snippets for a single vault project (PAC + collection read rules apply).
 */
export async function msc_getProjectSnippets(projectId: string): Promise<MscGetProjectSnippetsResult> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u) {
      return { ok: false, error: 'Authentication required.' }
    }
    const { payload } = ctx
    const o = msc_vaultLocalApiOptions(ctx)

    const canView = await msc_canViewProject({ payload, user: u, projectId })
    if (!canView) {
      return { ok: false, error: 'Not authorized to view this project.' }
    }

    const pid = msc_coercePayloadRelationId(payload, 'msc-vault-projects', projectId)

    const canPublish = await msc_canWriteVaultProjectAsOwner({ payload, user: u, projectId })
    const flags: MscVaultSnippetProjectFlags = {
      canCreate: canView,
      canPublish,
    }

    const res = await payload.find({
      collection: 'msc-vault-snippets',
      where: { project: { equals: pid } },
      depth: 0,
      limit: 500,
      sort: '-updatedAt',
      user: o.user,
      overrideAccess: o.overrideAccess,
    })

    const snippets = res.docs.map((d) => msc_mapSnippetDoc(d as Record<string, unknown>))
    return { ok: true, snippets, flags }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load snippets.'
    return { ok: false, error: msg }
  }
}

export type MscCreateProjectSnippetInput = {
  projectId: string
  title: string
  content: string
  language: string
  category: string
  visibility: 'personal' | 'project'
  status?: 'draft' | 'published' | 'archived'
}

export async function msc_createProjectSnippet(input: MscCreateProjectSnippetInput): Promise<MscSnippetMutationResult> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u) {
      return { ok: false, error: 'Authentication required.' }
    }
    const { payload } = ctx
    const o = msc_vaultLocalApiOptions(ctx)

    const canView = await msc_canViewProject({ payload, user: u, projectId: input.projectId })
    if (!canView) {
      return { ok: false, error: 'Not authorized to create snippets for this project.' }
    }

    const projectRel = msc_coercePayloadRelationId(payload, 'msc-vault-projects', input.projectId)
    const status = input.status ?? 'draft'
    if (status === 'published') {
      const canPublish = await msc_canWriteVaultProjectAsOwner({ payload, user: u, projectId: input.projectId })
      if (!canPublish) {
        return { ok: false, error: 'Only project owners or admins can publish snippets.' }
      }
    }

    const created = await payload.create({
      collection: 'msc-vault-snippets',
      data: {
        project: projectRel,
        title: input.title.trim(),
        content: input.content,
        language: input.language,
        category: input.category,
        visibility: input.visibility,
        status,
      },
      user: o.user,
      overrideAccess: o.overrideAccess,
    })

    revalidatePath('/dashboard')
    return { ok: true, id: created.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create snippet.'
    return { ok: false, error: msg }
  }
}

export type MscUpdateProjectSnippetInput = {
  projectId: string
  snippetId: string
  title?: string
  content?: string
  language?: string
  category?: string
  visibility?: 'personal' | 'project'
  status?: 'draft' | 'published' | 'archived'
}

export async function msc_updateProjectSnippet(input: MscUpdateProjectSnippetInput): Promise<MscSnippetMutationResult> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u) {
      return { ok: false, error: 'Authentication required.' }
    }
    const { payload } = ctx
    const o = msc_vaultLocalApiOptions(ctx)

    await msc_assertSnippetBelongsToProject(ctx, input.snippetId, input.projectId)

    const canView = await msc_canViewProject({ payload, user: u, projectId: input.projectId })
    if (!canView) {
      return { ok: false, error: 'Not authorized.' }
    }

    const sid = msc_coercePayloadRelationId(payload, 'msc-vault-snippets', input.snippetId)

    const patch: Record<string, unknown> = {}
    if (input.title !== undefined) patch.title = input.title.trim()
    if (input.content !== undefined) patch.content = input.content
    if (input.language !== undefined) patch.language = input.language
    if (input.category !== undefined) patch.category = input.category
    if (input.visibility !== undefined) patch.visibility = input.visibility
    if (input.status !== undefined) patch.status = input.status

    await payload.update({
      collection: 'msc-vault-snippets',
      id: sid,
      data: patch,
      user: o.user,
      overrideAccess: o.overrideAccess,
    })

    revalidatePath('/dashboard')
    return { ok: true, id: sid }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update snippet.'
    return { ok: false, error: msg }
  }
}

/**
 * Publish a draft (owner/admin path); collection hook also enforces publish transition.
 */
export async function msc_publishProjectSnippet(projectId: string, snippetId: string): Promise<MscSnippetMutationResult> {
  return msc_updateProjectSnippet({
    projectId,
    snippetId,
    status: 'published',
    visibility: 'project',
  })
}
