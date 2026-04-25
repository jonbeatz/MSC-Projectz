export interface Credential {
  id: string
  label: string
  username: string
  password: string
}

export interface EmailSettings {
  email: string
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  completed: boolean
  archived?: boolean
  createdAt: Date
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
  createdAt: Date
  updatedAt: Date
}

export type WizardStep = 'identity' | 'connectivity' | 'credentials' | 'status'

export type ViewType = 'dashboard' | 'global-tasks' | 'settings' | 'help'

export type PathFormat = 'windows' | 'mac'

export type AuthView = 'login' | 'signup' | 'forgot-password'

export type ProjectViewMode = 'grid' | 'list'

export interface User {
  username: string
  email: string
  avatar?: string
  role?: 'admin' | 'user'
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
  smtp: SpacemailSMTP
}
