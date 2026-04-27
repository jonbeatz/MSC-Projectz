'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  msc_quick_add_task,
  msc_archiveVaultTask,
  msc_createVaultProject,
  msc_update_task_status,
  msc_updateTaskStatus,
  msc_deleteVaultProject,
  msc_deleteVaultTask,
  msc_loadVaultProjects,
  msc_moveProjectManual,
  msc_toggleVaultTask,
  msc_updateVaultProject,
  msc_updateVaultTaskTitle,
} from '@/lib/msc_vault_server_actions'
import { msc_vaultSignOutPayload } from '@/lib/msc_vault_payload_session'
import type {
  AppSettings,
  AuthView,
  Credential,
  EmailSettings,
  Project,
  ProjectSortMode,
  ProjectViewMode,
  RegisteredUser,
  Task,
  TaskStatus,
  User,
  ViewType,
} from '@/lib/types'

interface AppState {
  isAuthenticated: boolean
  masterPassword: string | null
  user: User | null
  users: RegisteredUser[]
  projects: Project[]
  vaultHydrated: boolean
  /** Payload user id whose project slice is currently loaded. Null means no tenant data is trusted. */
  vaultUserId: string | number | null
  selectedProjectId: string | null
  currentView: ViewType
  authView: AuthView
  appSettings: AppSettings

  setMasterPassword: (password: string) => void
  changeMasterPassword: (oldPassword: string, newPassword: string) => boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  setAuthView: (view: AuthView) => void

  updateUser: (updates: Partial<User>) => void
  inviteUser: (username: string, email: string, tempPassword: string) => void
  deleteUser: (userId: string) => boolean
  updateUserStatus: (userId: string, status: 'pending' | 'active') => boolean
  getUsers: () => RegisteredUser[]

  setCurrentView: (view: ViewType) => void

  updateAppSettings: (settings: Partial<AppSettings>) => void
  toggleTheme: () => void
  setProjectViewMode: (mode: ProjectViewMode) => void
  setProjectSortMode: (mode: ProjectSortMode) => void
  moveProjectManual: (projectId: string, direction: 'up' | 'down') => Promise<void>

  hydrateVaultFromPayload: () => Promise<void>
  /** Atomic vault purge before loading a new tenant's projects. */
  msc_hardResetVaultState: () => void
  /** Clear projects + hydration flag when Payload user id changes (no cross-tenant bleed). */
  msc_resetVaultForUserSwitch: () => void
  /** Sign out, clear persisted client storage, reset in-memory state (invalid / broken session). */
  msc_purgeClientSession: () => void

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'manualRank'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project> & { emailSettings?: Partial<EmailSettings> }) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  selectProject: (id: string | null) => void
  updateProjectProgress: (id: string, progress: number) => Promise<void>

  addCredential: (projectId: string, credential: Omit<Credential, 'id'>) => Promise<void>
  updateCredential: (projectId: string, credentialId: string, updates: Partial<Credential>) => Promise<void>
  deleteCredential: (projectId: string, credentialId: string) => Promise<void>

  updateEmailSettings: (projectId: string, settings: EmailSettings) => Promise<void>

  addTask: (projectId: string, title: string) => Promise<void>
  toggleTask: (projectId: string, taskId: string) => Promise<void>
  cycleTaskStatus: (projectId: string, taskId: string) => Promise<void>
  /** Sets column status (Queue / Active / Stabilized); uses `msc_updateTaskStatus` server action. */
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => Promise<void>
  updateTaskTitle: (
    projectId: string,
    taskId: string,
    title: string,
    assignedTo?: string | number | null,
  ) => Promise<void>
  deleteTask: (projectId: string, taskId: string) => Promise<void>
  archiveTask: (projectId: string, taskId: string) => Promise<void>

  addGlobalTask: (title: string) => Promise<void>
  getAllTasks: () => { projectId: string; projectName: string; task: Task }[]
  getArchivedTasks: () => { projectId: string; projectName: string; task: Task }[]
}

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const defaultAppSettings: AppSettings = {
  email: '',
  pathFormat: 'windows',
  theme: 'dark',
  projectViewMode: 'grid',
  projectSortMode: 'manual',
  smtp: {
    incomingHost: 'mail.spacemail.com',
    incomingPort: '993',
    outgoingHost: 'mail.spacemail.com',
    outgoingPort: '465',
    username: '',
    password: '',
    ssl: true,
  },
}

function msc_replaceProject(projects: Project[], next: Project): Project[] {
  return projects.map((p) => (p.id === next.id ? next : p))
}

function msc_clearPersistedVaultState(): void {
  if (typeof window === 'undefined') return
  const projectStateKeys = [
    'msc-projectz-vault-data',
    'msc-projectz-projects',
    'msc-projectz-vault-projects',
  ]
  for (const key of projectStateKeys) {
    localStorage.removeItem(key)
  }

  const raw = localStorage.getItem('msc-projectz-storage')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> }
    if (parsed.state) {
      delete parsed.state.projects
      parsed.state.vaultHydrated = false
      parsed.state.selectedProjectId = null
      localStorage.setItem('msc-projectz-storage', JSON.stringify(parsed))
    }
  } catch {
    localStorage.removeItem('msc-projectz-storage')
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      masterPassword: null,
      user: null,
      users: [],
      projects: [],
      vaultHydrated: false,
      vaultUserId: null,
      selectedProjectId: null,
      currentView: 'dashboard',
      authView: 'login',
      appSettings: defaultAppSettings,

      setMasterPassword: (password) => set({ masterPassword: password }),

      changeMasterPassword: (oldPassword, newPassword) => {
        const { masterPassword } = get()
        if (oldPassword === masterPassword) {
          set({ masterPassword: newPassword })
          return true
        }
        return false
      },

      login: (username, password) => {
        const { user } = get()
        const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim())
        void password
        set({
          isAuthenticated: true,
          masterPassword: null,
          user: user || {
            username: username.trim(),
            email: looksEmail ? username.trim().toLowerCase() : '',
            role: 'user',
          },
        })
        return true
      },

      logout: () => {
        void msc_vaultSignOutPayload()
        set({
          isAuthenticated: false,
          currentView: 'dashboard',
          user: null,
          projects: [],
          vaultHydrated: false,
          vaultUserId: null,
          selectedProjectId: null,
        })
      },

      msc_resetVaultForUserSwitch: () => {
        msc_clearPersistedVaultState()
        set({
          projects: [],
          vaultHydrated: false,
          vaultUserId: null,
          selectedProjectId: null,
        })
      },

      msc_hardResetVaultState: () => {
        msc_clearPersistedVaultState()
        set({
          projects: [],
          vaultHydrated: false,
          vaultUserId: null,
          selectedProjectId: null,
        })
      },

      msc_purgeClientSession: () => {
        void msc_vaultSignOutPayload()
        msc_clearPersistedVaultState()
        set({
          isAuthenticated: false,
          user: null,
          projects: [],
          vaultHydrated: false,
          vaultUserId: null,
          selectedProjectId: null,
          currentView: 'dashboard',
        })
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('msc-projectz-storage')
          } catch {
            // ignore
          }
        }
      },

      setAuthView: (view) => set({ authView: view }),

      updateUser: (updates) => {
        const currentUserId = get().user?.payloadUserId ?? null
        console.log('UPDATE_PROFILE: store auth context', {
          hasPayloadUserId: currentUserId != null,
          currentUserId,
        })
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      inviteUser: (username, email, tempPassword) => {
        void tempPassword
        const newUser: RegisteredUser = {
          id: generateId(),
          username,
          email,
          role: 'user',
          status: 'active',
          createdAt: new Date(),
        }
        set((state) => ({
          users: [...state.users, newUser],
        }))
      },

      deleteUser: (userId) => {
        const { users, user } = get()
        if (user && users.some((u) => u.id === userId)) {
          set((state) => ({
            users: state.users.filter((u) => u.id !== userId),
          }))
          return true
        }
        return false
      },

      updateUserStatus: (userId, status) => {
        const { users } = get()
        if (users.some((u) => u.id === userId)) {
          set((state) => ({
            users: state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
          }))
          return true
        }
        return false
      },

      getUsers: () => get().users,

      setCurrentView: (view) => set({ currentView: view }),

      updateAppSettings: (settings) => {
        set((state) => ({
          appSettings: { ...state.appSettings, ...settings },
        }))
      },

      toggleTheme: () => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            theme: state.appSettings.theme === 'dark' ? 'light' : 'dark',
          },
        }))
      },

      setProjectViewMode: (mode) => {
        set((state) => ({
          appSettings: { ...state.appSettings, projectViewMode: mode },
        }))
      },

      setProjectSortMode: (mode) => {
        set((state) => ({
          appSettings: { ...state.appSettings, projectSortMode: mode },
        }))
      },

      moveProjectManual: async (projectId, direction) => {
        await msc_moveProjectManual(projectId, direction)
        await get().hydrateVaultFromPayload()
      },

      hydrateVaultFromPayload: async () => {
        const { isAuthenticated, user } = get()
        if (!isAuthenticated || !user?.payloadUserId) {
          set({ projects: [], vaultHydrated: true, vaultUserId: null })
          return
        }
        const vaultUserId = user.payloadUserId
        try {
          const projects = await msc_loadVaultProjects()
          const activeUser = get().user?.payloadUserId
          if (String(activeUser) !== String(vaultUserId)) {
            return
          }
          set({ projects, vaultHydrated: true, vaultUserId })
        } catch (e) {
          console.error('[MSC] hydrateVaultFromPayload', e)
          const message = e instanceof Error ? e.message : String(e)
          if (/authentication required/i.test(message)) {
            get().msc_purgeClientSession()
            return
          }
          set({ vaultHydrated: true, vaultUserId })
        }
      },

      addProject: async (project) => {
        const { user } = get()
        console.log('ADD_PROJECT: store auth context', {
          hasPayloadUserId: user?.payloadUserId != null,
          payloadUserId: user?.payloadUserId ?? null,
          email: user?.email ?? null,
        })
        try {
          const created = await msc_createVaultProject(project)
          set((state) => ({ projects: [...state.projects, created] }))
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          if (/authentication required/i.test(message)) {
            get().msc_purgeClientSession()
            throw new Error('Authentication required. Please sign in again.')
          }
          throw e
        }
      },

      updateProject: async (id, updates) => {
        const payload = {
          name: updates.name,
          thumbnail: updates.thumbnail,
          localPath: updates.localPath,
          liveUrl: updates.liveUrl,
          status: updates.status,
          progress: updates.progress,
          localNotes: updates.localNotes,
          liveNotes: updates.liveNotes,
          references: updates.references,
          credentials: updates.credentials,
          emailSettings: updates.emailSettings,
          members: updates.members,
        }
        const cleaned = Object.fromEntries(
          Object.entries(payload).filter(([, v]) => v !== undefined),
        ) as Partial<Project>
        const updated = await msc_updateVaultProject(id, cleaned)
        set((state) => ({ projects: msc_replaceProject(state.projects, updated) }))
      },

      deleteProject: async (id) => {
        await msc_deleteVaultProject(id)
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        }))
      },

      selectProject: (id) => set({ selectedProjectId: id }),

      updateProjectProgress: async (id, progress) => {
        const updated = await msc_updateVaultProject(id, {
          progress: Math.min(100, Math.max(0, progress)),
        })
        set((state) => ({ projects: msc_replaceProject(state.projects, updated) }))
      },

      addCredential: async (projectId, credential) => {
        const { projects } = get()
        const p = projects.find((x) => x.id === projectId)
        if (!p) return
        const nextCreds = [...p.credentials, { ...credential, id: generateId() }]
        const updated = await msc_updateVaultProject(projectId, { credentials: nextCreds })
        set((state) => ({ projects: msc_replaceProject(state.projects, updated) }))
      },

      updateCredential: async (projectId, credentialId, updates) => {
        const { projects } = get()
        const p = projects.find((x) => x.id === projectId)
        if (!p) return
        const nextCreds = p.credentials.map((c) =>
          c.id === credentialId ? { ...c, ...updates } : c,
        )
        const updated = await msc_updateVaultProject(projectId, { credentials: nextCreds })
        set((state) => ({ projects: msc_replaceProject(state.projects, updated) }))
      },

      deleteCredential: async (projectId, credentialId) => {
        const { projects } = get()
        const p = projects.find((x) => x.id === projectId)
        if (!p) return
        const nextCreds = p.credentials.filter((c) => c.id !== credentialId)
        const updated = await msc_updateVaultProject(projectId, { credentials: nextCreds })
        set((state) => ({ projects: msc_replaceProject(state.projects, updated) }))
      },

      updateEmailSettings: async (projectId, settings) => {
        const updated = await msc_updateVaultProject(projectId, { emailSettings: settings })
        set((state) => ({ projects: msc_replaceProject(state.projects, updated) }))
      },

      addTask: async (projectId, title) => {
        const task = await msc_quick_add_task(projectId, title)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: [...p.tasks, task], updatedAt: new Date() }
              : p,
          ),
        }))
      },

      toggleTask: async (projectId, taskId) => {
        const task = await msc_toggleVaultTask(projectId, taskId)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === taskId ? task : t)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      cycleTaskStatus: async (projectId, taskId) => {
        const { projects } = get()
        const p = projects.find((x) => x.id === projectId)
        const t = p?.tasks.find((x) => x.id === taskId)
        if (!p || !t) return
        const order: TaskStatus[] = ['todo', 'in-progress', 'done']
        const cur = (t.status || 'todo') as TaskStatus
        const next = order[(order.indexOf(cur) + 1) % order.length]
        const task = await msc_update_task_status(projectId, taskId, next, {
          completed: next === 'done',
          archived: Boolean(t.archived),
        })
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  tasks: proj.tasks.map((row) => (row.id === taskId ? task : row)),
                  updatedAt: new Date(),
                }
              : proj,
          ),
        }))
      },

      updateTaskStatus: async (projectId, taskId, status) => {
        const { projects } = get()
        const p = projects.find((x) => x.id === projectId)
        const t = p?.tasks.find((x) => x.id === taskId)
        if (!p || !t) return
        const task = await msc_updateTaskStatus(projectId, taskId, status, {
          completed: status === 'done',
          archived: Boolean(t.archived),
        })
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  tasks: proj.tasks.map((row) => (row.id === taskId ? task : row)),
                  updatedAt: new Date(),
                }
              : proj,
          ),
        }))
      },

      updateTaskTitle: async (projectId, taskId, title, assignedTo) => {
        const task = await msc_updateVaultTaskTitle(projectId, taskId, title, assignedTo)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === taskId ? task : t)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      deleteTask: async (projectId, taskId) => {
        await msc_deleteVaultTask(projectId, taskId)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.filter((t) => t.id !== taskId),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      archiveTask: async (projectId, taskId) => {
        const task = await msc_archiveVaultTask(projectId, taskId)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === taskId ? task : t)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      addGlobalTask: async (title) => {
        const { projects } = get()
        if (projects.length === 0) return
        const projectId = projects[0].id
        const task = await msc_quick_add_task(projectId, title)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: [...p.tasks, task], updatedAt: new Date() }
              : p,
          ),
        }))
      },

      getAllTasks: () => {
        const { projects } = get()
        const allTasks: { projectId: string; projectName: string; task: Task }[] = []
        projects.forEach((project) => {
          project.tasks
            .filter((task) => task.status !== 'done' && !task.archived)
            .forEach((task) => {
              allTasks.push({
                projectId: project.id,
                projectName: project.name,
                task: { ...task, status: task.status || 'todo' },
              })
            })
        })
        return allTasks
      },

      getArchivedTasks: () => {
        const { projects } = get()
        const archivedTasks: { projectId: string; projectName: string; task: Task }[] = []
        projects.forEach((project) => {
          project.tasks
            .filter((task) => task.archived || task.status === 'done')
            .forEach((task) => {
              archivedTasks.push({
                projectId: project.id,
                projectName: project.name,
                task: { ...task, status: task.status || 'done' },
              })
            })
        })
        return archivedTasks
      },
    }),
    {
      name: 'msc-projectz-storage',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        let authView: AuthView = (p.authView ?? current.authView) as AuthView
        if ((p.authView as string | undefined) === 'signup') {
          authView = 'login'
        }
        const appSettings: AppSettings = {
          ...defaultAppSettings,
          ...current.appSettings,
          ...(p.appSettings as Partial<AppSettings> | undefined),
        }
        return { ...current, ...p, authView, appSettings }
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        masterPassword: state.masterPassword,
        user: state.user,
        users: state.users,
        selectedProjectId: state.selectedProjectId,
        currentView: state.currentView,
        authView: state.authView,
        appSettings: state.appSettings,
      }),
    },
  ),
)
