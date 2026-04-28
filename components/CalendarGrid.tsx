'use client'

import { useMemo, useState } from 'react'
import { format, isSameDay, isSameMonth, parse, startOfDay } from 'date-fns'
import { Plus } from 'lucide-react'
import type { MouseEvent } from 'react'

import {
  msc_formatDateKeyLocal,
  msc_calendarDayCells,
  type DayDetail,
  type MscCalendarTaskItem,
} from '@/lib/msc_calendar_utils'
import type { CalendarViewMode, Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CalendarTaskChip } from '@/components/CalendarTaskChip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Max tasks shown in cell preview; remainder summarized as "+ N more". */
const CELL_PREVIEW_LIMIT = 3

function detailHeading(ymd: string) {
  const d = parse(ymd, 'yyyy-MM-dd', new Date())
  return format(d, 'EEEE, MMMM d, yyyy')
}

export function CalendarGrid({
  calendarView,
  selectedYmd,
  onSelectYmd,
  onEditTask,
  onAddTask,
  byDay,
  projects,
  resolveDayDetail,
  onJumpToClient,
}: {
  calendarView: CalendarViewMode
  /** `yyyy-MM-dd` */
  selectedYmd: string
  onSelectYmd: (ymd: string) => void
  onEditTask: (projectId: string, taskId: string, cellYmd: string) => void
  /** Opens global add-task flow for the active day */
  onAddTask?: (ymd: string) => void
  byDay: Map<string, MscCalendarTaskItem[]>
  projects: Project[]
  resolveDayDetail: (ymd: string) => DayDetail
  onJumpToClient: (clientId: string) => void
}) {
  const [dayDetailYmd, setDayDetailYmd] = useState<string | null>(null)
  const byProjectId = useMemo(() => {
    const m = new Map<string, Project>()
    for (const p of projects) m.set(p.id, p)
    return m
  }, [projects])

  const dayCells = useMemo(
    () => msc_calendarDayCells(selectedYmd, calendarView),
    [calendarView, selectedYmd],
  )

  const baseDate = useMemo(() => new Date(selectedYmd + 'T12:00:00'), [selectedYmd])
  const selectedD = new Date(selectedYmd + 'T12:00:00')

  const dayDetail = dayDetailYmd ? resolveDayDetail(dayDetailYmd) : null

  const openDayDetail = (ymd: string) => {
    onSelectYmd(ymd)
    setDayDetailYmd(ymd)
  }

  const onClientHeaderClick = (e: MouseEvent<HTMLButtonElement>, clientId: string) => {
    e.stopPropagation()
    onJumpToClient(clientId)
  }

  return (
    <div
      className={cn(
        'flex min-h-0 w-full min-w-0 flex-col self-start rounded-xl border border-border/50 bg-card/20 p-2 shadow-inner sm:p-4',
      )}
    >
      <div className="max-md:-mx-2 max-md:px-2">
        {/* Horizontal containment: desktop 7-column matrix can scroll inside narrow viewports if needed */}
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          {/* Narrow md+: keep 7-col minimum width → scroll instead of unreadable squeezed cells */}
          <div className="w-full min-w-0 rounded-lg md:min-w-2xl">
            <div
              className={cn(
                'grid gap-px overflow-hidden rounded-lg border border-border bg-border/70',
                'grid-cols-1 md:grid-cols-7 md:min-h-0',
              )}
            >
              <div className="hidden md:contents">
                {DOW.map((d) => (
                  <div
                    key={d}
                    className="bg-muted/40 p-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {dayCells.map((day) => {
                const ymd = msc_formatDateKeyLocal(day)
                const inMonth = calendarView === 'month' ? isSameMonth(day, baseDate) : true
                const isSel = isSameDay(day, selectedD)
                const items = byDay.get(ymd) ?? []
                const preview = items.slice(0, CELL_PREVIEW_LIMIT)
                const hiddenCount = items.length - preview.length
                const isToday = isSameDay(startOfDay(day), startOfDay(new Date()))
                return (
                  <div
                    key={ymd}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDayDetail(ymd)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openDayDetail(ymd)
                      }
                    }}
                    className={cn(
                      'group flex h-auto min-h-[150px] min-w-0 cursor-pointer flex-col gap-1 bg-background p-2 text-left transition',
                      inMonth
                        ? isSel
                          ? 'ring-1 ring-msc-gold/60 ring-inset hover:bg-muted/40'
                          : cn('hover:bg-muted/40', isToday && 'ring-1 ring-msc-gold/35 ring-inset')
                        : 'opacity-50 ring-1 ring-border/80 ring-inset',
                    )}
                    aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}. Show day details.`}
                    aria-pressed={isSel}
                  >
                    {/* Headers are md-only; mobile shows weekday here */}
                    <p
                      className={cn(
                        'shrink-0 text-xs font-medium text-muted-foreground md:hidden',
                        isToday && 'text-msc-gold',
                      )}
                    >
                      {format(day, 'EEE, MMM d')}
                    </p>
                    <span
                      className={cn(
                        'hidden shrink-0 rounded py-px text-center text-[10px] font-medium md:mb-0.5 md:block md:w-6 md:text-xs',
                        isToday ? 'bg-msc-gold/20 text-msc-gold' : 'text-foreground/90',
                      )}
                    >
                      {String(day.getDate())}
                    </span>

                    <div
                      className="flex w-full flex-col gap-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {preview.map((x) => {
                        const project = byProjectId.get(x.projectId)
                        if (!project) return null
                        return (
                          <div key={x.task.id} className="min-w-0">
                            <CalendarTaskChip
                              task={x.task}
                              project={project}
                              projectName={x.projectName}
                              cellYmd={ymd}
                              selectedYmd={selectedYmd}
                              onSelectYmd={onSelectYmd}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )
                      })}
                      {hiddenCount > 0 ? (
                        <div className="px-0.5 text-xs text-muted-foreground">+ {hiddenCount} more</div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dayDetailYmd != null} onOpenChange={(o) => !o && setDayDetailYmd(null)}>
        <DialogContent
          showCloseButton
          className={cn(
            'max-h-[min(88vh,40rem)] max-w-[calc(100%-2rem)] gap-0 overflow-hidden border-border p-0 sm:max-w-lg',
            'bg-card',
          )}
        >
          <DialogHeader className="shrink-0 border-b border-border/50 px-4 py-3 text-left sm:px-5 sm:py-4">
            <DialogTitle className="text-base font-semibold text-foreground">
              {dayDetailYmd ? detailHeading(dayDetailYmd) : ''}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {dayDetail?.emptyState
                ? 'No tasks due this day.'
                : `${dayDetail?.count ?? 0} task${dayDetail?.count === 1 ? '' : 's'} due`}
            </DialogDescription>
            {onAddTask ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full border border-msc-gold/40 bg-msc-gold/10 text-foreground hover:bg-msc-gold/20"
                onClick={() => {
                  if (!dayDetailYmd) return
                  onAddTask(dayDetailYmd)
                  setDayDetailYmd(null)
                }}
              >
                <Plus className="mr-1.5 h-4 w-4 text-msc-gold" aria-hidden />
                Add task
              </Button>
            ) : null}
          </DialogHeader>
          <div className="min-h-0 max-h-[min(60vh,28rem)] overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4 [scrollbar-gutter:stable]">
            {dayDetail?.emptyState ? (
              <p className="text-sm text-muted-foreground">No due tasks for this day.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dayDetail?.clientGroupedItems.map((group) => (
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
                    {group.items.map((x) => {
                      const project = byProjectId.get(x.projectId)
                      if (!project || !dayDetailYmd) return null
                      return (
                        <div key={x.task.id} className="min-w-0 rounded-md transition-colors hover:bg-accent/50">
                          <CalendarTaskChip
                            task={x.task}
                            project={project}
                            projectName={x.projectName}
                            cellYmd={dayDetailYmd}
                            selectedYmd={selectedYmd}
                            onSelectYmd={onSelectYmd}
                            openOnClick
                            onEditTask={(pid, tid, cell) => {
                              setDayDetailYmd(null)
                              onEditTask(pid, tid, cell)
                            }}
                          />
                        </div>
                      )
                    })}
                  </section>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
