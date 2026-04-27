'use server'

import type { Where } from 'payload'
import { msc_requirePayloadAdminForSettings } from '@/lib/msc_vault_admin_guard'

type MscAuditFilters = {
  action?: string
  actorId?: string
}

export type MscAuditLogDoc = {
  id: string | number
  action: string
  createdAt?: string
  actor?: { id: string | number; email?: string; username?: string | null } | null
  target?: { id: string | number; email?: string; username?: string | null } | null
  details?: Record<string, unknown> | null
}

export async function msc_getAuditLogs(
  page: number,
  filters: MscAuditFilters = {},
): Promise<{ logs: MscAuditLogDoc[]; totalPages: number }> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) {
    return { logs: [], totalPages: 0 }
  }

  const currentPage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)
  const limit = 20
  const where: Where = {}
  const and: Where[] = []

  const action = (filters.action || '').trim()
  const actorId = (filters.actorId || '').trim()
  if (action) and.push({ action: { equals: action } })
  if (actorId) and.push({ actor: { equals: actorId } })
  if (and.length > 0) where.and = and

  const result = await admin.ctx.payload.find({
    collection: 'msc-audit-logs',
    where,
    sort: '-createdAt',
    limit,
    page: currentPage,
    depth: 1,
    overrideAccess: true,
  })

  return {
    logs: result.docs as MscAuditLogDoc[],
    totalPages: result.totalPages || 1,
  }
}
