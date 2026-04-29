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

const DOW = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
  const selectedD = useMemo(() => new Date(selectedYmd + 'T12:00:00'), [selectedYmd])

  const cellRows = useMemo(
    () =>
      dayCells.map((day) => {
        const ymd = msc_formatDateKeyLocal(day)
        const inMonth = calendarView === 'month' ? isSameMonth(day, baseDate) : true
        const isSel = isSameDay(day, selectedD)
        const rawItems = byDay.get(ymd) ?? []
        const eligibleItems = rawItems.filter((x) => byProjectId.has(x.projectId))
        const previewItems = eligibleItems.slice(0, CELL_PREVIEW_LIMIT)
        const overflowCount = Math.max(0, eligibleItems.length - previewItems.length)
        const isToday = isSameDay(startOfDay(day), startOfDay(new Date()))
        const dayAriaLabel =
          eligibleItems.length === 0 && onAddTask
            ? `${format(day, 'EEEE, MMMM d, yyyy')}. Add task.`
            : `${format(day, 'EEEE, MMMM d, yyyy')}. Show day details.`
        return {
          day,
          ymd,
          inMonth,
          isSel,
          eligibleItems,
          previewItems,
          overflowCount,
          isToday,
          dayAriaLabel,
        }
      }),
    [baseDate, byDay, byProjectId, calendarView, dayCells, onAddTask, selectedD],
  )

  const dayDetail = dayDetailYmd ? resolveDayDetail(dayDetailYmd) : null

  /** Full-cell activation: empty day opens Add Task; days with tasks open day detail. */
  const activateDayCell = (ymd: string, eligibleCount: number) => {
    onSelectYmd(ymd)
    if (eligibleCount === 0 && onAddTask) {
      onAddTask(ymd)
      return
    }
    setDayDetailYmd(ymd)
  }

  const onClientHeaderClick = (e: MouseEvent<HTMLButtonElement>, clientId: string) => {
    e.stopPropagation()
    onJumpToClient(clientId)
  }

  return (
    <div
      className={cn(
        'msc-calendar-glass-panel flex min-h-0 w-full min-w-0 flex-col self-start rounded-[22px] p-2.5 sm:p-4',
      )}
    >
      <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile: bento day tiles — no overflow-x scrollport (avoids sticky vs overflow bugs) */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-visible overflow-y-auto md:hidden">
          <div className="grid grid-cols-2 gap-2 p-0.5 sm:grid-cols-3 sm:gap-2">
            {cellRows.map(
              ({
                day,
                ymd,
                inMonth,
                isSel,
                eligibleItems,
                previewItems,
                overflowCount,
                isToday,
                dayAriaLabel,
              }) => (
                <div
                  key={ymd}
                  role="button"
                  tabIndex={0}
                  onClick={() => activateDayCell(ymd, eligibleItems.length)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      activateDayCell(ymd, eligibleItems.length)
                    }
                  }}
                  className={cn(
                    'msc-calendar-glass-cell group flex min-w-0 cursor-pointer flex-col gap-1.5 overflow-hidden p-2.5 text-left transition',
                    eligibleItems.length === 0 ? 'min-h-[5.5rem]' : 'min-h-[7.5rem]',
                    'max-h-[11rem]',
                    inMonth
                      ? isSel
                        ? 'ring-1 ring-dashed ring-white/28 ring-inset hover:bg-white/[0.04]'
                        : cn(
                            'hover:bg-white/[0.04]',
                            isToday &&
                              'shadow-[inset_0_0_28px_rgba(255,255,255,0.05)] ring-1 ring-inset ring-white/[0.1]',
                          )
                      : 'opacity-[0.42] ring-1 ring-dashed ring-white/[0.08] ring-inset',
                  )}
                  aria-label={dayAriaLabel}
                  aria-pressed={isSel}
                >
                  <div className="flex shrink-0 items-baseline justify-between gap-1 border-b border-white/5 pb-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wide text-muted-foreground',
                        isToday && 'text-foreground/90',
                      )}
                    >
                      {format(day, 'EEE')}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold tabular-nums text-foreground/90',
                        isToday && 'text-foreground',
                      )}
                    >
                      {format(day, 'MMM d')}
                    </span>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
                    {previewItems.map((x) => {
                      const project = byProjectId.get(x.projectId)
                      if (!project) return null
                      return (
                        <div key={x.task.id} className="min-w-0 shrink-0 px-0.5">
                          <CalendarTaskChip
                            task={x.task}
                            project={project}
                            projectName={x.projectName}
                            cellYmd={ymd}
                            selectedYmd={selectedYmd}
                            onSelectYmd={onSelectYmd}
                            onEditTask={onEditTask}
                            variant="minimal"
                          />
                        </div>
                      )
                    })}
                    {overflowCount > 0 ? (
                      <div className="shrink-0 px-1 pt-0.5 text-[10px] font-medium text-muted-foreground">
                        + {overflowCount} more
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Desktop: 7-column matrix; horizontal scroll only here */}
        <div className="hidden min-h-0 min-w-0 flex-1 flex-col md:flex">
          <div className="w-full min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
            <div className="w-full min-w-0 shrink-0 rounded-[1.25rem] md:min-w-[56rem]">
              <div
                className={cn(
                  'overflow-hidden rounded-[1.2rem] border border-white/[0.045] bg-black/22 p-1.5 backdrop-blur-xs',
                  'md:min-h-0 md:overflow-hidden',
                )}
              >
                <div className="grid grid-cols-7 gap-1.5">
                  {DOW.map((d) => (
                    <div
                      key={d}
                      className="h-8 rounded-md border border-white/[0.04] bg-black/20 px-2 text-center text-[10px] font-medium tracking-wide text-muted-foreground/72"
                    >
                      <span className="inline-flex h-full items-center justify-center truncate">{d}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5 md:auto-rows-[9.1rem]">
                  {cellRows.map(
                  ({
                    day,
                    ymd,
                    inMonth,
                    isSel,
                    eligibleItems,
                    previewItems,
                    overflowCount,
                    isToday,
                    dayAriaLabel,
                  }) => (
                    <div key={ymd} className="flex min-h-0 min-w-0 md:h-[9.1rem] md:min-h-0 md:flex-col">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => activateDayCell(ymd, eligibleItems.length)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            activateDayCell(ymd, eligibleItems.length)
                          }
                        }}
                        className={cn(
                          'msc-calendar-glass-cell msc-calendar-glass-cell--matrix group flex min-h-0 min-w-0 cursor-pointer flex-col gap-1.5 overflow-hidden px-2.5 py-2 text-left transition',
                          'md:h-full md:min-h-0 md:max-h-none',
                          inMonth
                            ? isSel
                              ? 'ring-1 ring-dashed ring-white/22 ring-inset hover:bg-white/[0.03]'
                              : cn(
                                  'hover:bg-white/[0.025]',
                                  isToday && 'shadow-[inset_0_0_26px_rgba(255,255,255,0.04)] ring-1 ring-inset ring-white/[0.08]',
                                )
                            : 'opacity-[0.36] ring-1 ring-dashed ring-white/[0.05] ring-inset',
                        )}
                        aria-label={dayAriaLabel}
                        aria-pressed={isSel}
                      >
                        <span
                          className={cn(
                            'mb-1 w-7 shrink-0 rounded-md py-0.5 text-center text-[10px] font-medium tabular-nums md:text-xs',
                            !inMonth && 'text-muted-foreground/45',
                            inMonth &&
                              (isToday
                                ? 'bg-white/[0.065] text-foreground ring-1 ring-inset ring-white/[0.09] shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]'
                                : 'text-foreground/84'),
                          )}
                        >
                          {String(day.getDate())}
                        </span>
                        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
                          {previewItems.map((x) => {
                            const project = byProjectId.get(x.projectId)
                            if (!project) return null
                            return (
                              <div key={x.task.id} className="min-w-0 shrink-0 px-0.5">
                                <CalendarTaskChip
                                  task={x.task}
                                  project={project}
                                  projectName={x.projectName}
                                  cellYmd={ymd}
                                  selectedYmd={selectedYmd}
                                  onSelectYmd={onSelectYmd}
                                  onEditTask={onEditTask}
                                  variant="minimal"
                                />
                              </div>
                            )
                          })}
                          {overflowCount > 0 ? (
                            <div className="shrink-0 px-1 pt-0.5 text-xs font-medium text-muted-foreground">
                              + {overflowCount} more
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ),
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dayDetailYmd != null} onOpenChange={(o) => !o && setDayDetailYmd(null)}>
        <DialogContent
          showCloseButton
          className={cn(
              'msc-calendar-detail-dialog max-h-[min(88vh,40rem)] max-w-[calc(100%-2rem)] gap-0 overflow-hidden border-border p-0 sm:max-w-lg',
            'bg-card/90 text-foreground',
          )}
        >
          <DialogHeader className="relative z-[1] shrink-0 border-b border-white/10 px-4 py-3 text-left sm:px-5 sm:py-4">
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
                className="mt-3 w-full border border-white/[0.1] bg-white/[0.06] text-foreground shadow-none backdrop-blur-md hover:border-white/[0.14] hover:bg-white/[0.1]"
                onClick={() => {
                  if (!dayDetailYmd) return
                  onAddTask(dayDetailYmd)
                  setDayDetailYmd(null)
                }}
              >
                <Plus className="mr-1.5 h-4 w-4 text-muted-foreground" aria-hidden />
                Add task
              </Button>
            ) : null}
          </DialogHeader>
          <div className="relative z-[1] min-h-0 max-h-[min(60vh,28rem)] overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4 [scrollbar-gutter:stable]">
            {dayDetail?.emptyState ? (
              <p className="text-sm text-muted-foreground">No due tasks for this day.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dayDetail?.clientGroupedItems.map((group) => (
                  <section key={group.clientId} className="space-y-2">
                    {group.clientId !== 'unassigned' ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => onClientHeaderClick(e, group.clientId)}
                        aria-label={`View client ${group.clientName}`}
                        className={cn(
                          'h-auto min-h-9 w-full justify-start border-white/15 bg-black/25 py-2 text-left backdrop-blur-sm',
                          'text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-white/20 hover:bg-white/8 hover:text-foreground',
                        )}
                      >
                        Client: <span className="font-semibold normal-case text-foreground">{group.clientName}</span>
                        <span className="ml-1.5 font-normal text-muted-foreground/80">({group.items.length})</span>
                      </Button>
                    ) : (
                      <p className="msc-calendar-glass-inset px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Client: <span className="font-semibold normal-case text-foreground">{group.clientName}</span>
                        <span className="ml-1.5 font-normal text-muted-foreground/80">({group.items.length})</span>
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
