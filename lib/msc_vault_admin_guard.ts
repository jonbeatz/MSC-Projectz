'use server'

import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'

export type MscPayloadAdminContext = Awaited<ReturnType<typeof msc_getVaultLocalApiContext>> & {
  user: { id: string | number }
}

export async function msc_requirePayloadAdminForSettings(): Promise<
  { ok: true; ctx: MscPayloadAdminContext; currentUserId: string | number } | { ok: false; error: string }
> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    return { ok: false, error: 'Sign in (Payload) required' }
  }

  const currentUserId = (ctx.user as { id: string | number }).id
  const full = await ctx.payload.findByID({
    collection: 'users',
    id: currentUserId,
    depth: 0,
    overrideAccess: true,
  })

  if (!full || !msc_vaultIsPayloadAdmin(full as Parameters<typeof msc_vaultIsPayloadAdmin>[0])) {
    return { ok: false, error: 'Admin session required' }
  }

  return { ok: true, ctx: ctx as MscPayloadAdminContext, currentUserId }
}
