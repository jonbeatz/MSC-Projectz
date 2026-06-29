export type MscUserAdminRole = 'master-admin' | 'admin' | 'user'

export type MscUserAdminRow = {
  id: string | number
  email: string
  role: MscUserAdminRole
  username?: string | null
  avatar?: string | null
  avatarUrl?: string | null
  createdAt?: string
  isCurrentUser: boolean
  isVerified?: boolean
}

export type MscProjectMember = {
  id: string | number
  email?: string | null
  username?: string | null
  avatar?: string | null
  avatarUrl?: string | null
}

export type MscTaskAssignee = string | number | MscProjectMember | null

export type MscUserAdminActionResult = { ok: true } | { ok: false; error: string }

export type MscUserAdminListResult =
  { ok: true; users: MscUserAdminRow[]; isMasterAdmin: boolean } | { ok: false; error: string }

export type MscCreateUserAdminInput = {
  email: string
  password: string
  role: MscUserAdminRole
  username?: string
}

/** Master-admin invite: no password from admin; server generates one and emails verify link + temp password. */
export type MscInviteUserAdminInput = {
  email: string
  role: MscUserAdminRole
  username?: string
}

export type MscUpdateUserAdminRoleInput = {
  id: string | number
  role: MscUserAdminRole
}

export type MscResetUserAdminPasswordInput = {
  id: string | number
  password: string
}
