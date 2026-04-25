import { headers } from 'next/headers'
import { getPayload } from 'payload'
import type { Document, Payload, TypedUser } from 'payload'

import config from '@payload-config'

export type MscVaultLocalApiContext = {
  payload: Payload
  user: null | TypedUser
  overrideAccess: boolean
  userForOptions: null | Document
}

export function msc_vaultLocalApiOptions(ctx: MscVaultLocalApiContext): {
  user: Document | undefined
  overrideAccess: boolean
} {
  return {
    user: ctx.userForOptions ?? undefined,
    overrideAccess: ctx.overrideAccess,
  }
}

/**
 * Resolves the current Payload session (httpOnly cookie) for server actions.
 * Multi-tenant safety: never bypass access for runtime vault actions.
 */
export async function msc_getVaultLocalApiContext(): Promise<MscVaultLocalApiContext> {
  const payload = await getPayload({ config })
  const h = await headers()
  const { user } = await payload.auth({ headers: h })
  const overrideAccess = false
  return {
    payload,
    user,
    overrideAccess,
    userForOptions: user ? (user as Document) : null,
  }
}
