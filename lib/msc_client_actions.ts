'use server'

import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import { msc_getVaultLocalApiContext, msc_vaultLocalApiOptions } from '@/lib/msc_vault_auth_context'
import {
  MSC_DEFAULT_ONBOARDING_CHECKLIST,
  msc_isChecklistItem,
  msc_mergeOnboardingChecklist,
  type OnboardingChecklist,
} from '@/lib/msc_client_domain'
import { msc_hasAdminAccess } from '@/lib/msc_roles'
import type {
  MscClientDetail,
  MscClientListRow,
  MscClientPulseStats,
} from '@/lib/msc_client_types'
import { msc_publicPayloadError } from '@/lib/msc_public_error'
import { msc_coercePayloadRelationId } from '@/lib/msc_vault_payload_ids'
import type { MscUserWithRole } from '@/lib/msc_vault_payload_access'

function msc_docUpdatedAt(doc: { updatedAt?: unknown }): string {
  const u = doc.updatedAt
  if (u instanceof Date) return u.toISOString()
  if (typeof u === 'string') return u
  return ''
}

function msc_relIds(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  const out: string[] = []
  for (const x of val) {
    if (x == null) continue
    if (typeof x === 'object' && 'id' in x) {
      out.push(String((x as { id: string | number }).id))
    } else {
      out.push(String(x))
    }
  }
  return out
}

function msc_parseDueDate(due: unknown): Date | null {
  if (due === undefined || due === null) return null
  if (due instanceof Date) return Number.isNaN(due.getTime()) ? null : due
  if (typeof due === 'string') {
    const d = new Date(due)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function msc_startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function msc_addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const MSC_CLIENT_ALLOWED_STATUSES = [
  'lead',
  'active',
  'onboarding',
  'completed',
  'archived',
] as const

type MscPrimaryContactInput = {
  name: string
  email: string
  /** Empty string clears phone in Payload (`null`). */
  phone?: string | null
}

export async function msc_createClient(data: {
  name: string
  primaryContact: MscPrimaryContactInput
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }

    const name = typeof data.name === 'string' ? data.name.trim() : ''
    if (name === '') {
      return { ok: false, error: 'Client name is required.' }
    }

    const pcName =
      typeof data.primaryContact?.name === 'string' ? data.primaryContact.name.trim() : ''
    const pcEmail =
      typeof data.primaryContact?.email === 'string' ? data.primaryContact.email.trim() : ''
    if (pcName === '') {
      return { ok: false, error: 'Primary contact name is required.' }
    }
    if (!pcEmail.includes('@')) {
      return { ok: false, error: 'A valid primary contact email is required.' }
    }
    const rawPhone = data.primaryContact?.phone
    const phone =
      rawPhone !== undefined && rawPhone !== null && String(rawPhone).trim() !== ''
        ? String(rawPhone).trim()
        : null

    const created = await ctx.payload.create({
      collection: 'msc-clients',
      data: {
        name,
        status: 'lead',
        primaryContact: {
          name: pcName,
          email: pcEmail,
          phone,
        },
        clientVault: {
          onboardingChecklist: MSC_DEFAULT_ONBOARDING_CHECKLIST,
        },
      },
      overrideAccess: true,
    })

    revalidatePath('/clients')
    return { ok: true, id: String(created.id) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create client.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}

export async function msc_archiveClient(
  clientId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }

    const rid = msc_coercePayloadRelationId(ctx.payload, 'msc-clients', String(clientId))
    await ctx.payload.update({
      collection: 'msc-clients',
      id: rid,
      data: { status: 'archived' },
      overrideAccess: true,
    })

    revalidatePath('/clients')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to archive client.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}

export async function msc_updateClientProfile(
  clientId: string,
  data: {
    name: string
    status: string
    primaryContact: MscPrimaryContactInput
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }

    const name = typeof data.name === 'string' ? data.name.trim() : ''
    if (name === '') {
      return { ok: false, error: 'Client name is required.' }
    }

    const status = typeof data.status === 'string' ? data.status.trim() : ''
    if (!MSC_CLIENT_ALLOWED_STATUSES.includes(status as (typeof MSC_CLIENT_ALLOWED_STATUSES)[number])) {
      return { ok: false, error: 'Invalid client status.' }
    }

    const pcName =
      typeof data.primaryContact?.name === 'string' ? data.primaryContact.name.trim() : ''
    const pcEmail =
      typeof data.primaryContact?.email === 'string' ? data.primaryContact.email.trim() : ''
    if (pcName === '') {
      return { ok: false, error: 'Primary contact name is required.' }
    }
    if (!pcEmail.includes('@')) {
      return { ok: false, error: 'A valid primary contact email is required.' }
    }

    const rawPhone = data.primaryContact?.phone
    let phoneNorm: string | null = null
    if (rawPhone !== undefined && rawPhone !== null && String(rawPhone).trim() !== '') {
      phoneNorm = String(rawPhone).trim()
    }

    const { payload } = ctx
    const rid = msc_coercePayloadRelationId(payload, 'msc-clients', String(clientId))
    const existing = await payload.findByID({
      collection: 'msc-clients',
      id: rid,
      depth: 0,
      overrideAccess: true,
    })
    if (!existing) {
      return { ok: false, error: 'Client not found.' }
    }

    const prevPc = (existing as { primaryContact?: Record<string, unknown> | null }).primaryContact
    const primaryContactOut: Record<string, unknown> = {
      name: pcName,
      email: pcEmail,
      phone: phoneNorm,
    }
    const prevUser = prevPc && typeof prevPc === 'object' && prevPc !== null ? prevPc.user : undefined
    if (prevUser !== undefined && prevUser !== null) {
      primaryContactOut.user = prevUser
    }

    await payload.update({
      collection: 'msc-clients',
      id: rid,
      data: {
        name,
        status,
        primaryContact: primaryContactOut,
      },
      overrideAccess: true,
    })

    revalidatePath('/clients')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update client profile.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}

async function msc_resolveClientProjectIds(args: {
  payload: Payload
  clientRowId: string | number
  projectsField: unknown
}): Promise<string[]> {
  const { payload, clientRowId, projectsField } = args
  const fromRel = msc_relIds(projectsField)
  const cid = msc_coercePayloadRelationId(payload, 'msc-clients', String(clientRowId))
  const linked = await payload.find({
    collection: 'msc-vault-projects',
    where: { client: { equals: cid } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })
  const fromGlue = linked.docs.map((d) => String(d.id))
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of [...fromRel, ...fromGlue]) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export async function msc_listClients(): Promise<
  { ok: true; clients: MscClientListRow[] } | { ok: false; error: string }
> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }
    const o = msc_vaultLocalApiOptions(ctx)
    const res = await ctx.payload.find({
      collection: 'msc-clients',
      limit: 500,
      sort: '-updatedAt',
      depth: 0,
      user: o.user,
      overrideAccess: o.overrideAccess,
    })
    const clients: MscClientListRow[] = res.docs.map((d) => {
      const row = d as { id?: string | number; name?: string; status?: string; updatedAt?: unknown }
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        status: String(row.status ?? ''),
        updatedAt: msc_docUpdatedAt(row),
      }
    })
    return { ok: true, clients }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load clients.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}

export async function msc_getClient(clientId: string): Promise<
  { ok: true; client: MscClientDetail } | { ok: false; error: string }
> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }
    const o = msc_vaultLocalApiOptions(ctx)
    const rid = msc_coercePayloadRelationId(ctx.payload, 'msc-clients', String(clientId))
    const doc = await ctx.payload.findByID({
      collection: 'msc-clients',
      id: rid,
      depth: 1,
      user: o.user,
      overrideAccess: o.overrideAccess,
    })
    if (!doc) {
      return { ok: false, error: 'Client not found.' }
    }
    const row = doc as {
      id?: string | number
      name?: string
      status?: string
      updatedAt?: unknown
      primaryContact?: { name?: string; email?: string; phone?: string | null }
      projects?: unknown
      clientVault?: unknown
    }
    const pc = row.primaryContact ?? {}
    const detail: MscClientDetail = {
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      status: String(row.status ?? ''),
      updatedAt: msc_docUpdatedAt(row),
      primaryContact: {
        name: String(pc.name ?? ''),
        email: String(pc.email ?? ''),
        phone: pc.phone ?? null,
      },
      projectIds: msc_relIds(row.projects),
      onboardingChecklist: msc_mergeOnboardingChecklist(row.clientVault),
    }
    return { ok: true, client: detail }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load client.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}

export async function msc_getClientPulse(clientId: string): Promise<
  { ok: true; pulse: MscClientPulseStats } | { ok: false; error: string }
> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }
    const { payload } = ctx
    const rid = msc_coercePayloadRelationId(payload, 'msc-clients', String(clientId))
    const clientDoc = await payload.findByID({
      collection: 'msc-clients',
      id: rid,
      depth: 1,
      overrideAccess: true,
    })
    if (!clientDoc) {
      return { ok: false, error: 'Client not found.' }
    }

    const projectIds = await msc_resolveClientProjectIds({
      payload,
      clientRowId: rid,
      projectsField: (clientDoc as { projects?: unknown }).projects,
    })

    const totalProjects = projectIds.length
    if (totalProjects === 0) {
      return {
        ok: true,
        pulse: {
          totalProjects: 0,
          totalTasks: 0,
          overdueTasks: 0,
          upcomingTasks: 0,
          activeSnippets: 0,
        },
      }
    }

    const projectRefs = projectIds.map((id) => msc_coercePayloadRelationId(payload, 'msc-vault-projects', id))

    const tasksRes = await payload.find({
      collection: 'msc-vault-tasks',
      where: {
        and: [
          { project: { in: projectRefs } },
          { completed: { equals: false } },
          { archived: { equals: false } },
          { status: { not_equals: 'done' } },
        ],
      },
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })

    const snippetsRes = await payload.find({
      collection: 'msc-vault-snippets',
      where: {
        and: [{ project: { in: projectRefs } }, { status: { not_equals: 'archived' } }],
      },
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })

    const today = msc_startOfLocalDay(new Date())
    const todayYmd = today.toISOString().slice(0, 10)
    const weekEnd = msc_addDays(today, 7)
    const weekEndYmd = weekEnd.toISOString().slice(0, 10)

    let overdueTasks = 0
    let upcomingTasks = 0
    const docs = tasksRes.docs as Array<{ dueDate?: unknown }>

    for (const t of docs) {
      const dueYmd = msc_parseDueDate(t.dueDate)?.toISOString().slice(0, 10) ?? null
      if (!dueYmd) continue
      if (dueYmd < todayYmd) overdueTasks++
      else if (dueYmd >= todayYmd && dueYmd <= weekEndYmd) upcomingTasks++
    }

    const pulse: MscClientPulseStats = {
      totalProjects,
      totalTasks: docs.length,
      overdueTasks,
      upcomingTasks,
      activeSnippets: snippetsRes.docs.length,
    }

    return { ok: true, pulse }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load pulse metrics.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}

export async function msc_updateClientChecklist(
  clientId: string,
  checklist: OnboardingChecklist,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await msc_getVaultLocalApiContext()
    const u = ctx.user as MscUserWithRole | null | undefined
    if (!u || !msc_hasAdminAccess(u.role)) {
      return { ok: false, error: 'Not authorized.' }
    }
    if (!Array.isArray(checklist) || !checklist.every(msc_isChecklistItem)) {
      return { ok: false, error: 'Invalid checklist payload.' }
    }

    const { payload } = ctx
    const rid = msc_coercePayloadRelationId(payload, 'msc-clients', String(clientId))
    const existing = await payload.findByID({
      collection: 'msc-clients',
      id: rid,
      depth: 0,
      overrideAccess: true,
    })
    if (!existing) {
      return { ok: false, error: 'Client not found.' }
    }

    const rawVault = (existing as unknown as { clientVault?: unknown }).clientVault
    const prevVault =
      rawVault && typeof rawVault === 'object' && rawVault !== null
        ? { ...(rawVault as Record<string, unknown>) }
        : {}

    await payload.update({
      collection: 'msc-clients',
      id: rid,
      data: {
        clientVault: {
          ...prevVault,
          onboardingChecklist: checklist,
        },
      },
      overrideAccess: true,
    })

    revalidatePath('/clients')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save checklist.'
    return { ok: false, error: msc_publicPayloadError(msg) }
  }
}
