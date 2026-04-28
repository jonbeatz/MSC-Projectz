import 'server-only'

import type { Access, Payload, Where } from 'payload'

import { msc_coercePayloadRelationId } from '@/lib/msc_vault_payload_ids'
import { msc_hasAdminAccess } from '@/lib/msc_roles'
import {
  msc_vaultUserOwnsProjectForWrite,
  type MscUserWithRole,
} from '@/lib/msc_vault_payload_access'

type MscClientDocLike = {
  primaryContact?: {
    user?: string | number | { id: string | number } | null
  } | null
  projects?: (string | number | { id: string | number })[] | null
}

function msc_relId(val: unknown): string | number | null {
  if (val === undefined || val === null) return null
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return (val as { id: string | number }).id
  }
  return val as string | number
}

function msc_clientPrimaryContactUserId(doc: MscClientDocLike | null | undefined): string | number | null {
  const u = doc?.primaryContact?.user
  return msc_relId(u)
}

/**
 * Whether this Payload user may **read** one `msc-clients` row (portal + PAC).
 * Mirrors {@link msc_readMscClientsAccess}: admins; linked portal user in `primaryContact.user`;
 * vault **owner** of any linked project (`client.projects` or `msc-vault-projects.client`).
 */
export async function msc_clientUserMayRead(
  payload: Payload,
  user: MscUserWithRole | null | undefined,
  clientId: string | number,
): Promise<boolean> {
  if (!user) return false
  if (msc_hasAdminAccess(user.role)) return true

  const cid = msc_coercePayloadRelationId(payload, 'msc-clients', String(clientId))
  let doc: MscClientDocLike | null
  try {
    doc = (await payload.findByID({
      collection: 'msc-clients',
      id: cid,
      depth: 0,
      overrideAccess: true,
    })) as MscClientDocLike | null
  } catch {
    return false
  }
  if (!doc) return false

  const pcUser = msc_clientPrimaryContactUserId(doc)
  if (pcUser != null && String(pcUser) === String(user.id)) return true

  const linked = await payload.find({
    collection: 'msc-vault-projects',
    where: {
      and: [{ user: { equals: user.id } }, { client: { equals: cid } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (linked.docs.length > 0) return true

  const projRefs = doc.projects
  if (!Array.isArray(projRefs)) return false
  for (const pref of projRefs) {
    const pid = msc_relId(pref)
    if (pid == null) continue
    const project = (await payload.findByID({
      collection: 'msc-vault-projects',
      id: msc_coercePayloadRelationId(payload, 'msc-vault-projects', String(pid)),
      depth: 0,
      overrideAccess: true,
    })) as { user?: unknown; members?: unknown } | null
    if (project && msc_vaultUserOwnsProjectForWrite(user, project)) return true
  }

  return false
}

/**
 * Payload collection `read` access: admins see all; others see clients tied to their portal
 * user row, projects they **own** (`msc-vault-projects.client`), or clients listing owned projects.
 */
export const msc_readMscClientsAccess: Access = async ({ req }) => {
  const u = req.user as MscUserWithRole | undefined
  if (!u) return false
  if (msc_hasAdminAccess(u.role)) return true

  const pl = req.payload
  const owned = await pl.find({
    collection: 'msc-vault-projects',
    where: { user: { equals: u.id } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const ownedIds = owned.docs.map((d) => d.id)
  const clientIdsFromProjects: (string | number)[] = []
  for (const p of owned.docs) {
    const c = (p as { client?: unknown }).client
    const raw = msc_relId(c)
    if (raw != null) clientIdsFromProjects.push(raw)
  }
  const seenCid = new Set<string>()
  const uniqueClientIds: (string | number)[] = []
  for (const id of clientIdsFromProjects) {
    const k = String(id)
    if (seenCid.has(k)) continue
    seenCid.add(k)
    uniqueClientIds.push(id)
  }

  const ors: Where[] = [{ 'primaryContact.user': { equals: u.id } }]

  if (uniqueClientIds.length > 0) {
    ors.push({ id: { in: uniqueClientIds } })
  }
  for (const id of ownedIds) {
    ors.push({ projects: { contains: id } })
  }

  if (ors.length === 1) {
    return ors[0] as Where
  }
  return { or: ors } as Where
}

/** Admins / master-admins only (standard CMS for CRM). */
export const msc_mscClientsAdminWriteAccess: Access = ({ req: { user } }) => {
  const u = user as MscUserWithRole | undefined
  return Boolean(u && msc_hasAdminAccess(u.role))
}
