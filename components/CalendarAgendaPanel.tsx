'use client'

import { format, parse } from 'date-fns'
import { ChevronRight, Plus } from 'lucide-react'
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
    <div
      className={cn(
        'msc-calendar-route-bg relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl',
        className,
      )}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-sm font-semibold text-foreground">{heading(selectedYmd)}</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Agenda</p>
        <Button
          type="button"
          onClick={() => onAddTask(selectedYmd)}
          className="mt-3 w-full border border-white/15 bg-black/35 text-foreground shadow-sm backdrop-blur-md hover:border-white/22 hover:bg-black/45"
          variant="secondary"
        >
          <Plus className="mr-1.5 h-4 w-4 text-muted-foreground" />
          Add task
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 [scrollbar-gutter:stable] sm:px-5 sm:py-4">
        <div className="mx-0 max-md:mx-1 space-y-3 sm:mx-0">
          {dayDetail.emptyState && (
            <p className="msc-calendar-glass-inset px-3 py-3 text-sm text-muted-foreground">
              No tasks for this day.
            </p>
          )}
          {dayDetail.clientGroupedItems.map((group) => (
            <section
              key={group.clientId}
              className="max-md:space-y-2 max-md:rounded-xl max-md:border max-md:border-white/8 max-md:bg-black/20 max-md:p-2.5 max-md:backdrop-blur-sm md:space-y-2"
            >
              {group.clientId !== 'unassigned' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => onClientHeaderClick(e, group.clientId)}
                  aria-label={`View client ${group.clientName}`}
                  className={cn(
                    'h-auto min-h-10 w-full justify-between gap-2 border-white/15 bg-black/25 px-3 py-2 text-left backdrop-blur-sm',
                    'text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-white/20 hover:bg-white/8 hover:text-foreground',
                    'focus-visible:ring-2 focus-visible:ring-white/25',
                  )}
                >
                  <span className="min-w-0">
                    Client:{' '}
                    <span className="font-semibold normal-case text-foreground">{group.clientName}</span>
                    <span className="ml-1.5 font-normal text-muted-foreground/90">({group.items.length})</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden />
                </Button>
              ) : (
                <p
                  className={cn(
                    'msc-calendar-glass-inset px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground',
                  )}
                >
                  Client: <span className="font-semibold normal-case text-foreground">{group.clientName}</span>
                  <span className="ml-1.5 font-normal text-muted-foreground/80">({group.items.length})</span>
                </p>
              )}
              {group.items.map((x) => (
                <button
                  key={x.task.id}
                  type="button"
                  onClick={() => onEditTask(x.projectId, x.task.id, selectedYmd)}
                  className={cn(
                    'msc-calendar-glass-inset w-full p-2.5 text-left transition-colors',
                    'hover:border-white/15 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                  )}
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
    </div>
  )
}
