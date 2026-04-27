'use server'

type AuditLogInput = {
  actorId: string | number
  targetId?: string | number | null
  action: string
  details?: Record<string, unknown>
}

/**
 * Best-effort admin audit logging.
 * Never throws; callers should not depend on this for control-flow.
 */
export async function msc_logAdminAction(payload: any, input: AuditLogInput): Promise<void> {
  try {
    await payload.create({
      collection: 'msc-audit-logs',
      data: {
        actor: input.actorId,
        target: input.targetId ?? undefined,
        action: input.action,
        details: input.details ?? {},
      },
      overrideAccess: true,
    })
  } catch (err) {
    console.error('[msc] audit log write failed:', err)
  }
}
