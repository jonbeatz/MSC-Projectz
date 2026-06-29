'use client'

import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react'
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
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  Flag,
  Check,
  X,
  ListFilter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MSC_Projectz_TaskAssigneeSelect, msc_resolveTaskAssignee } from '@/components/MSC-Projectz-TaskAssignee'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getSafePath } from '@/lib/env-utils'
import { MSC_TASK_STATUS_LABELS } from '@/lib/msc_task_status_labels'
import type { MscTaskPriority, Task, TaskStatus } from '@/lib/types'

const MSC_TASKS_LAYOUT_KEY = 'msc-tasks-layout-mode'

function msc_escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function msc_highlightTitle(text: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return text
  const parts = text.split(new RegExp(`(${msc_escapeRegExp(q)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="rounded bg-msc-ui-accent/25 px-0.5 text-sky-50">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function msc_taskMatchesQuery(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (task.title.toLowerCase().includes(q)) return true
  if (task.description?.toLowerCase().includes(q)) return true
  return false
}

function msc_formatDueShort(d: Date | string | null | undefined): string | null {
  if (d == null) return null
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function msc_priorityPill(p: MscTaskPriority | undefined): { label: string; className: string } {
  const pr = p ?? 'normal'
  if (pr === 'high')
    return {
      label: 'High',
      className: 'border border-red-400/30 bg-red-500/15 text-red-100/95',
    }
  if (pr === 'low')
    return {
      label: 'Low',
      className: 'border border-emerald-400/25 bg-emerald-500/12 text-emerald-50/95',
    }
  return {
    label: 'Medium',
    className: 'border border-msc-ui-accent/30 bg-msc-ui-accent/14 text-sky-50/95',
  }
}

function msc_taskPassesPriorityFilter(task: Task, f: 'all' | MscTaskPriority): boolean {
  if (f === 'all') return true
  return (task.priority ?? 'normal') === f
}

type TabType = 'inbox' | 'archived'

// Status configuration (DB values todo | in-progress | done; display via MSC_TASK_STATUS_LABELS)
const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; color: string; bgClass: string }> = {
  todo: {
    label: MSC_TASK_STATUS_LABELS.todo,
    icon: Circle,
    color: 'text-muted-foreground',
    bgClass: 'bg-muted/50',
  },
  'in-progress': {
    label: MSC_TASK_STATUS_LABELS['in-progress'],
    icon: Clock,
    color: 'text-msc-ui-accent',
    bgClass: 'bg-transparent',
  },
  done: {
    label: MSC_TASK_STATUS_LABELS.done,
    icon: CheckCircle2,
    color: 'text-primary',
    bgClass: 'bg-primary/10',
  },
}

type TasksLayoutMode = 'board' | 'list'

export function GlobalTasksView() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox')
  const [layoutMode, setLayoutMode] = useState<TasksLayoutMode>('board')
  const [taskSearch, setTaskSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | MscTaskPriority>('all')
  const [projectInfoOpen, setProjectInfoOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [quickAddText, setQuickAddText] = useState('')
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MSC_TASKS_LAYOUT_KEY)
      if (raw === 'board' || raw === 'list') setLayoutMode(raw)
    } catch {
      /* ignore */
    }
  }, [])

  const persistLayoutMode = (mode: TasksLayoutMode) => {
    setLayoutMode(mode)
    try {
      localStorage.setItem(MSC_TASKS_LAYOUT_KEY, mode)
    } catch {
      /* ignore */
    }
  }

  const selectedProject = useMemo(() => {
    if (projects.length === 0) return null
    return projects.find((project) => project.id === selectedProjectId) ?? projects[0]
  }, [projects, selectedProjectId])

  const activeProjects = useMemo(() => (selectedProject ? [selectedProject] : []), [selectedProject])

  const visibleProjectTasks = selectedProject?.tasks.filter((task) => !task.archived) ?? []
  const totalProjectTasks = visibleProjectTasks.length
  const completedProjectTasks = visibleProjectTasks.filter((task) => task.status === 'done' || task.completed).length
  const projectProgress =
    totalProjectTasks > 0
      ? Math.round((completedProjectTasks / totalProjectTasks) * 100)
      : (selectedProject?.progress ?? 0)

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

  // Get all incomplete tasks grouped by project (todo + in-progress)
  const inboxTasks = useMemo(() => {
    const grouped: Record<
      string,
      { projectId: string; projectName: string; projectThumbnail?: string; tasks: Task[] }
    > = {}

    activeProjects.forEach((project) => {
      const incompleteTasks = project.tasks.filter((t) => (t.status || 'todo') !== 'done' && !t.archived)
      if (incompleteTasks.length > 0) {
        grouped[project.id] = {
          projectId: project.id,
          projectName: project.name,
          projectThumbnail: project.thumbnail,
          tasks: incompleteTasks.map((t) => ({ ...t, status: t.status || 'todo' })),
        }
      }
    })

    return grouped
  }, [activeProjects])

  // Get all done tasks grouped by project
  const archivedTasks = useMemo(() => {
    const grouped: Record<
      string,
      { projectId: string; projectName: string; projectThumbnail?: string; tasks: Task[] }
    > = {}

    activeProjects.forEach((project) => {
      const completedTasks = project.tasks.filter((t) => t.status === 'done' || t.archived)
      if (completedTasks.length > 0) {
        grouped[project.id] = {
          projectId: project.id,
          projectName: project.name,
          projectThumbnail: project.thumbnail,
          tasks: completedTasks.map((t) => ({ ...t, status: t.status || 'done' })),
        }
      }
    })

    return grouped
  }, [activeProjects])

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
        <img src={thumbnail} className="h-9 w-9 rounded-md border border-white/10 object-cover" alt={projectName} />
      )
    }

    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/40">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  const renderTaskCompactRow = (task: Task, projectId: string, opts: { archived?: boolean }) => {
    const taskProject = projects.find((project) => project.id === projectId)
    const status = task.status || 'todo'
    const config = statusConfig[status]
    const StatusIcon = config.icon
    const isDone = status === 'done' || Boolean(task.archived) || opts.archived
    const dueLabel = msc_formatDueShort(task.dueDate ?? null)
    const pri = msc_priorityPill(task.priority)
    const assignee = taskProject ? msc_resolveTaskAssignee(taskProject, task) : null
    const assigneeLabel = assignee
      ? assignee.username?.trim() || assignee.email?.trim() || `User ${String(assignee.id)}`
      : null

    if (editingTaskId === task.id) {
      return (
        <div
          key={task.id}
          className={cn(
            'border-b border-white/6 bg-black/35 px-3 py-2.5 last:border-b-0',
            !isDark && 'border-border bg-muted/30',
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <Input
              ref={editInputRef}
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(projectId)
                if (e.key === 'Escape') setEditingTaskId(null)
              }}
              className={cn(
                'h-8 min-w-0 flex-1 text-sm',
                isDark ? 'border-msc-ui-accent/35 bg-black/50 text-foreground' : 'border-border bg-card',
              )}
            />
            {taskProject && (
              <MSC_Projectz_TaskAssigneeSelect
                project={taskProject}
                value={editingAssignedToId}
                onChange={setEditingAssignedToId}
              />
            )}
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 bg-primary px-3 text-xs text-primary-foreground"
              onClick={() => void handleSaveEdit(projectId)}
            >
              Save
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={task.id}
        className={cn(
          'group flex items-center gap-2.5 border-b border-white/6 px-2.5 py-2 transition-colors last:border-b-0',
          isDark ? 'hover:bg-white/5' : 'hover:bg-muted/40',
          isDone && 'opacity-70',
        )}
      >
        <button
          type="button"
          onClick={() => void handleCycleStatus(projectId, task.id)}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
            isDone
              ? 'border-primary/40 bg-primary/15 text-primary'
              : status === 'in-progress'
                ? 'border-msc-ui-accent/35 bg-msc-ui-accent/12 text-sky-100'
                : isDark
                  ? 'border-white/10 bg-black/40 text-muted-foreground hover:border-white/18'
                  : 'border-border bg-muted/50 text-muted-foreground',
          )}
          title={`${config.label} — click to advance`}
        >
          {isDone ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          ) : (
            <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <button
              type="button"
              onClick={() => handleStartEdit(task)}
              className={cn(
                'min-w-0 truncate text-left text-[13px] font-medium leading-tight text-foreground hover:text-msc-ui-accent/95',
                isDone && 'text-muted-foreground line-through',
              )}
            >
              {msc_highlightTitle(task.title, taskSearch)}
            </button>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                pri.className,
              )}
            >
              <Flag className="h-2.5 w-2.5 opacity-80" aria-hidden />
              {pri.label}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <StatusIcon className="h-3 w-3 opacity-70" aria-hidden />
              {config.label}
            </span>
            <span className="text-white/15" aria-hidden>
              ·
            </span>
            {dueLabel ? (
              <span className="inline-flex items-center gap-0.5">
                <CalendarDays className="h-3 w-3 opacity-60" aria-hidden />
                {dueLabel}
              </span>
            ) : (
              <span>No due date</span>
            )}
            {assigneeLabel ? (
              <>
                <span className="text-white/15" aria-hidden>
                  ·
                </span>
                <span className="truncate">Assigned: {assigneeLabel}</span>
              </>
            ) : null}
            {task.description?.trim() ? (
              <>
                <span className="text-white/15" aria-hidden>
                  ·
                </span>
                <span className="max-w-[14rem] truncate opacity-90">{task.description.trim()}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => handleStartEdit(task)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void deleteTask(projectId, task.id)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-destructive"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const renderBoardColumns = (group: { projectId: string; projectName: string; tasks: Task[] }) => {
    const filtered = group.tasks.filter(
      (t) => msc_taskMatchesQuery(t, taskSearch) && msc_taskPassesPriorityFilter(t, priorityFilter),
    )
    const todo = filtered.filter((t) => (t.status || 'todo') === 'todo')
    const active = filtered.filter((t) => (t.status || 'todo') === 'in-progress')

    const col = (title: string, items: Task[], tone: 'todo' | 'active') => (
      <div
        key={`${group.projectId}-${title}`}
        className={cn(
          'msc-tasks-workspace-slab flex min-h-40 flex-col overflow-hidden rounded-lg',
          !isDark && 'border-border bg-card',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-2 border-b px-2.5 py-2',
            isDark ? 'border-white/6 bg-black/30' : 'border-border bg-muted/30',
          )}
        >
          <h3 className="text-xs font-semibold tracking-tight text-foreground">{title}</h3>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
              tone === 'active' ? 'bg-msc-ui-accent/15 text-sky-100' : 'bg-white/5 text-muted-foreground',
            )}
          >
            {items.length}
          </span>
        </div>
        <div className="flex flex-col">
          {items.length === 0 ? (
            <p className="px-3 py-5 text-center text-[11px] text-muted-foreground">Nothing here</p>
          ) : (
            items.map((task) => renderTaskCompactRow(task, group.projectId, {}))
          )}
        </div>
      </div>
    )

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {col(MSC_TASK_STATUS_LABELS.todo, todo, 'todo')}
        {col(MSC_TASK_STATUS_LABELS['in-progress'], active, 'active')}
      </div>
    )
  }

  const renderListStack = (group: { projectId: string; projectName: string; tasks: Task[] }) => {
    const filtered = group.tasks.filter(
      (t) => msc_taskMatchesQuery(t, taskSearch) && msc_taskPassesPriorityFilter(t, priorityFilter),
    )
    const todo = filtered.filter((t) => (t.status || 'todo') === 'todo')
    const active = filtered.filter((t) => (t.status || 'todo') === 'in-progress')

    const block = (label: string, items: Task[]) =>
      items.length === 0 ? null : (
        <div key={label} className="space-y-1.5">
          <h4 className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</h4>
          <div
            className={cn('msc-tasks-workspace-slab overflow-hidden rounded-lg', !isDark && 'border-border bg-card')}
          >
            {items.map((task) => renderTaskCompactRow(task, group.projectId, {}))}
          </div>
        </div>
      )

    return (
      <div className="space-y-5">
        {block(MSC_TASK_STATUS_LABELS.todo, todo)}
        {block(MSC_TASK_STATUS_LABELS['in-progress'], active)}
        {todo.length === 0 && active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-black/15 px-4 py-10 text-center text-sm text-muted-foreground">
            No tasks match your search.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={cn('msc-tasks-route flex min-h-screen flex-col gap-6 px-4 py-6 sm:px-6')}
      data-msc-component="global-tasks-view"
    >
      <header
        className={cn(
          'flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-start lg:justify-between',
          isDark ? 'msc-cc-header-glass border-white/8' : 'border-border bg-card card-shadow',
        )}
      >
        <div>
          <nav
            className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground/80">{selectedProject?.name ?? 'No Project'}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="font-medium text-msc-ui-accent">Tasks</span>
          </nav>
          <h1 className="mb-0.5 text-xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            {selectedProject
              ? `Compact board for ${selectedProject.name} — search, filter priority, track status.`
              : 'Select or create a project to manage tasks.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-white/8 bg-black/35 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Inbox <span className="ml-1 tabular-nums text-foreground">{inboxCount}</span>
            </span>
            <span className="rounded-md border border-white/8 bg-black/35 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {MSC_TASK_STATUS_LABELS.done} <span className="ml-1 tabular-nums text-foreground">{archivedCount}</span>
            </span>
          </div>
        </div>

        {projects.length > 1 && (
          <label className="flex min-w-[220px] flex-col gap-1 text-[11px] font-medium text-muted-foreground">
            Active project
            <Select value={selectedProject?.id ?? ''} onValueChange={setSelectedProjectId}>
              <SelectTrigger
                className={cn(
                  'h-9 w-full rounded-lg text-xs',
                  isDark ? 'border-white/10 bg-black/40 text-foreground' : 'border-border bg-card',
                )}
              >
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </header>

      <section
        className={cn(
          'overflow-hidden rounded-lg border',
          isDark ? 'msc-tasks-workspace-slab border-white/6' : 'border-border bg-card card-shadow',
        )}
        aria-label="Project Info"
      >
        <button
          type="button"
          onClick={() => setProjectInfoOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors',
            isDark ? 'hover:bg-white/5' : 'hover:bg-muted/40',
          )}
          aria-expanded={projectInfoOpen}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
            <h2 className="truncate text-xs font-semibold text-foreground">
              {selectedProject?.name ?? 'No active project'}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {selectedProject && (
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                  selectedProject.status === 'live'
                    ? 'border border-primary/25 bg-primary/12 text-primary'
                    : 'border border-white/8 bg-black/40 text-muted-foreground',
                )}
              >
                {selectedProject.status}
              </span>
            )}
            <ChevronDown
              className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', !projectInfoOpen && '-rotate-90')}
            />
          </div>
        </button>

        {projectInfoOpen && (
          <dl
            className={cn(
              'grid gap-2 border-t px-3 py-2.5 text-xs md:grid-cols-3',
              isDark ? 'border-white/6 bg-black/35' : 'border-border bg-muted/20',
            )}
          >
            <div
              className={cn(
                'rounded-md border p-2',
                isDark ? 'border-white/6 bg-black/40' : 'border-border bg-background/60',
              )}
            >
              <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Local path</dt>
              <dd
                className="mt-0.5 truncate text-[11px] text-foreground"
                title={selectedProject ? getSafePath(selectedProject.localPath) || undefined : undefined}
              >
                {selectedProject ? getSafePath(selectedProject.localPath) || 'Not configured' : 'Not configured'}
              </dd>
            </div>
            <div
              className={cn(
                'rounded-md border p-2',
                isDark ? 'border-white/6 bg-black/40' : 'border-border bg-background/60',
              )}
            >
              <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Live URL</dt>
              <dd className="mt-0.5 truncate text-[11px] text-foreground" title={selectedProject?.liveUrl || undefined}>
                {selectedProject?.liveUrl || 'Not configured'}
              </dd>
            </div>
            <div
              className={cn(
                'rounded-md border p-2',
                isDark ? 'border-white/6 bg-black/40' : 'border-border bg-background/60',
              )}
            >
              <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Task progress</dt>
              <dd className="mt-0.5 text-[11px] font-medium text-msc-ui-accent">
                {completedProjectTasks}/{totalProjectTasks} · {projectProgress}%
              </dd>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/8">
                <div
                  className="h-full rounded-full bg-linear-to-r from-msc-ui-accent to-sky-300 transition-all duration-300 shadow-[0_0_10px_rgba(89,158,222,0.35)]"
                  style={{ width: `${projectProgress}%` }}
                />
              </div>
            </div>
          </dl>
        )}
      </section>

      <section
        className={cn(
          'space-y-4 rounded-lg border p-4',
          isDark ? 'msc-tasks-workspace-panel border-white/6' : 'border-border bg-background/30 card-shadow',
        )}
        aria-label="Task workspace"
      >
        <div className={cn('flex flex-col gap-3 border-b pb-4', isDark ? 'border-white/6' : 'border-border')}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Library</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Search and narrow like a file index.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks by title or notes…"
              className={cn(
                'h-9 rounded-lg border pl-9 pr-9 text-xs',
                isDark
                  ? 'border-white/8 bg-black/45 text-foreground placeholder:text-muted-foreground'
                  : 'border-border bg-card',
              )}
            />
            {taskSearch.trim() ? (
              <button
                type="button"
                onClick={() => setTaskSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Priority filters">
            <span className="mr-0.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <ListFilter className="h-3 w-3 opacity-70" aria-hidden />
              Priority
            </span>
            {(['all', 'high', 'normal', 'low'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPriorityFilter(key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors',
                  priorityFilter === key
                    ? isDark
                      ? 'border-msc-ui-accent/40 bg-msc-ui-accent/15 text-sky-50'
                      : 'border-primary bg-primary/15 text-primary'
                    : isDark
                      ? 'border-white/8 bg-black/35 text-muted-foreground hover:border-white/12 hover:text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
                )}
              >
                {key === 'all' ? 'All' : key === 'normal' ? 'Medium' : key[0].toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            {activeTab === 'inbox' && (
              <div
                className={cn(
                  'inline-flex gap-1 rounded-xl border p-1',
                  isDark ? 'border-white/10 bg-black/25' : 'border-border bg-muted/40',
                )}
                role="group"
                aria-label="Layout"
              >
                <button
                  type="button"
                  onClick={() => persistLayoutMode('board')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                    layoutMode === 'board'
                      ? isDark
                        ? 'bg-msc-ui-accent/25 text-sky-50'
                        : 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                  Board
                </button>
                <button
                  type="button"
                  onClick={() => persistLayoutMode('list')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                    layoutMode === 'list'
                      ? isDark
                        ? 'bg-msc-ui-accent/25 text-sky-50'
                        : 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <List className="h-3.5 w-3.5" aria-hidden />
                  List
                </button>
              </div>
            )}
            <div
              className={cn(
                'inline-flex flex-1 flex-wrap gap-1 rounded-xl border p-1 lg:justify-end',
                isDark ? 'border-white/10 bg-black/25' : 'border-border bg-muted/40',
              )}
              role="tablist"
              aria-label="Task queue"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'inbox'}
                onClick={() => setActiveTab('inbox')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                  activeTab === 'inbox'
                    ? isDark
                      ? 'bg-white/12 text-foreground'
                      : 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Inbox className="h-3.5 w-3.5" aria-hidden />
                Inbox
                {inboxCount > 0 && (
                  <span className="rounded-md bg-black/25 px-1.5 py-0.5 tabular-nums text-[10px]">{inboxCount}</span>
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'archived'}
                onClick={() => setActiveTab('archived')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                  activeTab === 'archived'
                    ? isDark
                      ? 'bg-white/12 text-foreground'
                      : 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Archive className="h-3.5 w-3.5" aria-hidden />
                {MSC_TASK_STATUS_LABELS.done}
                {archivedCount > 0 && (
                  <span className="rounded-md bg-black/20 px-1.5 py-0.5 tabular-nums text-[10px] text-muted-foreground">
                    {archivedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'inbox' && (
          <div
            className={cn(
              'flex flex-col gap-2 rounded-lg border p-2.5 sm:flex-row sm:items-stretch',
              isDark ? 'msc-tasks-workspace-slab border-white/6' : 'border-border bg-card',
            )}
          >
            <Input
              placeholder={selectedProject ? `Quick add to ${selectedProject.name}…` : 'Add a project first…'}
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleQuickAdd()}
              disabled={!selectedProject}
              className={cn(
                'h-9 flex-1 rounded-md border text-xs',
                isDark ? 'border-white/8 bg-black/45' : 'border-border bg-background',
              )}
            />
            <Button
              type="button"
              onClick={() => void handleQuickAdd()}
              disabled={!quickAddText.trim() || !selectedProject}
              className="h-9 shrink-0 gap-1 rounded-md bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add task
            </Button>
          </div>
        )}

        <div className="space-y-5">
          {activeTab === 'inbox' &&
            (Object.keys(inboxTasks).length === 0 ? (
              <div
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center',
                  isDark ? 'border-dashed border-white/15 bg-black/20' : 'border-dashed border-border bg-muted/20',
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border',
                    isDark ? 'border-white/10 bg-white/5' : 'border-border bg-card',
                  )}
                >
                  <Inbox className="h-8 w-8 text-primary" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Inbox zero</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  No open tasks for this project. Use quick add or the dashboard to create work.
                </p>
              </div>
            ) : (
              Object.values(inboxTasks).map((group) => (
                <div key={group.projectId} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {renderProjectThumbnail(group.projectThumbnail, group.projectName)}
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-foreground">{group.projectName}</h2>
                      <p className="text-[11px] text-muted-foreground">
                        {group.tasks.length} open task{group.tasks.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {layoutMode === 'board' ? renderBoardColumns(group) : renderListStack(group)}
                </div>
              ))
            ))}

          {activeTab === 'archived' &&
            (Object.keys(archivedTasks).length === 0 ? (
              <div
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center',
                  isDark ? 'border-dashed border-white/15 bg-black/20' : 'border-dashed border-border bg-muted/20',
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border',
                    isDark ? 'border-white/10 bg-white/5' : 'border-border bg-card',
                  )}
                >
                  <Archive className="h-8 w-8 text-muted-foreground" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">No completed tasks</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Finished work lands here. Advance status from the inbox cards.
                </p>
              </div>
            ) : (
              Object.values(archivedTasks).map((group) => {
                const filtered = group.tasks.filter(
                  (t) => msc_taskMatchesQuery(t, taskSearch) && msc_taskPassesPriorityFilter(t, priorityFilter),
                )
                return (
                  <div key={group.projectId} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {renderProjectThumbnail(group.projectThumbnail, group.projectName)}
                      <div>
                        <h2 className="text-base font-semibold tracking-tight text-muted-foreground">
                          {group.projectName}
                        </h2>
                        <p className="text-[11px] text-muted-foreground">
                          {filtered.length} completed / archived
                          {(taskSearch.trim() || priorityFilter !== 'all') && filtered.length !== group.tasks.length
                            ? ` (filtered from ${group.tasks.length})`
                            : ''}
                        </p>
                      </div>
                    </div>
                    {filtered.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center text-xs text-muted-foreground">
                        No tasks match filters.
                      </p>
                    ) : (
                      <div
                        className={cn(
                          'msc-tasks-workspace-slab overflow-hidden rounded-lg',
                          !isDark && 'border-border bg-card',
                        )}
                      >
                        {filtered.map((task) => renderTaskCompactRow(task, group.projectId, { archived: true }))}
                      </div>
                    )}
                  </div>
                )
              })
            ))}
        </div>
      </section>
    </div>
  )
}
