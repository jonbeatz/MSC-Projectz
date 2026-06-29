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
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/lib/types'

type TabType = 'inbox' | 'archived'

// Status configuration
const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; color: string; bgClass: string }> = {
  todo: {
    label: 'To Do',
    icon: Circle,
    color: 'text-muted-foreground',
    bgClass: 'bg-muted/50',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    color: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    color: 'text-primary',
    bgClass: 'bg-primary/10',
  },
}

export function GlobalTasksView() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox')
  const [quickAddText, setQuickAddText] = useState('')
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const projects = useAppStore((s) => s.projects)
  const cycleTaskStatus = useAppStore((s) => s.cycleTaskStatus)
  const updateTaskTitle = useAppStore((s) => s.updateTaskTitle)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const addTask = useAppStore((s) => s.addTask)
  const appSettings = useAppStore((s) => s.appSettings)

  const isDark = appSettings.theme === 'dark'

  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTaskId])

  // Get all incomplete tasks grouped by project (todo + in-progress)
  const inboxTasks = useMemo(() => {
    const grouped: Record<string, { projectId: string; projectName: string; tasks: Task[] }> = {}

    projects.forEach((project) => {
      const incompleteTasks = project.tasks.filter((t) => (t.status || 'todo') !== 'done' && !t.archived)
      if (incompleteTasks.length > 0) {
        grouped[project.id] = {
          projectId: project.id,
          projectName: project.name,
          tasks: incompleteTasks.map((t) => ({ ...t, status: t.status || 'todo' })),
        }
      }
    })

    return grouped
  }, [projects])

  // Get all done tasks grouped by project
  const archivedTasks = useMemo(() => {
    const grouped: Record<string, { projectId: string; projectName: string; tasks: Task[] }> = {}

    projects.forEach((project) => {
      const completedTasks = project.tasks.filter((t) => t.status === 'done' || t.archived)
      if (completedTasks.length > 0) {
        grouped[project.id] = {
          projectId: project.id,
          projectName: project.name,
          tasks: completedTasks.map((t) => ({ ...t, status: t.status || 'done' })),
        }
      }
    })

    return grouped
  }, [projects])

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const handleQuickAdd = () => {
    if (!quickAddText.trim() || projects.length === 0) return
    addTask(projects[0].id, quickAddText.trim())
    setQuickAddText('')
  }

  const handleCycleStatus = (projectId: string, taskId: string) => {
    cycleTaskStatus(projectId, taskId)
  }

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingText(task.title)
  }

  const handleSaveEdit = (projectId: string) => {
    if (!editingTaskId || !editingText.trim()) {
      setEditingTaskId(null)
      return
    }
    updateTaskTitle(projectId, editingTaskId, editingText.trim())
    setEditingTaskId(null)
    setEditingText('')
  }

  const inboxCount = Object.values(inboxTasks).reduce((sum, group) => sum + group.tasks.length, 0)
  const archivedCount = Object.values(archivedTasks).reduce((sum, group) => sum + group.tasks.length, 0)

  const renderTask = (task: Task, projectId: string) => {
    const status = task.status || 'todo'
    const config = statusConfig[status]
    const StatusIcon = config.icon
    const isDone = status === 'done'
    const isInProgress = status === 'in-progress'

    return (
      <div
        key={task.id}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 transition-all border-b border-border',
          'hover:bg-muted/50',
          isDone && 'opacity-60',
          isInProgress && 'bg-amber-500/5',
        )}
      >
        {/* Status Badge - Clickable */}
        <button
          onClick={() => handleCycleStatus(projectId, task.id)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:scale-105 flex-shrink-0',
            config.bgClass,
          )}
          title={`Status: ${config.label} (click to change)`}
        >
          <StatusIcon className={cn('w-3.5 h-3.5', config.color)} />
          <span className={cn('text-[10px] font-medium uppercase tracking-wider', config.color)}>{config.label}</span>
        </button>

        {/* Task Title - Editable */}
        {editingTaskId === task.id ? (
          <Input
            ref={editInputRef}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit(projectId)
              if (e.key === 'Escape') setEditingTaskId(null)
            }}
            onBlur={() => handleSaveEdit(projectId)}
            className="flex-1 h-8 text-sm bg-card border-primary text-foreground"
          />
        ) : (
          <span
            className={cn(
              'flex-1 cursor-pointer transition-colors hover:opacity-80 text-foreground',
              isDone && 'line-through text-muted-foreground',
            )}
            onClick={() => handleStartEdit(task)}
          >
            {task.title}
          </span>
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
            onClick={() => deleteTask(projectId, task.id)}
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground">Command center for all project tasks</p>
      </div>

      {/* Tabs */}
      <div className={cn('flex gap-1 p-1 rounded-lg w-fit bg-card border border-border', !isDark && 'card-shadow')}>
        <button
          onClick={() => setActiveTab('inbox')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'inbox'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Inbox className="w-4 h-4" />
          My Inbox
          {inboxCount > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs',
                activeTab === 'inbox' ? 'bg-black/20 text-primary-foreground' : 'bg-primary/20 text-primary',
              )}
            >
              {inboxCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'archived'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Archive className="w-4 h-4" />
          Done
          {archivedCount > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs',
                activeTab === 'archived' ? 'bg-black/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Add (Inbox only) */}
      {activeTab === 'inbox' && (
        <div className={cn('flex gap-2 p-4 rounded-xl bg-card border border-border', !isDark && 'card-shadow')}>
          <Input
            placeholder={projects.length > 0 ? `Quick add task to ${projects[0].name}...` : 'Add a project first...'}
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            disabled={projects.length === 0}
            className="text-base bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleQuickAdd}
            disabled={!quickAddText.trim() || projects.length === 0}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {activeTab === 'inbox' &&
          (Object.keys(inboxTasks).length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center py-16 rounded-xl bg-card border border-border',
                !isDark && 'card-shadow',
              )}
            >
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
                className={cn('rounded-xl overflow-hidden bg-card border border-border', !isDark && 'card-shadow')}
              >
                <button
                  onClick={() => toggleProjectExpanded(group.projectId)}
                  className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{group.projectName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                    </span>
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
          ))}

        {activeTab === 'archived' &&
          (Object.keys(archivedTasks).length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center py-16 rounded-xl bg-card border border-border',
                !isDark && 'card-shadow',
              )}
            >
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
                className={cn('rounded-xl overflow-hidden bg-card border border-border', !isDark && 'card-shadow')}
              >
                <button
                  onClick={() => toggleProjectExpanded(group.projectId)}
                  className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-muted-foreground">{group.projectName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {group.tasks.length} done
                    </span>
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
          ))}
      </div>
    </div>
  )
}
