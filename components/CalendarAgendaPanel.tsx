'use client'

import { format, parse } from 'date-fns'
import { Plus } from 'lucide-react'

import { msc_getTaskStatusLabel } from '@/lib/msc_task_status_labels'
import type { MscCalendarTaskItem } from '@/lib/msc_calendar_utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function heading(ymd: string) {
  const d = parse(ymd, 'yyyy-MM-dd', new Date())
  return format(d, 'EEEE, MMM d, yyyy')
}

export function CalendarAgendaPanel({
  selectedYmd,
  agenda,
  onAddTask,
  className,
}: {
  selectedYmd: string
  agenda: MscCalendarTaskItem[]
  onAddTask: () => void
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className="shrink-0 border-b border-border/50 p-3 sm:p-4">
        <h2 className="text-sm font-semibold text-foreground">{heading(selectedYmd)}</h2>
        <p className="text-xs text-muted-foreground">Agenda</p>
        <Button
          type="button"
          onClick={onAddTask}
          className="mt-3 w-full border border-msc-gold/40 bg-msc-gold/10 text-foreground hover:bg-msc-gold/20"
          variant="secondary"
        >
          <Plus className="mr-1.5 h-4 w-4 text-msc-gold" />
          Add task
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-3 [scrollbar-gutter:stable] sm:p-4">
        {agenda.length === 0 && (
          <p className="text-sm text-muted-foreground">No due tasks for this day.</p>
        )}
        {agenda.map((x) => (
          <div
            key={x.task.id}
            className="rounded-lg border border-border/40 bg-background/30 p-2.5 text-left"
          >
            <div className="line-clamp-2 text-sm font-medium text-foreground" title={x.task.title}>
              {x.task.title}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {x.projectName} · {msc_getTaskStatusLabel(x.task.status || 'todo')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
