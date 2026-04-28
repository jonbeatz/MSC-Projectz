'use client'

import { format, parse } from 'date-fns'
import { Plus } from 'lucide-react'
import type { MouseEvent } from 'react'

import { msc_getTaskStatusLabel } from '@/lib/msc_task_status_labels'
import type { DayDetail } from '@/lib/msc_calendar_utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function heading(ymd: string) {
  const d = parse(ymd, 'yyyy-MM-dd', new Date())
  return format(d, 'EEEE, MMM d, yyyy')
}

export function CalendarAgendaPanel({
  selectedYmd,
  dayDetail,
  onAddTask,
  onEditTask,
  onJumpToClient,
  className,
}: {
  selectedYmd: string
  dayDetail: DayDetail
  onAddTask: (ymd: string) => void
  onEditTask: (projectId: string, taskId: string, dayYmd: string) => void
  onJumpToClient: (clientId: string) => void
  className?: string
}) {
  const onClientHeaderClick = (e: MouseEvent<HTMLButtonElement>, clientId: string) => {
    e.stopPropagation()
    onJumpToClient(clientId)
  }

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className="shrink-0 border-b border-border/50 p-3 sm:p-4">
        <h2 className="text-sm font-semibold text-foreground">{heading(selectedYmd)}</h2>
        <p className="text-xs text-muted-foreground">Agenda</p>
        <Button
          type="button"
          onClick={() => onAddTask(selectedYmd)}
          className="mt-3 w-full border border-msc-gold/40 bg-msc-gold/10 text-foreground hover:bg-msc-gold/20"
          variant="secondary"
        >
          <Plus className="mr-1.5 h-4 w-4 text-msc-gold" />
          Add task
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-3 [scrollbar-gutter:stable] sm:p-4">
        {dayDetail.emptyState && (
          <p className="rounded-lg border border-border bg-background/40 px-3 py-3 text-sm text-muted-foreground">
            No tasks for this day.
          </p>
        )}
        {dayDetail.clientGroupedItems.map((group) => (
          <section key={group.clientId} className="space-y-2">
            {group.clientId !== 'unassigned' ? (
              <button
                type="button"
                onClick={(e) => onClientHeaderClick(e, group.clientId)}
                aria-label="View Client Details"
                className="w-full cursor-pointer rounded-md border border-border bg-muted/30 px-2 py-1 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-[var(--msc-accent)] hover:underline"
              >
                Client: <span className="text-foreground">{group.clientName}</span>
                <span className="ml-1.5 text-muted-foreground/80">({group.items.length})</span>
              </button>
            ) : (
              <p className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Client: <span className="text-foreground">{group.clientName}</span>
                <span className="ml-1.5 text-muted-foreground/80">({group.items.length})</span>
              </p>
            )}
            {group.items.map((x) => (
              <button
                key={x.task.id}
                type="button"
                onClick={() => onEditTask(x.projectId, x.task.id, selectedYmd)}
                className={
                  'w-full rounded-lg border border-border/40 bg-background/30 p-2.5 text-left transition-colors hover:bg-accent/50'
                }
              >
                <div className="line-clamp-2 text-sm font-medium text-foreground" title={x.task.title}>
                  {x.task.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {x.projectName} · {msc_getTaskStatusLabel(x.task.status || 'todo')}
                </div>
              </button>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
