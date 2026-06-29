'use server'

import { msc_generateCompliantRandomPassword } from '@/lib/msc_invite_password'
import { msc_validateNewPassword } from '@/lib/msc_password_policy'
import { msc_generateVerificationToken, msc_sendVerificationEmail } from '@/lib/msc_auth_verification'
import { msc_logAdminAction } from '@/lib/msc_vault_audit'
import { msc_requirePayloadAdminForSettings } from '@/lib/msc_vault_admin_guard'
import type {
  MscCreateUserAdminInput,
  MscInviteUserAdminInput,
  MscResetUserAdminPasswordInput,
  MscUpdateUserAdminRoleInput,
  MscUserAdminActionResult,
  MscUserAdminListResult,
  MscUserAdminRole,
  MscUserAdminRow,
} from '@/types/user-admin'

export type MscPayloadUserRow = MscUserAdminRow

const MSC_AUDIT_USER_CREATE = 'USER_CREATE'
const MSC_AUDIT_USER_DELETE = 'USER_DELETE'
const MSC_AUDIT_USER_ROLE_UPDATE = 'USER_ROLE_UPDATE'
const MSC_AUDIT_PASSWORD_RESET = 'PASSWORD_RESET'

type MscPayloadUserDoc = {
  id: string | number
  email?: string
  role?: MscUserAdminRole | null
  username?: string | null
  createdAt?: string
  isVerified?: boolean
}

function msc_normalizePayloadRole(role: unknown): MscUserAdminRole {
  if (role === 'master-admin') return 'master-admin'
  if (role === 'admin') return 'admin'
  return 'user'
}

function msc_validatePayloadRole(role: unknown): role is MscUserAdminRole {
  return role === 'master-admin' || role === 'admin' || role === 'user'
}

function msc_mapPayloadUserDocToRow(doc: MscPayloadUserDoc, currentUserId: string | number): MscPayloadUserRow {
  return {
    id: doc.id,
    email: doc.email || '',
    role: msc_normalizePayloadRole(doc.role),
    username: doc.username ?? null,
    createdAt: doc.createdAt,
    isCurrentUser: String(doc.id) === String(currentUserId),
    isVerified: Boolean(doc.isVerified),
  }
}

/**
 * List Payload `users` (for Settings) — admin session required.
 * Master Admin: full directory (sorted by email). Other admins: current user only (user cage).
 */
export async function msc_listPayloadUsersForSettings(): Promise<MscUserAdminListResult> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin

  const { isMasterAdmin, currentUserId, ctx } = admin

  try {
    if (isMasterAdmin) {
      const res = await ctx.payload.find({
        collection: 'users',
        limit: 200,
        depth: 0,
        sort: 'email',
        overrideAccess: true,
      })
      const users = res.docs.map((d) => msc_mapPayloadUserDocToRow(d as MscPayloadUserDoc, currentUserId))
      return { ok: true, users, isMasterAdmin: true }
    }

    const doc = await ctx.payload.findByID({
      collection: 'users',
      id: currentUserId,
      depth: 0,
      overrideAccess: true,
    })
    if (!doc) {
      return { ok: false, error: 'Unable to load your user profile.' }
    }
    const users = [msc_mapPayloadUserDocToRow(doc as MscPayloadUserDoc, currentUserId)]
    return { ok: true, users, isMasterAdmin: false }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to list users'
    return { ok: false, error: msg }
  }
}

/**
 * Create a Payload user (admin). Password is hashed by Payload; role stored on the document.
 */
export async function msc_createPayloadUserAsAdmin(
  input: MscCreateUserAdminInput,
): Promise<{ ok: true; id: string | number } | { ok: false; error: string }> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin
  if (!admin.isMasterAdmin) {
    return { ok: false, error: 'Unauthorized: only a Master Admin can create users.' }
  }

  const email = input.email.trim().toLowerCase()
  const username = input.username?.trim()
  if (!email || !input.password) {
    return { ok: false, error: 'Valid email and password are required' }
  }
  const msc_pwCreate = msc_validateNewPassword(input.password)
  if (!msc_pwCreate.ok) {
    return { ok: false, error: msc_pwCreate.message }
  }
  if (!msc_validatePayloadRole(input.role)) {
    return { ok: false, error: 'Valid role is required' }
  }
  if (input.role === 'master-admin' && !admin.isMasterAdmin) {
    return { ok: false, error: 'Only a Master Admin can create another Master Admin.' }
  }
  try {
    const created = await admin.ctx.payload.create({
      collection: 'users',
      data: {
        email,
        password: input.password,
        role: input.role,
        /** Master-created with known password: skip email verification gate. */
        isVerified: true,
        ...(username ? { username } : {}),
      },
      overrideAccess: true,
    })
    void msc_logAdminAction(admin.ctx.payload, {
      actorId: admin.currentUserId,
      targetId: created.id,
      action: MSC_AUDIT_USER_CREATE,
      details: {
        email,
        role: input.role,
        username: username || null,
        passwordMode: true,
      },
    })
    return { ok: true, id: created.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to create user'
    return { ok: false, error: msg }
  }
}

/**
 * Master Admin: create an unverified user, email them verify link + temporary sign-in password.
 * After they click the link, they sign in at `/auth` and should change password in Profile.
 */
export async function msc_invitePayloadUserAsMaster(
  input: MscInviteUserAdminInput,
): Promise<{ ok: true; id: string | number } | { ok: false; error: string }> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin
  if (!admin.isMasterAdmin) {
    return { ok: false, error: 'Unauthorized: only a Master Admin can send email invites.' }
  }

  const email = input.email.trim().toLowerCase()
  const username = input.username?.trim()
  if (!email) {
    return { ok: false, error: 'Valid email is required' }
  }
  if (!msc_validatePayloadRole(input.role)) {
    return { ok: false, error: 'Valid role is required' }
  }

  try {
    const existing = await admin.ctx.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      return { ok: false, error: 'An account with this email already exists.' }
    }
  } catch {
    return { ok: false, error: 'Unable to validate this request right now.' }
  }

  const tempPassword = msc_generateCompliantRandomPassword()
  const verification = msc_generateVerificationToken()

  try {
    const created = await admin.ctx.payload.create({
      collection: 'users',
      data: {
        email,
        password: tempPassword,
        role: input.role,
        isVerified: false,
        verificationToken: verification.tokenHash,
        verificationTokenExpires: verification.expiresAt.toISOString(),
        lastVerificationSentAt: new Date().toISOString(),
        ...(username ? { username } : {}),
      },
      overrideAccess: true,
    })
    void msc_logAdminAction(admin.ctx.payload, {
      actorId: admin.currentUserId,
      targetId: created.id,
      action: MSC_AUDIT_USER_CREATE,
      details: {
        email,
        role: input.role,
        username: username || null,
        invited: true,
      },
    })
    void msc_sendVerificationEmail({
      email,
      name: username || null,
      token: verification.rawToken,
      inviteTemporaryPassword: tempPassword,
    }).catch((err) => console.error('[msc] Invite verification email failed:', err))
    return { ok: true, id: (created as { id: string | number }).id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to invite user'
    return { ok: false, error: msg }
  }
}

export async function msc_deletePayloadUserAsAdmin(id: string | number): Promise<MscUserAdminActionResult> {
  const admin = await msc_requirePayloadAdminForSettings()
  if (!admin.ok) return admin
  if (!admin.isMasterAdmin) {
    return { ok: false, error: 'Unauthorized: only a Master Admin can delete users.' }
  }

  if (String(admin.currentUserId) === String(id)) {
    return { ok: false, error: 'You cannot delete your own account' }
  }
  try {
    const before = (await admin.ctx.payload.findByID({
      collection: 'users',
      id: String(id),
      depth: 0,
      overrideAccess: true,
    })) as MscPayloadUserDoc
    if (before?.role === 'master-admin' && !admin.isMasterAdmin) {
      return { ok: false, error: 'Only a Master Admin can delete a Master Admin account.' }
    }
    await admin.ctx.payload.delete({ collection: 'users', id: String(id), overrideAccess: true })
    void msc_logAdminAction(admin.ctx.payload, {
      actorId: admin.currentUserId,
      targetId: id,
      action: MSC_AUDIT_USER_DELETE,
      details: {
        targetEmail: before?.email || null,
        targetRole: before?.role || null,
      },
    })
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
  if (!admin.isMasterAdmin) {
    return { ok: false, error: 'Unauthorized: only a Master Admin can change user roles.' }
  }

  if (!msc_validatePayloadRole(input.role)) {
    return { ok: false, error: 'Valid role is required' }
  }
  if (input.role === 'master-admin' && !admin.isMasterAdmin) {
    return { ok: false, error: 'Only a Master Admin can assign the Master Admin role.' }
  }

  try {
    const before = (await admin.ctx.payload.findByID({
      collection: 'users',
      id: String(input.id),
      depth: 0,
      overrideAccess: true,
    })) as MscPayloadUserDoc
    if (before?.role === 'master-admin' && !admin.isMasterAdmin) {
      return { ok: false, error: 'Only a Master Admin can change another Master Admin role.' }
    }
    await admin.ctx.payload.update({
      collection: 'users',
      id: String(input.id),
      data: { role: input.role },
      overrideAccess: true,
    })
    void msc_logAdminAction(admin.ctx.payload, {
      actorId: admin.currentUserId,
      targetId: input.id,
      action: MSC_AUDIT_USER_ROLE_UPDATE,
      details: {
        oldRole: before?.role || null,
        newRole: input.role,
        targetEmail: before?.email || null,
      },
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
  if (!admin.isMasterAdmin && String(input.id) !== String(admin.currentUserId)) {
    return { ok: false, error: 'Unauthorized: you can only reset your own password.' }
  }

  const msc_pwReset = msc_validateNewPassword(input.password || '')
  if (!msc_pwReset.ok) {
    return { ok: false, error: msc_pwReset.message }
  }

  try {
    const before = (await admin.ctx.payload.findByID({
      collection: 'users',
      id: String(input.id),
      depth: 0,
      overrideAccess: true,
    })) as MscPayloadUserDoc
    await admin.ctx.payload.update({
      collection: 'users',
      id: String(input.id),
      data: { password: input.password },
      overrideAccess: true,
    })
    void msc_logAdminAction(admin.ctx.payload, {
      actorId: admin.currentUserId,
      targetId: input.id,
      action: MSC_AUDIT_PASSWORD_RESET,
      details: {
        targetEmail: before?.email || null,
      },
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unable to reset password'
    return { ok: false, error: msg }
  }
}
