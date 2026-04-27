'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { 
  Inbox, 
  Archive, 
  Plus, 
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Circle,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MSC_Projectz_TaskAssigneeBadge, MSC_Projectz_TaskAssigneeSelect } from '@/components/MSC-Projectz-TaskAssignee'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getSafePath } from '@/lib/env-utils'
import type { Task, TaskStatus } from '@/lib/types'

type TabType = 'inbox' | 'archived'

// Status configuration
const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; color: string; bgClass: string }> = {
  'todo': { 
    label: 'To Do', 
    icon: Circle, 
    color: 'text-muted-foreground',
    bgClass: 'bg-muted/50'
  },
  'in-progress': { 
    label: 'In Progress', 
    icon: Clock, 
    color: 'text-msc-gold',
    bgClass: 'bg-transparent'
  },
  'done': { 
    label: 'Done', 
    icon: CheckCircle2, 
    color: 'text-primary',
    bgClass: 'bg-primary/10'
  },
}

export function GlobalTasksView() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox')
  const [projectInfoOpen, setProjectInfoOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [quickAddText, setQuickAddText] = useState('')
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingAssignedToId, setEditingAssignedToId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  
  const projects = useAppStore((s) => s.projects)
  const cycleTaskStatus = useAppStore((s) => s.cycleTaskStatus)
  const updateTaskTitle = useAppStore((s) => s.updateTaskTitle)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const addTask = useAppStore((s) => s.addTask)
  const appSettings = useAppStore((s) => s.appSettings)
  
  const isDark = appSettings.theme === 'dark'

  const selectedProject = useMemo(() => {
    if (projects.length === 0) return null
    return projects.find((project) => project.id === selectedProjectId) ?? projects[0]
  }, [projects, selectedProjectId])

  const activeProjects = useMemo(() => (selectedProject ? [selectedProject] : []), [selectedProject])

  const visibleProjectTasks = selectedProject?.tasks.filter((task) => !task.archived) ?? []
  const totalProjectTasks = visibleProjectTasks.length
  const completedProjectTasks =
    visibleProjectTasks.filter((task) => task.status === 'done' || task.completed).length
  const projectProgress =
    totalProjectTasks > 0 ? Math.round((completedProjectTasks / totalProjectTasks) * 100) : selectedProject?.progress ?? 0
  
  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTaskId])

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId(null)
      return
    }
    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProject?.id) {
      setExpandedProjects([selectedProject.id])
    } else {
      setExpandedProjects([])
    }
  }, [selectedProject?.id])
  
  // Get all incomplete tasks grouped by project (todo + in-progress)
  const inboxTasks = useMemo(() => {
    const grouped: Record<string, { projectId: string; projectName: string; projectThumbnail?: string; tasks: Task[] }> = {}
    
    activeProjects.forEach((project) => {
      const incompleteTasks = project.tasks.filter((t) => 
        (t.status || 'todo') !== 'done' && !t.archived
      )
      if (incompleteTasks.length > 0) {
        grouped[project.id] = {
          projectId: project.id,
          projectName: project.name,
          projectThumbnail: project.thumbnail,
          tasks: incompleteTasks.map(t => ({ ...t, status: t.status || 'todo' })),
        }
      }
    })
    
    return grouped
  }, [activeProjects])
  
  // Get all done tasks grouped by project
  const archivedTasks = useMemo(() => {
    const grouped: Record<string, { projectId: string; projectName: string; projectThumbnail?: string; tasks: Task[] }> = {}
    
    activeProjects.forEach((project) => {
      const completedTasks = project.tasks.filter((t) => t.status === 'done' || t.archived)
      if (completedTasks.length > 0) {
        grouped[project.id] = {
          projectId: project.id,
          projectName: project.name,
          projectThumbnail: project.thumbnail,
          tasks: completedTasks.map(t => ({ ...t, status: t.status || 'done' })),
        }
      }
    })
    
    return grouped
  }, [activeProjects])
  
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects((prev) => 
      prev.includes(projectId) 
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    )
  }
  
  const handleQuickAdd = async () => {
    if (!quickAddText.trim() || !selectedProject) return
    await addTask(selectedProject.id, quickAddText.trim())
    setQuickAddText('')
  }

  const handleCycleStatus = async (projectId: string, taskId: string) => {
    await cycleTaskStatus(projectId, taskId)
  }
  
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingText(task.title)
    setEditingAssignedToId(task.assignedTo ? String(task.assignedTo.id) : null)
  }
  
  const handleSaveEdit = async (projectId: string) => {
    if (!editingTaskId || !editingText.trim()) {
      setEditingTaskId(null)
      return
    }
    await updateTaskTitle(projectId, editingTaskId, editingText.trim(), editingAssignedToId)
    setEditingTaskId(null)
    setEditingText('')
    setEditingAssignedToId(null)
  }
  
  const inboxCount = Object.values(inboxTasks).reduce((sum, group) => sum + group.tasks.length, 0)
  const archivedCount = Object.values(archivedTasks).reduce((sum, group) => sum + group.tasks.length, 0)

  const renderProjectThumbnail = (thumbnail: string | undefined, projectName: string) => {
    if (thumbnail) {
      return (
        <img
          src={thumbnail}
          className="h-12 w-12 rounded-lg border border-zinc-700 object-cover shadow-sm"
          alt={projectName}
        />
      )
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
        <FolderOpen className="h-6 w-6 text-zinc-400" />
      </div>
    )
  }

  const renderTask = (task: Task, projectId: string) => {
    const taskProject = projects.find((project) => project.id === projectId)
    const status = task.status || 'todo'
    const config = statusConfig[status]
    const StatusIcon = config.icon
    const isDone = status === 'done'
    
    return (
      <div 
        key={task.id}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 transition-all border-b border-border',
          'hover:bg-muted/50',
          isDone && 'opacity-60'
        )}
      >
        {/* Status Badge - Clickable */}
        <button
          type="button"
          onClick={() => void handleCycleStatus(projectId, task.id)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:scale-105 shrink-0",
            config.bgClass
          )}
          title={`Status: ${config.label} (click to change)`}
        >
          <StatusIcon className={cn("w-3.5 h-3.5", config.color)} />
          <span className={cn("text-[10px] font-medium uppercase tracking-wider", config.color)}>
            {config.label}
          </span>
        </button>
        
        {/* Task Title - Editable */}
        {editingTaskId === task.id ? (
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <Input
              ref={editInputRef}
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(projectId)
                if (e.key === 'Escape') setEditingTaskId(null)
              }}
              className="h-8 min-w-[180px] flex-1 text-sm bg-card border-primary text-foreground"
            />
            {taskProject && (
              <MSC_Projectz_TaskAssigneeSelect
                project={taskProject}
                value={editingAssignedToId}
                onChange={setEditingAssignedToId}
              />
            )}
            <Button type="button" size="sm" className="h-8 bg-primary text-primary-foreground" onClick={() => void handleSaveEdit(projectId)}>
              Save Task
            </Button>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span
              className={cn(
                'min-w-[120px] flex-1 cursor-pointer transition-colors hover:opacity-80 text-foreground',
                isDone && 'line-through text-muted-foreground'
              )}
              onClick={() => handleStartEdit(task)}
            >
              {task.title}
            </span>
            {taskProject && <MSC_Projectz_TaskAssigneeBadge project={taskProject} task={task} />}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleStartEdit(task)}
            className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void deleteTask(projectId, task.id)}
            className="p-1.5 rounded transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Project Switcher */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground/80">{selectedProject?.name ?? 'No Project'}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-primary">Tasks</span>
          </nav>
          <h1 className="text-2xl font-semibold mb-1 text-foreground">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Focused command center for the active project task list.
          </p>
        </div>

        {projects.length > 1 && (
          <label className="flex min-w-[240px] flex-col gap-1 text-xs text-muted-foreground">
            Active Project
            <Select value={selectedProject?.id ?? ''} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full rounded-lg border-border bg-card text-sm text-foreground focus-visible:ring-primary">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="focus:bg-primary focus:text-primary-foreground">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>

      {/* Project Info */}
      <section
        className={cn(
          'rounded-xl border border-border bg-card p-3',
          !isDark && 'card-shadow',
        )}
        aria-label="Project Info"
      >
        <button
          type="button"
          onClick={() => setProjectInfoOpen((v) => !v)}
          className="mb-3 flex w-full items-center justify-between gap-2 border-b border-border pb-2 text-left"
          aria-expanded={projectInfoOpen}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project Info
            </p>
            <h2 className="mt-0.5 text-sm font-medium text-foreground">
              {selectedProject?.name ?? 'No active project'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedProject && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                  selectedProject.status === 'live'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {selectedProject.status}
              </span>
            )}
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !projectInfoOpen && '-rotate-90')} />
          </div>
        </button>

        {projectInfoOpen && <dl className="grid gap-2 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/40 p-2.5">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Local Path</dt>
            <dd className="mt-0.5 truncate text-sm text-foreground" title={selectedProject ? getSafePath(selectedProject.localPath) || undefined : undefined}>
              {selectedProject ? getSafePath(selectedProject.localPath) || 'Not configured' : 'Not configured'}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-2.5">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Live URL</dt>
            <dd className="mt-0.5 truncate text-sm text-foreground" title={selectedProject?.liveUrl || undefined}>
              {selectedProject?.liveUrl || 'Not configured'}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-2.5">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Task Progress</dt>
            <dd className="mt-0.5 text-msc-gold font-medium">
              {completedProjectTasks}/{totalProjectTasks} complete · {projectProgress}%
            </dd>
            <div className="mt-1.5 h-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-msc-gold transition-all duration-300"
                style={{ width: `${projectProgress}%` }}
              />
            </div>
          </div>
        </dl>}
      </section>

      {/* Task List */}
      <section
        className={cn(
          'space-y-4 rounded-xl border border-border bg-background/30 p-4',
          !isDark && 'card-shadow',
        )}
        aria-label="Task List"
      >
        <div className="flex flex-col gap-1 border-b border-border pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Task List
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedProject
              ? `Tasks currently scoped to ${selectedProject.name}.`
              : 'Select or create a project to manage tasks.'}
          </p>
        </div>

      {/* Tabs */}
      <div className={cn(
        'flex gap-1 p-1 rounded-lg w-fit bg-card border border-border',
        !isDark && 'card-shadow'
      )}>
        <button
          onClick={() => setActiveTab('inbox')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'inbox' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="w-4 h-4" />
          My Inbox
          {inboxCount > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-xs",
              activeTab === 'inbox' 
                ? "bg-black/20 text-primary-foreground" 
                : "bg-primary/20 text-primary"
            )}>
              {inboxCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'archived' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="w-4 h-4" />
          Done
          {archivedCount > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-xs",
              activeTab === 'archived' 
                ? "bg-black/20 text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Add (Inbox only) */}
      {activeTab === 'inbox' && (
        <div className={cn(
          'flex gap-2 p-4 rounded-xl bg-card border border-border',
          !isDark && 'card-shadow'
        )}>
          <Input
            placeholder={selectedProject ? `Quick add task to ${selectedProject.name}...` : 'Add a project first...'}
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleQuickAdd()}
            disabled={!selectedProject}
            className="text-base bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            onClick={() => void handleQuickAdd()}
            disabled={!quickAddText.trim() || !selectedProject}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {activeTab === 'inbox' && (
          Object.keys(inboxTasks).length === 0 ? (
            <div className={cn(
              'flex flex-col items-center justify-center py-16 rounded-xl bg-card border border-border',
              !isDark && 'card-shadow'
            )}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-secondary">
                <Inbox className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium mb-1 text-foreground">Inbox Zero</h3>
              <p className="text-sm text-center max-w-xs text-muted-foreground">
                No pending tasks. Add tasks from project cards or use Quick Add above.
              </p>
            </div>
          ) : (
            Object.values(inboxTasks).map((group) => (
              <div 
                key={group.projectId}
                className={cn(
                  'rounded-xl overflow-hidden bg-card border border-border',
                  !isDark && 'card-shadow'
                )}
              >
                <button
                  onClick={() => toggleProjectExpanded(group.projectId)}
                  className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 p-2 text-left">
                    {renderProjectThumbnail(group.projectThumbnail, group.projectName)}
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">{group.projectName}</h2>
                      <span className="mt-1 inline-flex rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {expandedProjects.includes(group.projectId) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {expandedProjects.includes(group.projectId) && (
                  <div className="border-t border-border">
                        {group.tasks.map((task) => renderTask(task, group.projectId))}
                  </div>
                )}
              </div>
            ))
          )
        )}

        {activeTab === 'archived' && (
          Object.keys(archivedTasks).length === 0 ? (
            <div className={cn(
              'flex flex-col items-center justify-center py-16 rounded-xl bg-card border border-border',
              !isDark && 'card-shadow'
            )}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-secondary">
                <Archive className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1 text-foreground">No Completed Tasks</h3>
              <p className="text-sm text-center max-w-xs text-muted-foreground">
                Tasks marked as Done will appear here.
              </p>
            </div>
          ) : (
            Object.values(archivedTasks).map((group) => (
              <div 
                key={group.projectId}
                className={cn(
                  'rounded-xl overflow-hidden bg-card border border-border',
                  !isDark && 'card-shadow'
                )}
              >
                <button
                  onClick={() => toggleProjectExpanded(group.projectId)}
                  className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 p-2 text-left">
                    {renderProjectThumbnail(group.projectThumbnail, group.projectName)}
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">{group.projectName}</h2>
                      <span className="mt-1 inline-flex rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {group.tasks.length} done
                      </span>
                    </div>
                  </div>
                  {expandedProjects.includes(group.projectId) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {expandedProjects.includes(group.projectId) && (
                  <div className="border-t border-border">
                        {group.tasks.map((task) => renderTask(task, group.projectId))}
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
      </section>
    </div>
  )
}

