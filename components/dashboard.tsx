'use client'

import { useState } from 'react'
import { DashboardLayout } from './dashboard-layout'
import { MSC_Projectz_Dashboard } from './MSC-Projectz-Dashboard'
import { AddProjectModal } from './add-project-modal'
import { EditProjectModal } from './edit-project-modal'
import { ProjectVault } from './project-vault'
import { SettingsView } from './settings-view'
import { HelpView } from './help-view'
import { GlobalTasksView } from './global-tasks-view'
import { TaskDrawer } from './task-drawer'
import { useAppStore } from '@/lib/store'
import { MSC_Projectz_VaultHydrator } from '@/components/MSC-Projectz-VaultHydrator'

export function Dashboard() {
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [vaultProjectId, setVaultProjectId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [taskDrawerProjectId, setTaskDrawerProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const projects = useAppStore((s) => s.projects)
  const currentView = useAppStore((s) => s.currentView)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const vaultHydrated = useAppStore((s) => s.vaultHydrated)
  const vaultUserId = useAppStore((s) => s.vaultUserId)
  const vaultProject = projects.find((p) => p.id === vaultProjectId)
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const editProject = projects.find((p) => p.id === editProjectId)
  const taskDrawerProject = projects.find((p) => p.id === taskDrawerProjectId)

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const msc_vaultSyncPending =
    isAuthenticated &&
    (
      user?.payloadUserId == null ||
      !vaultHydrated ||
      String(vaultUserId ?? '') !== String(user.payloadUserId)
    )

  const renderContent = () => {
    if (msc_vaultSyncPending) {
      return (
        <div
          className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span>Syncing vault for your account…</span>
        </div>
      )
    }
    switch (currentView) {
      case 'settings':
        return <SettingsView />
      case 'help':
        return <HelpView />
      case 'global-tasks':
        return <GlobalTasksView />
      case 'dashboard':
      default:
        return (
          <MSC_Projectz_Dashboard
            projects={projects}
            filteredProjects={filteredProjects}
            searchQuery={searchQuery}
            onInitializeNewVault={() => setAddProjectOpen(true)}
            onAddProject={() => setAddProjectOpen(true)}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenVault={(id) => setVaultProjectId(id)}
            onEditProject={(id) => setEditProjectId(id)}
            onOpenTaskDrawer={(id) => setTaskDrawerProjectId(id)}
            selectedProjectId={selectedProjectId}
            onClearSelectedProject={() => setSelectedProjectId(null)}
            selectedProject={selectedProject ?? null}
          />
        )
    }
  }

  return (
    <DashboardLayout 
      onAddProject={() => setAddProjectOpen(true)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <MSC_Projectz_VaultHydrator />
      {renderContent()}

      {/* Modals & Panels */}
      <AddProjectModal
        isOpen={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
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
      
      {/* Task Drawer - Triggered by progress circle click */}
      <TaskDrawer
        isOpen={!!taskDrawerProjectId}
        onClose={() => setTaskDrawerProjectId(null)}
        project={taskDrawerProject || null}
      />
    </DashboardLayout>
  )
}
