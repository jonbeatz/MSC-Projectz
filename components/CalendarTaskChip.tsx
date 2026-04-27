'use client'

import { format, isValid } from 'date-fns'
import { Pencil, User } from 'lucide-react'
import { memo, useCallback, useEffect, useRef } from 'react'

import { msc_resolveTaskAssignee } from '@/components/MSC-Projectz-TaskAssignee'
import { Button } from '@/components/ui/button'
import { msc_resolveAvatarUrl } from '@/lib/msc_avatar_url'
import { msc_getTaskStatusLabel } from '@/lib/msc_task_status_labels'
import { useIsMaxMd } from '@/lib/msc_hooks'
import type { MscProjectMember } from '@/types/user-admin'
import type { Project, Task, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const CalendarTaskChipImpl = function CalendarTaskChip({
  task,
  project,
  projectName,
  cellYmd,
  selectedYmd,
  onSelectYmd,
  onEditTask,
  className,
}: {
  task: Task
  project: Project
  projectName: string
  cellYmd: string
  selectedYmd: string
  onSelectYmd: (ymd: string) => void
  onEditTask: (projectId: string, taskId: string, cellYmd: string) => void
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
      if (cellYmd !== selectedYmd) {
        onSelectYmd(cellYmd)
      }
    },
    [cellYmd, selectedYmd, onSelectYmd],
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

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative w-full min-w-0 cursor-default rounded border border-border/50 bg-card/50 px-1.5 py-1 text-left text-[10px] font-medium text-foreground transition hover:bg-card/80 sm:text-xs',
        isNarrow && 'pr-6',
        'pointer-events-auto',
        status === 'done' && 'border-primary/20 opacity-80',
        status === 'in-progress' && 'border-l-2 border-msc-gold/60 pl-1',
        className,
      )}
      title={
        isNarrow
          ? label
            ? `${label} — Tap pencil or long-press to edit`
            : 'Long-press or use pencil to edit'
          : label
            ? `${label} — Double-click to edit`
            : 'Double-click to edit'
      }
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
          className="absolute right-0.5 top-0.5 z-10 h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          title="Edit task"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onEditTask(project.id, task.id, cellYmd)
          }}
        >
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
      )}
      <div className="flex min-w-0 gap-1">
        <span
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[8px] font-semibold text-primary"
          title={label || 'Unassigned'}
        >
          {assignee ? (
            av ? (
              <img src={av} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center p-0.5">
                <User className="h-2.5 w-2.5 text-primary" strokeWidth={1.5} aria-hidden />
              </span>
            )
          ) : (
            '·'
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span className="line-clamp-2" title={task.title}>
            {task.title}
          </span>
          <span className="block truncate text-[9px] text-muted-foreground" title={projectName}>
            {stLabel} · {projectName}
            {dateLine ? ` · ${dateLine}` : null}
          </span>
        </div>
      </div>
    </div>
  )
}

export const CalendarTaskChip = memo(CalendarTaskChipImpl)
CalendarTaskChip.displayName = 'CalendarTaskChip'
