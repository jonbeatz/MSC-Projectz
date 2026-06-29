'use client'

import { useState } from 'react'
import { DashboardLayout } from './dashboard-layout'
import { ProjectGrid } from './project-grid'
import { AddProjectModal } from './add-project-modal'
import { EditProjectModal } from './edit-project-modal'
import { ProjectVault } from './project-vault'
import { TaskPulse } from './task-pulse'
import { SettingsView } from './settings-view'
import { HelpView } from './help-view'
import { GlobalTasksView } from './global-tasks-view'
import { TaskDrawer } from './task-drawer'
import { useAppStore } from '@/lib/store'
import { X } from 'lucide-react'

export function Dashboard() {
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [vaultProjectId, setVaultProjectId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [taskDrawerProjectId, setTaskDrawerProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const projects = useAppStore((s) => s.projects)
  const currentView = useAppStore((s) => s.currentView)
  const appSettings = useAppStore((s) => s.appSettings)

  const vaultProject = projects.find((p) => p.id === vaultProjectId)
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const editProject = projects.find((p) => p.id === editProjectId)
  const taskDrawerProject = projects.find((p) => p.id === taskDrawerProjectId)

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const renderContent = () => {
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
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <ProjectGrid
                projects={filteredProjects}
                searchQuery={searchQuery}
                onAddProject={() => setAddProjectOpen(true)}
                onSelectProject={(id) => setSelectedProjectId(id)}
                onOpenVault={(id) => setVaultProjectId(id)}
                onEditProject={(id) => setEditProjectId(id)}
                onOpenTaskDrawer={(id) => setTaskDrawerProjectId(id)}
              />
            </div>

            {/* Right Sidebar - Task Pulse for selected project */}
            {selectedProject && (
              <div className="w-80 flex-shrink-0">
                <div className="sticky top-20">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-foreground">{selectedProject.name}</h2>
                    <button
                      onClick={() => setSelectedProjectId(null)}
                      className="p-1 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <TaskPulse project={selectedProject} />
                </div>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <DashboardLayout
      onAddProject={() => setAddProjectOpen(true)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {renderContent()}

      {/* Modals & Panels */}
      <AddProjectModal isOpen={addProjectOpen} onClose={() => setAddProjectOpen(false)} />

      <EditProjectModal project={editProject || null} isOpen={!!editProjectId} onClose={() => setEditProjectId(null)} />

      {vaultProject && (
        <ProjectVault project={vaultProject} isOpen={!!vaultProjectId} onClose={() => setVaultProjectId(null)} />
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
