'use server'

import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'

export type MscPayloadUserRow = {
  id: string | number
  email: string
  role: 'admin' | 'user' | null
  createdAt?: string
}

/**
 * List Payload `users` (for Settings) — admin only, requires active Payload session.
 */
export async function msc_listPayloadUsersForSettings(): Promise<
  { ok: true; users: MscPayloadUserRow[] } | { ok: false; error: string }
> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    return { ok: false, error: 'Sign in (Payload) required' }
  }
  const { payload } = ctx
  const full = await payload.findByID({
    collection: 'users',
    id: (ctx.user as { id: string | number }).id,
    depth: 0,
    overrideAccess: true,
  })
  if (!full || !msc_vaultIsPayloadAdmin(full as { role?: 'admin' | 'user' })) {
    return { ok: false, error: 'Admin session required' }
  }
  const res = await payload.find({
    collection: 'users',
    limit: 200,
    depth: 0,
    sort: 'email',
    overrideAccess: true,
  })
  const users: MscPayloadUserRow[] = res.docs.map((d) => {
    const r = d as { id: string | number; email?: string; role?: 'admin' | 'user' | null; createdAt?: string }
    return {
      id: r.id,
      email: r.email || '',
      role: r.role ?? 'user',
      createdAt: r.createdAt,
    }
  })
  return { ok: true, users }
}

/**
 * Create a Payload user (admin). Password is hashed by Payload; role stored on the document.
 */
export async function msc_createPayloadUserAsAdmin(input: {
  email: string
  password: string
  role: 'admin' | 'user'
}): Promise<{ ok: true; id: string | number } | { ok: false; error: string }> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    return { ok: false, error: 'Sign in (Payload) required' }
  }
  const { payload } = ctx
  const full = await payload.findByID({
    collection: 'users',
    id: (ctx.user as { id: string | number }).id,
    depth: 0,
    overrideAccess: true,
  })
  if (!full || !msc_vaultIsPayloadAdmin(full as { role?: 'admin' | 'user' })) {
    return { ok: false, error: 'Admin session required' }
  }
  const email = input.email.trim().toLowerCase()
  if (!email || !input.password || input.password.length < 6) {
    return { ok: false, error: 'Valid email and password (6+ chars) are required' }
  }
  try {
    const created = await payload.create({
      collection: 'users',
      data: {
        email,
        password: input.password,
        role: input.role,
      },
      overrideAccess: true,
    })
    return { ok: true, id: created.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to create user'
    return { ok: false, error: msg }
  }
}

export async function msc_deletePayloadUserAsAdmin(
  id: string | number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    return { ok: false, error: 'Sign in (Payload) required' }
  }
  const { payload } = ctx
  const full = await payload.findByID({
    collection: 'users',
    id: (ctx.user as { id: string | number }).id,
    depth: 0,
    overrideAccess: true,
  })
  if (!full || !msc_vaultIsPayloadAdmin(full as { role?: 'admin' | 'user' })) {
    return { ok: false, error: 'Admin session required' }
  }
  if (String((ctx.user as { id: unknown }).id) === String(id)) {
    return { ok: false, error: 'You cannot delete your own account' }
  }
  try {
    await payload.delete({ collection: 'users', id: String(id), overrideAccess: true })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to delete user'
    return { ok: false, error: msg }
  }
}
