'use client'

import { useMemo } from 'react'
import { format, isSameDay, isSameMonth, startOfDay } from 'date-fns'

import { msc_formatDateKeyLocal, msc_calendarDayCells, type MscCalendarTaskItem } from '@/lib/msc_calendar_utils'
import type { CalendarViewMode, Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CalendarTaskChip } from '@/components/CalendarTaskChip'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MATRIX_MIN_W = 'min-w-[600px]'

export function CalendarGrid({
  calendarView,
  selectedYmd,
  onSelectYmd,
  onEditTask,
  byDay,
  projects,
}: {
  calendarView: CalendarViewMode
  /** `yyyy-MM-dd` */
  selectedYmd: string
  onSelectYmd: (ymd: string) => void
  onEditTask: (projectId: string, taskId: string, cellYmd: string) => void
  byDay: Map<string, MscCalendarTaskItem[]>
  projects: Project[]
}) {
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

  return (
    <div
      className={cn(
        'flex min-h-0 w-full min-w-0 flex-1 flex-col rounded-xl border border-border/50 bg-card/20 p-2 shadow-inner sm:p-4',
        'min-h-[36vh] sm:min-h-[50vh] md:min-h-[60vh]',
      )}
    >
      <div className="max-md:-mx-2 max-md:px-2">
        <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <div className={cn('w-full', MATRIX_MIN_W, 'px-0.5')}>
            <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
              {DOW.map((d) => (
                <div key={d} className="px-0.5 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div
              className={cn(
                'grid w-full min-h-0 flex-1 grid-cols-7 gap-1 sm:gap-1.5',
                'max-md:auto-rows-[minmax(5.5rem,1fr)] md:auto-rows-[minmax(7.5rem,1fr)]',
              )}
            >
              {dayCells.map((day) => {
                const ymd = msc_formatDateKeyLocal(day)
                const inMonth = calendarView === 'month' ? isSameMonth(day, baseDate) : true
                const isSel = isSameDay(day, selectedD)
                const items = byDay.get(ymd) ?? []
                const isToday = isSameDay(startOfDay(day), startOfDay(new Date()))
                return (
                  <div
                    key={ymd}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectYmd(ymd)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectYmd(ymd)
                      }
                    }}
                    className={cn(
                      'group flex min-h-[5.5rem] cursor-pointer flex-col overflow-hidden rounded-lg border p-1 text-left transition md:min-h-[7.5rem]',
                      inMonth
                        ? isSel
                          ? 'border-msc-gold/60 bg-background/30 hover:border-msc-gold/80 hover:bg-card/50'
                          : cn(
                              'border-border/50 bg-background/30 hover:border-primary/30 hover:bg-card/50',
                              isToday && 'border-msc-gold/35',
                            )
                        : 'border-border/20 bg-background/5 opacity-60',
                    )}
                    aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                    aria-pressed={isSel}
                  >
                    <span
                      className={cn(
                        'mb-0.5 w-6 shrink-0 rounded text-center text-[10px] font-medium sm:text-xs',
                        isToday ? 'bg-msc-gold/20 text-msc-gold' : 'text-foreground/90',
                      )}
                    >
                      {String(day.getDate())}
                    </span>
                    <div
                      className="min-h-0 min-w-0 flex-1 space-y-0.5 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {items.slice(0, 8).map((x) => {
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
                      {items.length > 8 && (
                        <div className="px-0.5 text-[9px] text-muted-foreground">+{items.length - 8} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
