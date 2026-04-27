import type { MscProjectMember } from '@/types/user-admin'
import type { MscAppRole } from '@/lib/msc_roles'

export interface Credential {
  id: string
  label: string
  username: string
  password: string
}

export type MscSmtpEncryption = 'ssl' | 'tls' | 'none'

/** IMAP (or generic incoming) host credentials stored per project. */
export type MscProjectIncomingMail = {
  host: string
  port: number
  username: string
  password: string
}

/** Outgoing SMTP row (Payload `emailSettings.outgoing` nested group). */
export type MscProjectOutgoingSmtp = MscProjectIncomingMail & {
  encryption: MscSmtpEncryption
}

/**
 * Per-project mail: incoming (IMAP) + outgoing (SMTP). See `MSC-Projectz-VaultProjects` `emailSettings`.
 */
export interface EmailSettings {
  incoming: MscProjectIncomingMail
  outgoing: MscProjectOutgoingSmtp
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type MscTaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  /** Longer text; optional in admin and for calendar detail. */
  description?: string
  status: TaskStatus
  completed: boolean
  archived?: boolean
  /** Date-only (calendar placement); from Payload `dueDate` */
  dueDate?: Date | null
  /** Defaults to `normal` when not set in older rows. */
  priority: MscTaskPriority
  assignedTo?: MscProjectMember | null
  createdAt: Date
  updatedAt: Date
}

/** Saved link or small embedded file for project reference (JSON in Payload). */
export interface ProjectReference {
  id: string
  title: string
  kind: 'link' | 'file'
  url?: string
  fileDataUrl?: string
  mime?: string
  fileName?: string
  createdAt: Date
}

export interface Project {
  id: string
  /** Owner in Payload `users` (set server-side; optional in client types for older builds). */
  ownerUserId?: string | number
  /** Payload `users` collaborators for this project. */
  members?: MscProjectMember[]
  name: string
  thumbnail?: string
  localPath: string
  liveUrl?: string
  status: 'local' | 'live'
  /** Optional notes for the local/dev environment */
  localNotes?: string
  /** Optional notes for production / live */
  liveNotes?: string
  /** Links and small file payloads (data URLs) for on-project reference */
  references?: ProjectReference[]
  credentials: Credential[]
  emailSettings?: EmailSettings
  tasks: Task[]
  progress: number
  /**
   * Manual sort order in dashboard (Payload `manualRank`); lower = earlier. Tie-broken by `createdAt` in UI.
   */
  manualRank: number
  createdAt: Date
  updatedAt: Date
}

export type WizardStep = 'identity' | 'connectivity' | 'credentials' | 'status'

export type ViewType = 'dashboard' | 'global-tasks' | 'settings' | 'help'

export type PathFormat = 'windows' | 'mac'

export type AuthView = 'login' | 'forgot-password'

export type ProjectViewMode = 'grid' | 'list'

export type ProjectSortMode = 'manual' | 'name' | 'updated' | 'status'

/** Command Center /calendar: month or week column layout. */
export type CalendarViewMode = 'month' | 'week'

export interface User {
  username: string
  email: string
  avatar?: string
  avatarId?: string | number | null
  avatarUrl?: string | null
  role?: MscAppRole
  isVerified?: boolean
  /** Payload `users` document id when signed in via `msc_vaultSignInToPayload` */
  payloadUserId?: string | number
}

export type UserStatus = 'pending' | 'active'

export interface RegisteredUser extends User {
  id: string
  status: UserStatus
  createdAt: Date
}

export interface SpacemailSMTP {
  incomingHost: string
  incomingPort: string
  outgoingHost: string
  outgoingPort: string
  username: string
  password: string
  ssl: boolean
}

export interface AppSettings {
  email: string
  pathFormat: PathFormat
  theme: 'dark' | 'light'
  projectViewMode: ProjectViewMode
  /** Dashboard vault project list ordering (not persisted on project rows for non-manual). */
  projectSortMode: ProjectSortMode
  /** /calendar: grid mode. */
  calendarView: CalendarViewMode
  /** /calendar: focused day (date-only, `yyyy-MM-dd`) for sidebar and cell selection. */
  selectedDate: string
  smtp: SpacemailSMTP
}
