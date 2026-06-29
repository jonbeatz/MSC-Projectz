'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/lib/store'
import {
  msc_loadVaultProjects,
  msc_createVaultProject,
  msc_updateVaultProject,
  msc_deleteVaultProject,
  msc_quick_add_task,
  msc_toggleVaultTask,
  msc_update_task_status,
  msc_updateVaultTaskTitle,
  msc_deleteVaultTask,
  msc_archiveVaultTask,
  msc_getCalendarDayDetailsRange,
} from '@/lib/msc_vault_server_actions'
import { msc_listClients } from '@/lib/msc_client_actions'
import type { Project, TaskStatus } from '@/lib/types'

// ============================================================================
// Query key factory
// ============================================================================
export const mscQueryKeys = {
  projects: ['msc', 'projects'] as const,
  calendar: (startYmd: string, endYmd: string) => ['msc', 'calendar', startYmd, endYmd] as const,
  clients: ['msc', 'clients'] as const,
}

// ============================================================================
// Projects query
// ============================================================================
export function useMscProjects() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)

  return useQuery({
    queryKey: mscQueryKeys.projects,
    queryFn: msc_loadVaultProjects,
    enabled: isAuthenticated && !!user?.payloadUserId,
    select: (projects) => projects,
  })
}

// ============================================================================
// Project mutations
// ============================================================================
export function useMscCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (project: Parameters<typeof msc_createVaultProject>[0]) => msc_createVaultProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) => msc_updateVaultProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => msc_deleteVaultProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

// ============================================================================
// Task mutations
// ============================================================================
export function useMscAddTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      title,
      options,
    }: {
      projectId: string
      title: string
      options?: { dueDate?: string | null; assignedTo?: string | number | null }
    }) => msc_quick_add_task(projectId, title, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscToggleTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      msc_toggleVaultTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      status,
      meta,
    }: {
      projectId: string
      taskId: string
      status: TaskStatus
      meta: { completed: boolean; archived: boolean }
    }) => msc_update_task_status(projectId, taskId, status, meta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscUpdateTaskTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      title,
      assignedTo,
    }: {
      projectId: string
      taskId: string
      title: string
      assignedTo?: string | number | null
    }) => msc_updateVaultTaskTitle(projectId, taskId, title, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      msc_deleteVaultTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

export function useMscArchiveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      msc_archiveVaultTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
    },
  })
}

// ============================================================================
// Calendar query
// ============================================================================
export function useMscCalendarDayDetails(startYmd: string, endYmd: string) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: mscQueryKeys.calendar(startYmd, endYmd),
    queryFn: () => msc_getCalendarDayDetailsRange({ startYmd, endYmd, includeDone: true }),
    enabled: isAuthenticated && !!startYmd && !!endYmd,
    select: (data) => data.byDay,
    staleTime: 60_000, // 1min — calendar data changes more frequently
  })
}

export function useInvalidateMscProjects() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: mscQueryKeys.projects })
}

// ============================================================================
// Clients query
// ============================================================================
export function useMscClients() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: mscQueryKeys.clients,
    queryFn: async () => {
      const result = await msc_listClients()
      if (!result.ok) throw new Error(result.error)
      return result.clients
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })
}

export function useMscClientsById() {
  const { data: clients } = useMscClients()
  const map = new Map<string, string>()
  if (clients) {
    for (const c of clients) {
      map.set(c.id, c.name)
    }
  }
  return { clients, clientsById: map }
}

export function useInvalidateMscClients() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: mscQueryKeys.clients })
}
