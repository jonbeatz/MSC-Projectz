'use client'

import { format, isValid } from 'date-fns'
import { Pencil, User } from 'lucide-react'
import { memo, useCallback, useEffect, useRef } from 'react'

import { msc_resolveTaskAssignee } from '@/components/MSC-Projectz-TaskAssignee'
import { Button } from '@/components/ui/button'
import { msc_resolveAvatarUrl } from '@/lib/msc_avatar_url'
import { msc_getTaskStatusLabel } from '@/lib/msc_task_status_labels'
import { useIsMaxMd } from '@/lib/msc_hooks'
import type { Project, Task, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

function msc_calendarStatusDotClass(rawStatus: string): string {
  const status = rawStatus.trim().toLowerCase()
  if (status === 'active' || status === 'in-progress') return 'bg-emerald-500/85'
  if (status === 'lead' || status === 'todo') return 'bg-amber-500/85'
  if (status === 'completed' || status === 'done') return 'bg-slate-500/85'
  if (status === 'blocked') return 'bg-rose-500/85'
  return 'bg-muted-foreground/70'
}

/** Left accent for minimal grid chips (Studio Dark). */
function msc_calendarStatusBorderClass(rawStatus: string): string {
  const status = rawStatus.trim().toLowerCase()
  if (status === 'in-progress') return 'border-l-white/45'
  if (status === 'active') return 'border-l-emerald-500/75'
  if (status === 'lead' || status === 'todo') return 'border-l-amber-500/75'
  if (status === 'completed' || status === 'done') return 'border-l-slate-500/65'
  if (status === 'blocked') return 'border-l-rose-500/75'
  return 'border-l-muted-foreground/50'
}

const CalendarTaskChipImpl = function CalendarTaskChip({
  task,
  project,
  projectName,
  cellYmd,
  selectedYmd,
  onSelectYmd,
  onEditTask,
  openOnClick = false,
  variant = 'default',
  className,
}: {
  task: Task
  project: Project
  projectName: string
  cellYmd: string
  selectedYmd: string
  onSelectYmd: (ymd: string) => void
  onEditTask: (projectId: string, taskId: string, cellYmd: string) => void
  /** When true, single click opens editor (used in day-detail views). */
  openOnClick?: boolean
  /** `compact` / `minimal`: grid cell preview on md+; `default` everywhere else. */
  variant?: 'default' | 'compact' | 'minimal'
  className?: string
}) {
  const isNarrow = useIsMaxMd()
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTouchRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)
  const LONG_PRESS_MS = 500
  const MOVE_CANCEL_PX = 12

  const status: TaskStatus = (task.status || 'todo') as TaskStatus
  const stLabel = msc_getTaskStatusLabel(status)
  const rawStatus = String(task.status || '')
  const statusDotClass = msc_calendarStatusDotClass(rawStatus)
  const statusBorderClass = msc_calendarStatusBorderClass(rawStatus)
  const assignee = msc_resolveTaskAssignee(project, task)
  const label = assignee
    ? assignee.username?.trim() || assignee.email?.trim() || `User ${String(assignee.id)}`
    : null
  const av = assignee ? msc_resolveAvatarUrl(assignee) : null

  const due = task.dueDate
  const dateLine =
    due && isValid(due instanceof Date ? due : new Date(due))
      ? format(due instanceof Date ? due : new Date(due), 'MMM d')
      : null

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (suppressClickRef.current) {
        e.stopPropagation()
        e.preventDefault()
        return
      }
      e.stopPropagation()
      e.preventDefault()
      if (openOnClick) {
        onEditTask(project.id, task.id, cellYmd)
        return
      }
      if (cellYmd !== selectedYmd) {
        onSelectYmd(cellYmd)
      }
    },
    [cellYmd, onEditTask, onSelectYmd, openOnClick, project.id, selectedYmd, task.id],
  )

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onEditTask(project.id, task.id, cellYmd)
    },
    [onEditTask, project.id, task.id, cellYmd],
  )

  const runEdit = useCallback(() => {
    suppressClickRef.current = true
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 400)
    onEditTask(project.id, task.id, cellYmd)
  }, [onEditTask, project.id, task.id, cellYmd])

  useEffect(() => {
    return () => clearLongPress()
  }, [clearLongPress])

  const fullMetaTitle = [task.title, stLabel, projectName, dateLine].filter(Boolean).join(' · ')
  const interactionHint = isNarrow
    ? label
      ? `${label} — Tap pencil or long-press to edit`
      : 'Long-press or use pencil to edit'
    : label
      ? `${label} — Double-click to edit`
      : 'Double-click to edit'
  const rootTitle =
    variant === 'default' ? interactionHint : `${fullMetaTitle}. ${interactionHint}`

  if (variant === 'minimal') {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'relative w-full min-w-0 cursor-default rounded border border-border/40 bg-card/35 py-1 pl-1.5 pr-1 text-left text-[10px] font-medium text-foreground transition hover:bg-card/60 md:min-h-[32px]',
          'pointer-events-auto border-l-2',
          statusBorderClass,
          status === 'done' && 'opacity-75',
          className,
        )}
        title={rootTitle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            e.preventDefault()
            onEditTask(project.id, task.id, cellYmd)
          }
        }}
        onTouchStart={(e) => {
          clearLongPress()
          if (e.touches.length !== 1) return
          const t = e.touches[0]
          startTouchRef.current = { x: t.clientX, y: t.clientY }
          longPressTimerRef.current = setTimeout(() => {
            startTouchRef.current = null
            longPressTimerRef.current = null
            runEdit()
          }, LONG_PRESS_MS)
        }}
        onTouchMove={(e) => {
          if (!startTouchRef.current || e.touches.length !== 1) return
          const t = e.touches[0]
          if (
            Math.abs(t.clientX - startTouchRef.current.x) > MOVE_CANCEL_PX ||
            Math.abs(t.clientY - startTouchRef.current.y) > MOVE_CANCEL_PX
          ) {
            startTouchRef.current = null
            clearLongPress()
          }
        }}
        onTouchEnd={() => {
          startTouchRef.current = null
          clearLongPress()
        }}
        onTouchCancel={() => {
          startTouchRef.current = null
          clearLongPress()
        }}
      >
        <span className="line-clamp-1 min-w-0">{task.title}</span>
      </div>
    )
  }

  const isCompact = variant === 'compact'

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative w-full min-w-0 cursor-default rounded border border-border/50 bg-card/50 text-left font-medium text-foreground transition hover:bg-card/80',
        isCompact ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-1 text-[10px] sm:text-xs',
        isNarrow && !isCompact && 'pr-12',
        isNarrow && isCompact && 'pr-5',
        'pointer-events-auto',
        status === 'done' && 'border-primary/20 opacity-80',
        status === 'in-progress' && !isCompact && 'border-l-2 border-white/40 pl-1',
        status === 'in-progress' && isCompact && 'border-l-2 border-white/35 pl-0.5',
        className,
      )}
      title={rootTitle}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation()
          e.preventDefault()
          onEditTask(project.id, task.id, cellYmd)
        }
      }}
      onTouchStart={(e) => {
        clearLongPress()
        if (e.touches.length !== 1) return
        const t = e.touches[0]
        startTouchRef.current = { x: t.clientX, y: t.clientY }
        longPressTimerRef.current = setTimeout(() => {
          startTouchRef.current = null
          longPressTimerRef.current = null
          runEdit()
        }, LONG_PRESS_MS)
      }}
      onTouchMove={(e) => {
        if (!startTouchRef.current || e.touches.length !== 1) return
        const t = e.touches[0]
        if (
          Math.abs(t.clientX - startTouchRef.current.x) > MOVE_CANCEL_PX ||
          Math.abs(t.clientY - startTouchRef.current.y) > MOVE_CANCEL_PX
        ) {
          startTouchRef.current = null
          clearLongPress()
        }
      }}
      onTouchEnd={() => {
        startTouchRef.current = null
        clearLongPress()
      }}
      onTouchCancel={() => {
        startTouchRef.current = null
        clearLongPress()
      }}
    >
      {isNarrow && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'absolute z-10 shrink-0 text-muted-foreground hover:text-foreground',
            isCompact
              ? 'right-0.5 top-0.5 h-7 w-7 p-0'
              : 'right-1 top-1 h-11 w-11 min-h-11 min-w-11 touch-manipulation p-0',
          )}
          title="Edit task"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onEditTask(project.id, task.id, cellYmd)
          }}
        >
          <Pencil className={isCompact ? 'h-2.5 w-2.5' : 'h-4 w-4'} aria-hidden />
        </Button>
      )}
      <div className={cn('flex min-w-0', isCompact ? 'gap-0.5' : 'gap-1', isNarrow && !isCompact && 'gap-2')}>
        {(!isNarrow || isCompact) && (
          <span
            className={cn(
              'mt-0.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary',
              isCompact ? 'h-3 w-3 text-[7px]' : 'h-4 w-4 text-[8px]',
            )}
            title={label || 'Unassigned'}
          >
            {assignee ? (
              av ? (
                <img src={av} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-0.5">
                  <User
                    className={cn('text-primary', isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5')}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>
              )
            ) : (
              '·'
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className={cn('flex min-w-0 items-start', isCompact ? 'gap-1' : 'gap-1.5')}>
            <span
              className={cn(
                'inline-block shrink-0 rounded-full ring-1 ring-black/20',
                isCompact ? 'mt-0.5 h-1 w-1' : 'mt-1 h-1.5 w-1.5',
                statusDotClass,
              )}
              aria-hidden
            />
            <span className={cn('min-w-0', isCompact ? 'line-clamp-1' : 'line-clamp-2')} title={task.title}>
              {task.title}
            </span>
          </span>
          {!isCompact && !isNarrow ? (
            <span className="block truncate text-[9px] text-muted-foreground" title={projectName}>
              {stLabel} · {projectName}
              {dateLine ? ` · ${dateLine}` : null}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export const CalendarTaskChip = memo(CalendarTaskChipImpl)
CalendarTaskChip.displayName = 'CalendarTaskChip'
