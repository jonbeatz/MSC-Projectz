'use client'

import { ExternalLink, FolderOpen, MonitorPlay, MoreVertical, Trash2, Key, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

/**
 * Tauri 2.0 Hook Placeholder
 */
const handleOpenPath = (path: string, action: 'cursor' | 'explorer' | 'terminal' = 'explorer') => {
  switch (action) {
    case 'cursor':
      window.open(`vscode://file/${path}`, '_blank')
      break
    case 'explorer':
      navigator.clipboard.writeText(path)
      break
    case 'terminal':
      navigator.clipboard.writeText(`cd "${path}"`)
      break
  }
}

interface ProjectCardProps {
  project: Project
  onSelect: () => void
  onDelete: () => void
  onOpenVault: () => void
  onEdit: () => void
  onOpenTaskDrawer?: () => void
}

export function ProjectCard({ project, onSelect, onDelete, onOpenVault, onEdit, onOpenTaskDrawer }: ProjectCardProps) {
  const appSettings = useAppStore((s) => s.appSettings)
  const isDark = appSettings.theme === 'dark'
  
  const handleOpenInCursor = () => {
    handleOpenPath(project.localPath, 'cursor')
  }

  const handleOpenInExplorer = () => {
    handleOpenPath(project.localPath, 'explorer')
  }

  const handleOpenLiveUrl = () => {
    if (project.liveUrl) {
      window.open(project.liveUrl, '_blank')
    }
  }

  // Calculate progress from tasks with "done" status
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === 'done' || t.completed).length
  const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0)

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer',
        'bg-card border border-border',
        !isDark && 'card-shadow hover:card-shadow-lg'
      )}
      onClick={onSelect}
    >
      {/* Thumbnail Area */}
      <div className="aspect-video relative overflow-hidden bg-secondary">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-muted">
              <MonitorPlay className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <Badge
          className={cn(
            'absolute top-3 right-3 uppercase text-[10px] font-semibold tracking-wider border-0',
            project.status === 'live'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {project.status}
        </Badge>

        {/* Settings Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className={cn(
            "absolute top-3 left-3 w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all",
            isDark ? "bg-[#121212]/80" : "bg-white/90",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Overlay on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2",
          isDark ? "bg-[#121212]/90" : "bg-white/95"
        )}>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenInCursor()
            }}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            Cursor
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenInExplorer()
            }}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Explorer
          </Button>
          {project.liveUrl && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenLiveUrl()
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-foreground">{project.name}</h3>
            <p className="text-xs truncate mt-0.5 text-muted-foreground">
              {project.localPath}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenVault() }} className="cursor-pointer">
                <Key className="w-4 h-4 mr-2" />
                Open Vault
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenInCursor() }} className="cursor-pointer">
                <MonitorPlay className="w-4 h-4 mr-2" />
                Open in Cursor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenInExplorer() }} className="cursor-pointer">
                <FolderOpen className="w-4 h-4 mr-2" />
                Copy Path
              </DropdownMenuItem>
              {project.liveUrl && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenLiveUrl() }} className="cursor-pointer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Live URL
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete() }} className="cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium text-primary">{calculatedProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-muted">
            <div 
              className="h-full rounded-full transition-all duration-300 bg-primary"
              style={{ width: `${calculatedProgress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {project.credentials.length} credentials
            </span>
          </div>
          {/* Clickable Progress Circle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenTaskDrawer?.()
            }}
            className="flex items-center gap-1.5 transition-transform hover:scale-110"
            title="Open task drawer"
          >
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                className="stroke-muted"
                strokeWidth="2"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                className="stroke-primary"
                strokeWidth="2"
                strokeDasharray={`${(completedTasks / Math.max(totalTasks, 1)) * 50.3} 50.3`}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
