'use client'

import { useState } from 'react'
import { Plus, Search, ExternalLink, FolderOpen, MonitorPlay, Settings, Key, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectCard } from './project-card'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types'
import { getSafePath } from '@/lib/env-utils'
import { msc_open_project_folder } from '@/lib/msc_native_system_bridge'

interface ProjectGridProps {
  projects: Project[]
  searchQuery: string
  onAddProject: () => void
  onSelectProject: (id: string) => void
  onOpenVault: (id: string) => void
  onEditProject: (id: string) => void
  onOpenTaskDrawer?: (id: string) => void
}

function ProjectListItem({ 
  project, 
  onSelect, 
  onDelete, 
  onOpenVault,
  onEdit,
  onOpenTaskDrawer
}: { 
  project: Project
  onSelect: () => void
  onDelete: () => void
  onOpenVault: () => void
  onEdit: () => void
  onOpenTaskDrawer?: () => void
}) {
  const appSettings = useAppStore((s) => s.appSettings)
  const isDark = appSettings.theme === 'dark'
  const [isCopied, setIsCopied] = useState(false)
  
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.completed).length
  const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0)
  const safeLocalPath = getSafePath(project.localPath)

  const handleOpenInExplorer = async () => {
    void msc_open_project_folder(safeLocalPath).catch((err) => {
      console.error('[MSC] msc_open_project_folder', err)
    })

    try {
      await navigator.clipboard.writeText(safeLocalPath)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('[MSC] copy project path', err)
    }
  }

  const handleOpenLiveUrl = () => {
    if (project.liveUrl) {
      window.open(project.liveUrl, '_blank')
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer",
        "bg-card border border-border hover:bg-secondary/50",
        !isDark && "card-shadow"
      )}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg shrink-0 overflow-hidden flex items-center justify-center bg-secondary">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <MonitorPlay className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate text-foreground">{project.name}</h3>
          <span 
            className={cn(
              "px-2 py-0.5 text-[10px] uppercase font-semibold rounded",
              project.status === 'live' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {project.status}
          </span>
        </div>
        {safeLocalPath.trim() ? (
          <p className="text-xs truncate mt-0.5 text-muted-foreground">{safeLocalPath}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground/90">No local path — use Edit to set one</p>
        )}
        
        {/* Progress Bar with clickable task counter */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1.5 rounded-full max-w-32 bg-muted">
            <div 
              className="h-full rounded-full bg-primary"
              style={{ width: `${calculatedProgress}%` }}
            />
          </div>
          <span className="text-xs text-primary">{calculatedProgress}%</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenTaskDrawer?.()
            }}
            className="text-xs hover:underline transition-colors text-muted-foreground"
          >
            {completedTasks}/{totalTasks} tasks
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => void handleOpenInExplorer()}
          title="Explorer"
        >
          {isCopied ? <Check className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
        </Button>
        {project.liveUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-primary hover:text-primary/80"
            onClick={handleOpenLiveUrl}
            title="Open Live URL"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
        <div className="w-px h-6 bg-border" />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onOpenVault}
          title="Open Vault"
        >
          <Key className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          title="Edit Project"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
          onClick={onDelete}
          title="Delete Project"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function ProjectGrid({
  projects,
  searchQuery,
  onAddProject,
  onSelectProject,
  onOpenVault,
  onEditProject,
  onOpenTaskDrawer,
}: ProjectGridProps) {
  const allProjects = useAppStore((s) => s.projects)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const appSettings = useAppStore((s) => s.appSettings)
  const viewMode = appSettings.projectViewMode
  
  const isDark = appSettings.theme === 'dark'

  if (allProjects.length === 0) {
    return null
  }

  // Show no results message when search returns empty
  if (projects.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-card border border-border",
          !isDark && "card-shadow"
        )}>
          <Search className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium mb-2 text-foreground">No projects found</h2>
        <p className="text-sm mb-6 text-center max-w-md text-muted-foreground">
          No projects match &quot;{searchQuery}&quot;. Try a different search term.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-semibold text-foreground">{allProjects.length}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Projects</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-semibold text-primary">
              {allProjects.filter(p => p.status === 'live').length}
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Live</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {allProjects.filter(p => p.status === 'local').length}
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Local</p>
          </div>
        </div>
        <Button 
          onClick={onAddProject} 
          size="sm" 
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      {/* Search Results Indicator */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} result{projects.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => onSelectProject(project.id)}
              onDelete={() => {
                void deleteProject(project.id)
              }}
              onOpenVault={() => onOpenVault(project.id)}
              onEdit={() => onEditProject(project.id)}
              onOpenTaskDrawer={() => onOpenTaskDrawer?.(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onSelect={() => onSelectProject(project.id)}
              onDelete={() => {
                void deleteProject(project.id)
              }}
              onOpenVault={() => onOpenVault(project.id)}
              onEdit={() => onEditProject(project.id)}
              onOpenTaskDrawer={() => onOpenTaskDrawer?.(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
