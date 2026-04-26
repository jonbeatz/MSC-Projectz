'use server'

import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'
import type {
  MscCreateUserAdminInput,
  MscResetUserAdminPasswordInput,
  MscUpdateUserAdminRoleInput,
  MscUserAdminActionResult,
  MscUserAdminListResult,
  MscUserAdminRole,
  MscUserAdminRow,
} from '@/types/user-admin'

export type MscPayloadUserRow = MscUserAdminRow

type MscPayloadUserDoc = {
  id: string | number
  email?: string
  role?: MscUserAdminRole | null
  username?: string | null
  createdAt?: string
}

type MscPayloadAdminContext = Awaited<ReturnType<typeof msc_getVaultLocalApiContext>> & {
  user: { id: string | number }
}

async function msc_requirePayloadAdminForSettings(): Promise<
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

function msc_normalizePayloadRole(role: unknown): MscUserAdminRole {
  return role === 'admin' ? 'admin' : 'user'
}

function msc_validatePayloadRole(role: unknown): role is MscUserAdminRole {
  return role === 'admin' || role === 'user'
}

/**
 * List Payload `users` (for Settings) — admin only, requires active Payload session.
 */
export async function msc_listPayloadUsersForSettings(): Promise<MscUserAdminListResult> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin

  const res = await admin.ctx.payload.find({
    collection: 'users',
    limit: 200,
    depth: 0,
    sort: 'email',
    overrideAccess: true,
  })
  const users: MscPayloadUserRow[] = res.docs.map((d) => {
    const r = d as MscPayloadUserDoc
    return {
      id: r.id,
      email: r.email || '',
      role: msc_normalizePayloadRole(r.role),
      username: r.username ?? null,
      createdAt: r.createdAt,
      isCurrentUser: String(r.id) === String(admin.currentUserId),
    }
  })
  return { ok: true, users }
}

/**
 * Create a Payload user (admin). Password is hashed by Payload; role stored on the document.
 */
export async function msc_createPayloadUserAsAdmin(
  input: MscCreateUserAdminInput,
): Promise<{ ok: true; id: string | number } | { ok: false; error: string }> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin

  const email = input.email.trim().toLowerCase()
  const username = input.username?.trim()
  if (!email || !input.password || input.password.length < 6) {
    return { ok: false, error: 'Valid email and password (6+ chars) are required' }
  }
  if (!msc_validatePayloadRole(input.role)) {
    return { ok: false, error: 'Valid role is required' }
  }
  try {
    const created = await admin.ctx.payload.create({
      collection: 'users',
      data: {
        email,
        password: input.password,
        role: input.role,
        ...(username ? { username } : {}),
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
): Promise<MscUserAdminActionResult> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin

  if (String(admin.currentUserId) === String(id)) {
    return { ok: false, error: 'You cannot delete your own account' }
  }
  try {
    await admin.ctx.payload.delete({ collection: 'users', id: String(id), overrideAccess: true })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to delete user'
    return { ok: false, error: msg }
  }
}

export async function msc_updatePayloadUserRoleAsAdmin(
  input: MscUpdateUserAdminRoleInput,
): Promise<MscUserAdminActionResult> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin

  if (!msc_validatePayloadRole(input.role)) {
    return { ok: false, error: 'Valid role is required' }
  }

  try {
    await admin.ctx.payload.update({
      collection: 'users',
      id: String(input.id),
      data: { role: input.role },
      overrideAccess: true,
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to update user role'
    return { ok: false, error: msg }
  }
}

export async function msc_resetPayloadUserPasswordAsAdmin(
  input: MscResetUserAdminPasswordInput,
): Promise<MscUserAdminActionResult> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin

  if (!input.password || input.password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' }
  }

  try {
    await admin.ctx.payload.update({
      collection: 'users',
      id: String(input.id),
      data: { password: input.password },
      overrideAccess: true,
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to reset password'
    return { ok: false, error: msg }
  }
}
