export type MscUserAdminRole = 'admin' | 'user'

export type MscUserAdminRow = {
  id: string | number
  email: string
  role: MscUserAdminRole
  username?: string | null
  avatar?: string | null
  avatarUrl?: string | null
  createdAt?: string
  isCurrentUser: boolean
}

export type MscProjectMember = {
  id: string | number
  email?: string | null
  username?: string | null
  avatar?: string | null
  avatarUrl?: string | null
}

export type MscTaskAssignee = string | number | MscProjectMember | null

export type MscUserAdminActionResult =
  | { ok: true }
  | { ok: false; error: string }

export type MscUserAdminListResult =
  | { ok: true; users: MscUserAdminRow[] }
  | { ok: false; error: string }

export type MscCreateUserAdminInput = {
  email: string
  password: string
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
