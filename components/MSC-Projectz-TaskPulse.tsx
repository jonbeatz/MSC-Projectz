'use client'

import { useMemo, useState } from 'react'
import { Activity, Plus, Trash2, ChevronRight, CircleDot, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MSC_Projectz_TaskAssigneeBadge } from '@/components/MSC-Projectz-TaskAssignee'
import { useAppStore } from '@/lib/store'
import type { Project, Task, TaskStatus } from '@/lib/types'

const MSC_TASK_PULSE_COLUMNS: { status: TaskStatus; label: string; description: string }[] = [
  { status: 'todo', label: 'Queue', description: 'Awaiting triage' },
  { status: 'in-progress', label: 'Active', description: 'In execution' },
  { status: 'done', label: 'Stabilized', description: 'Closed loop' },
]

function msc_formatTaskPulseDate(d: Date): string {
  try {
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(d)
  }
}

function msc_taskPulseHealth(tasks: Task[]): string {
  const q = tasks.filter((t) => t.status === 'todo').length
  const a = tasks.filter((t) => t.status === 'in-progress').length
  if (a > 0) return 'In motion'
  if (q > 4) return 'Backlog pressure'
  if (tasks.length > 0 && tasks.every((t) => t.status === 'done')) return 'All channels nominal'
  return 'Nominal'
}

interface MSC_Projectz_TaskPulseProps {
  project: Project
}

/**
 * High-fidelity Task Pulse: Kanban (Queue / Active / Stabilized) + Vader Telemetry.
 * Status changes flow through the store → `msc_updateTaskStatus` (see `lib/msc_vault_server_actions.ts`).
 */
export function MSC_Projectz_TaskPulse({ project }: MSC_Projectz_TaskPulseProps) {
  const { addTask, updateTaskStatus, deleteTask } = useAppStore()
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const visibleTasks = useMemo(
    () => project.tasks.filter((t) => !t.archived),
    [project.tasks],
  )

  const progressPercent = useMemo(() => {
    if (visibleTasks.length === 0) return 0
    const done = visibleTasks.filter((t) => t.status === 'done').length
    return Math.round((done / visibleTasks.length) * 100)
  }, [visibleTasks])

  const health = msc_taskPulseHealth(visibleTasks)
  const circumference = 2 * Math.PI * 36
  const strokeDash = (progressPercent / 100) * circumference

  const handleAdd = async () => {
    const t = newTitle.trim()
    if (!t) return
    await addTask(project.id, t)
    setNewTitle('')
    setIsAdding(false)
  }

  const msc_moveTo = (task: Task, status: TaskStatus) => {
    void updateTaskStatus(project.id, task.id, status)
  }

  if (visibleTasks.length === 0) {
    if (!isAdding) {
      return (
        <div
          className="msc-task-pulse msc-task-pulse--empty overflow-hidden rounded-xl border border-border bg-card"
          data-msc-component="task-pulse"
        >
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary/40"
              aria-hidden
            >
              <Activity className="h-8 w-8 text-muted-foreground opacity-80" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Systems Idle</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No tasks in this vault. Initialize work to light up the protocol.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="msc-cta-initialize inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Zap className="h-4 w-4" />
              Initialize New Task
            </button>
            <p className="pt-2 text-[10px] text-muted-foreground/80">Powered by the MSC Media Engine</p>
          </div>
        </div>
      )
    }
    return (
      <div
        className="msc-task-pulse msc-task-pulse--empty overflow-hidden rounded-xl border border-border bg-card p-6"
        data-msc-component="task-pulse"
      >
        <h3 className="mb-3 text-sm font-semibold text-foreground">Initialize New Task</h3>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            className="max-w-md flex-1 text-sm"
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd()
              if (e.key === 'Escape') {
                setIsAdding(false)
                setNewTitle('')
              }
            }}
            autoFocus
          />
          <Button type="button" size="sm" className="bg-primary text-primary-foreground" onClick={() => void handleAdd()}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false)
              setNewTitle('')
            }}
          >
            Cancel
          </Button>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">Powered by the MSC Media Engine</p>
      </div>
    )
  }

  return (
    <div
      className="msc-task-pulse flex min-h-[420px] w-full max-w-full flex-col gap-4 lg:flex-row lg:items-stretch"
      data-msc-component="task-pulse"
    >
      {/* Left: Kanban ~70% */}
      <div className="msc-task-pulse__kanban flex min-w-0 flex-1 flex-col gap-3 lg:min-w-0 lg:flex-[7]">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-foreground">Task Pulse</h3>
          {!isAdding && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-primary"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-background/50 p-3">
            <div className="min-w-[200px] flex-1">
              <Input
                placeholder="Task title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleAdd()
                  if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewTitle('')
                  }
                }}
                className="text-sm"
              />
            </div>
            <Button type="button" size="sm" className="bg-primary text-primary-foreground" onClick={() => void handleAdd()}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false)
                setNewTitle('')
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="grid min-h-[280px] flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          {MSC_TASK_PULSE_COLUMNS.map((col) => {
            const colTasks = visibleTasks.filter((t) => t.status === col.status)
            return (
              <div
                key={col.status}
                className="msc-task-pulse__column flex min-h-0 flex-col rounded-lg border border-border bg-background/40"
              >
                <div className="border-b border-border bg-card/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      {col.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{colTasks.length}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/90">{col.description}</p>
                </div>
                <ul className="msc-task-pulse__list flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
                  {colTasks.map((task) => (
                    <li
                      key={task.id}
                      className="group rounded-md border border-border/80 bg-card p-2.5 text-left shadow-sm"
                    >
                      <p className="pr-1 text-sm text-foreground">{task.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <MSC_Projectz_TaskAssigneeBadge project={project} task={task} />
                        {col.status === 'todo' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-0.5 text-xs"
                            onClick={() => msc_moveTo(task, 'in-progress')}
                          >
                            Active
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                        {col.status === 'in-progress' && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => msc_moveTo(task, 'todo')}
                            >
                              Queue
                            </Button>
                            <button
                              type="button"
                              className="inline-flex h-7 items-center gap-0.5 rounded-md px-2 text-xs font-medium msc-cta-initialize"
                              onClick={() => msc_moveTo(task, 'done')}
                            >
                              Stabilize
                            </button>
                          </>
                        )}
                        {col.status === 'done' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => msc_moveTo(task, 'todo')}
                          >
                            Reopen
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => void deleteTask(project.id, task.id)}
                          className="ml-auto p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Vader Telemetry ~30% */}
      <aside className="msc-task-pulse__telemetry flex w-full min-w-0 flex-col rounded-xl border border-border bg-card lg:min-w-[200px] lg:max-w-none lg:flex-[3]">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vader Telemetry</h3>
        </div>

        <div className="flex flex-1 flex-col items-center justify-start gap-4 px-4 py-5">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle
                className="text-border"
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="hsl(var(--msc-accent))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">{progressPercent}%</span>
              <span className="text-[10px] text-muted-foreground">Pulse</span>
            </div>
          </div>

          <div className="w-full space-y-1 rounded-lg border border-border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CircleDot className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">Project health</span>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">{health}</p>
          </div>

          <dl className="w-full space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2 border-b border-border/60 pb-1.5">
              <dt>Last updated</dt>
              <dd className="shrink-0 text-right text-foreground/90">{msc_formatTaskPulseDate(project.updatedAt)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Created</dt>
              <dd className="shrink-0 text-right text-foreground/90">{msc_formatTaskPulseDate(project.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-auto border-t border-border px-3 py-2.5 text-center text-[10px] text-muted-foreground">
          Powered by the MSC Media Engine
        </div>
      </aside>
    </div>
  )
}
