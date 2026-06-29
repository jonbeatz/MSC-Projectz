'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RegisteredUser, TaskStatus } from './types'

interface AppState {
  isAuthenticated: boolean
  masterPassword: string | null
  user: User | null
  users: RegisteredUser[]
  projects: Project[]
  selectedProjectId: string | null
  currentView: ViewType
  authView: AuthView
  appSettings: AppSettings

  // Auth actions
  setMasterPassword: (password: string) => void
  changeMasterPassword: (oldPassword: string, newPassword: string) => boolean
  login: (username: string, password: string) => boolean
  signup: (
    username: string,
    email: string,
    password: string,
    inviteCode?: string,
  ) => { success: boolean; status: 'pending' | 'active' }
  logout: () => void
  setAuthView: (view: AuthView) => void

  // User actions
  updateUser: (updates: Partial<User>) => void
  inviteUser: (username: string, email: string, tempPassword: string) => void
  deleteUser: (userId: string) => boolean
  updateUserStatus: (userId: string, status: 'pending' | 'active') => boolean
  getUsers: () => RegisteredUser[]

  // Navigation
  setCurrentView: (view: ViewType) => void

  // App Settings
  updateAppSettings: (settings: Partial<AppSettings>) => void
  toggleTheme: () => void
  setProjectViewMode: (mode: ProjectViewMode) => void

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  selectProject: (id: string | null) => void
  updateProjectProgress: (id: string, progress: number) => void

  // Credential actions
  addCredential: (projectId: string, credential: Omit<Credential, 'id'>) => void
  updateCredential: (projectId: string, credentialId: string, updates: Partial<Credential>) => void
  deleteCredential: (projectId: string, credentialId: string) => void

  // Email settings actions
  updateEmailSettings: (projectId: string, settings: EmailSettings) => void

  // Task actions
  addTask: (projectId: string, title: string) => void
  toggleTask: (projectId: string, taskId: string) => void
  cycleTaskStatus: (projectId: string, taskId: string) => void
  updateTaskTitle: (projectId: string, taskId: string, title: string) => void
  deleteTask: (projectId: string, taskId: string) => void
  archiveTask: (projectId: string, taskId: string) => void

  // Global task actions
  addGlobalTask: (title: string) => void
  getAllTasks: () => { projectId: string; projectName: string; task: Task }[]
  getArchivedTasks: () => { projectId: string; projectName: string; task: Task }[]
}

// UUID v4 generator for robust unique IDs
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Default app settings - Dark Mode and Grid View as hardcoded landing state
const defaultAppSettings: AppSettings = {
  email: '',
  pathFormat: 'windows',
  theme: 'dark', // Hardcoded default: Dark Mode
  projectViewMode: 'grid', // Hardcoded default: Grid View
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      masterPassword: null,
      user: null,
      users: [],
      projects: [],
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
        const { masterPassword, user } = get()
        // First time setup or correct password
        if (!masterPassword || password === masterPassword) {
          set({
            isAuthenticated: true,
            masterPassword: password,
            user: user || { username, email: '', role: 'admin' },
          })
          return true
        }
        return false
      },

      signup: (username, email, password, inviteCode?: string) => {
        const ADMIN_INVITE_CODE = 'VADER-2026'
        const isInstantAccess = inviteCode === ADMIN_INVITE_CODE

        if (isInstantAccess) {
          // Instant access with valid invite code
          set({
            isAuthenticated: true,
            masterPassword: password,
            user: { username, email, role: 'user' },
            authView: 'login',
          })
          return { success: true, status: 'active' as const }
        } else {
          // Pending approval - don't authenticate yet
          const newUser: RegisteredUser = {
            id: generateId(),
            username,
            email,
            role: 'user',
            status: 'pending',
            createdAt: new Date(),
          }
          set((state) => ({
            users: [...state.users, newUser],
            authView: 'login',
          }))
          // Placeholder: SMTP notification to admin via Spacemail
          return { success: true, status: 'pending' as const }
        }
      },

      logout: () => set({ isAuthenticated: false, currentView: 'dashboard' }),

      setAuthView: (view) => set({ authView: view }),

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      inviteUser: (username, email, tempPassword) => {
        const newUser: RegisteredUser = {
          id: generateId(),
          username,
          email,
          role: 'user',
          status: 'active', // Admin-created users are active by default
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
          // Placeholder for Spacemail SMTP notification to user
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

      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: generateId(),
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({ projects: [...state.projects, newProject] }))
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        }))
      },

      selectProject: (id) => set({ selectedProjectId: id }),

      updateProjectProgress: (id, progress) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, progress: Math.min(100, Math.max(0, progress)), updatedAt: new Date() } : p,
          ),
        }))
      },

      addCredential: (projectId, credential) => {
        const newCredential: Credential = { ...credential, id: generateId() }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, credentials: [...p.credentials, newCredential], updatedAt: new Date() } : p,
          ),
        }))
      },

      updateCredential: (projectId, credentialId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  credentials: p.credentials.map((c) => (c.id === credentialId ? { ...c, ...updates } : c)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      deleteCredential: (projectId, credentialId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  credentials: p.credentials.filter((c) => c.id !== credentialId),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      updateEmailSettings: (projectId, settings) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, emailSettings: settings, updatedAt: new Date() } : p,
          ),
        }))
      },

      addTask: (projectId, title) => {
        const newTask: Task = {
          id: generateId(),
          title,
          status: 'todo',
          completed: false,
          createdAt: new Date(),
        }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, tasks: [...p.tasks, newTask], updatedAt: new Date() } : p,
          ),
        }))
      },

      toggleTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      cycleTaskStatus: (projectId, taskId) => {
        const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done']
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => {
                    if (t.id === taskId) {
                      const currentIndex = statusOrder.indexOf(t.status || 'todo')
                      const nextIndex = (currentIndex + 1) % statusOrder.length
                      const newStatus = statusOrder[nextIndex]
                      return {
                        ...t,
                        status: newStatus,
                        completed: newStatus === 'done',
                      }
                    }
                    return t
                  }),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      updateTaskTitle: (projectId, taskId, title) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      deleteTask: (projectId, taskId) => {
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

      archiveTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, archived: true, completed: true } : t)),
                  updatedAt: new Date(),
                }
              : p,
          ),
        }))
      },

      addGlobalTask: (title) => {
        // Add task to first available project or create an "Unassigned" bucket
        const { projects } = get()
        if (projects.length > 0) {
          const newTask: Task = {
            id: generateId(),
            title,
            status: 'todo',
            completed: false,
            createdAt: new Date(),
          }
          set((state) => ({
            projects: state.projects.map((p, index) =>
              index === 0 ? { ...p, tasks: [...p.tasks, newTask], updatedAt: new Date() } : p,
            ),
          }))
        }
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
    },
  ),
)
