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

export interface Project {
  id: string
  name: string
  thumbnail?: string
  localPath: string
  liveUrl?: string
  status: 'local' | 'live'
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
