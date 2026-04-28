'use client'

import { useEffect, useMemo, useState } from 'react'

import { EditProjectModal } from '@/components/edit-project-modal'
import { MSC_Projectz_Dashboard } from '@/components/MSC-Projectz-Dashboard'
import { useMSCProjectzCommandCenter } from '@/components/MSC-Projectz-CommandCenterContext'
import { ProjectVault } from '@/components/project-vault'
import { TaskDrawer } from '@/components/task-drawer'
import { msc_sortProjectsForDashboard } from '@/lib/msc_project_sort'
import { useAppStore } from '@/lib/store'
import { useTaskPulseSignal } from '@/lib/useTaskPulseSignal'

export function MSC_Projectz_DashboardRouteView() {
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [vaultProjectId, setVaultProjectId] = useState<string | null>(null)
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null)
  const [focusOpen, setFocusOpen] = useState(false)
  const [focusTab, setFocusTab] = useState<'tasks' | 'code-vault'>('tasks')
  const [taskDrawerProjectId, setTaskDrawerProjectId] = useState<string | null>(null)

  const { searchQuery, onAddProject } = useMSCProjectzCommandCenter()
  const projects = useAppStore((s) => s.projects)
  const projectSortMode = useAppStore((s) => s.appSettings.projectSortMode)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const vaultHydrated = useAppStore((s) => s.vaultHydrated)
  const vaultUserId = useAppStore((s) => s.vaultUserId)

  const vaultProject = projects.find((p) => p.id === vaultProjectId)
  const focusProject = projects.find((p) => p.id === focusProjectId) ?? null
  const editProject = projects.find((p) => p.id === editProjectId)
  const taskDrawerProject = projects.find((p) => p.id === taskDrawerProjectId)

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const f = projects.filter((project) => project.name.toLowerCase().includes(q))
    return msc_sortProjectsForDashboard(f, projectSortMode)
  }, [projects, projectSortMode, searchQuery])
  const needsAttention = useTaskPulseSignal((s) => s.needsAttention)
  const targetProjectId = useTaskPulseSignal((s) => s.targetProjectId)

  useEffect(() => {
    if (!needsAttention) return

    const target = targetProjectId && projects.some((project) => project.id === targetProjectId)
      ? targetProjectId
      : projects[0]?.id ?? null

    if (target) {
      setFocusProjectId(target)
      setTaskDrawerProjectId(target)
    }

    useTaskPulseSignal.getState().setSignal(false, null)
  }, [needsAttention, targetProjectId, projects])

  useEffect(() => {
    if (!focusProjectId) {
      setFocusOpen(false)
      return
    }
    const exists = projects.some((project) => project.id === focusProjectId)
    if (!exists) {
      setFocusOpen(false)
      setFocusProjectId(null)
    }
  }, [focusProjectId, projects])

  const msc_vaultSyncPending =
    isAuthenticated &&
    (
      user?.payloadUserId == null ||
      !vaultHydrated ||
      String(vaultUserId ?? '') !== String(user.payloadUserId)
    )

  if (msc_vaultSyncPending) {
    return (
      <div
        className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span>Syncing vault for your account...</span>
      </div>
    )
  }

  return (
    <>
      <MSC_Projectz_Dashboard
        projects={projects}
        filteredProjects={filteredProjects}
        searchQuery={searchQuery}
        onInitializeNewVault={onAddProject}
        onAddProject={onAddProject}
        onSelectProject={(id) => {
          setFocusProjectId(id)
          setFocusOpen(true)
        }}
        onOpenVault={(id) => setVaultProjectId(id)}
        onEditProject={(id) => setEditProjectId(id)}
        onOpenTaskDrawer={(id) => setTaskDrawerProjectId(id)}
        focusProject={focusProject}
        focusOpen={focusOpen}
        onFocusOpenChange={setFocusOpen}
        focusTab={focusTab}
        onFocusTabChange={setFocusTab}
      />

      <EditProjectModal
        project={editProject || null}
        isOpen={!!editProjectId}
        onClose={() => setEditProjectId(null)}
      />

      {vaultProject && (
        <ProjectVault
          project={vaultProject}
          isOpen={!!vaultProjectId}
          onClose={() => setVaultProjectId(null)}
        />
      )}

      <TaskDrawer
        isOpen={!!taskDrawerProjectId}
        onClose={() => setTaskDrawerProjectId(null)}
        project={taskDrawerProject || null}
      />
    </>
  )
}
