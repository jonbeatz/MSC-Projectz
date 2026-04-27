'use client'

import { useEffect, useState } from 'react'

import { EditProjectModal } from '@/components/edit-project-modal'
import { MSC_Projectz_Dashboard } from '@/components/MSC-Projectz-Dashboard'
import { useMSCProjectzCommandCenter } from '@/components/MSC-Projectz-CommandCenterContext'
import { ProjectVault } from '@/components/project-vault'
import { TaskDrawer } from '@/components/task-drawer'
import { useAppStore } from '@/lib/store'
import { useTaskPulseSignal } from '@/lib/useTaskPulseSignal'

export function MSC_Projectz_DashboardRouteView() {
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [vaultProjectId, setVaultProjectId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [taskDrawerProjectId, setTaskDrawerProjectId] = useState<string | null>(null)

  const { searchQuery, onAddProject } = useMSCProjectzCommandCenter()
  const projects = useAppStore((s) => s.projects)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const vaultHydrated = useAppStore((s) => s.vaultHydrated)
  const vaultUserId = useAppStore((s) => s.vaultUserId)

  const vaultProject = projects.find((p) => p.id === vaultProjectId)
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const editProject = projects.find((p) => p.id === editProjectId)
  const taskDrawerProject = projects.find((p) => p.id === taskDrawerProjectId)

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const needsAttention = useTaskPulseSignal((s) => s.needsAttention)
  const targetProjectId = useTaskPulseSignal((s) => s.targetProjectId)

  useEffect(() => {
    if (!needsAttention) return

    const target = targetProjectId && projects.some((project) => project.id === targetProjectId)
      ? targetProjectId
      : projects[0]?.id ?? null

    if (target) {
      setSelectedProjectId(target)
      setTaskDrawerProjectId(target)
    }

    useTaskPulseSignal.getState().setSignal(false, null)
  }, [needsAttention, targetProjectId, projects])

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
        onSelectProject={(id) => setSelectedProjectId(id)}
        onOpenVault={(id) => setVaultProjectId(id)}
        onEditProject={(id) => setEditProjectId(id)}
        onOpenTaskDrawer={(id) => setTaskDrawerProjectId(id)}
        selectedProjectId={selectedProjectId}
        onClearSelectedProject={() => setSelectedProjectId(null)}
        selectedProject={selectedProject ?? null}
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
