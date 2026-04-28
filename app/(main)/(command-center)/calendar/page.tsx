'use client'

import { useEffect, useMemo, useState } from 'react'
import { addWeeks, endOfWeek, format, parse, startOfWeek, subWeeks } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

import { CalendarAddTaskDialog } from '@/components/CalendarAddTaskDialog'
import { CalendarAgendaPanel } from '@/components/CalendarAgendaPanel'
import { CalendarTaskEditDialog } from '@/components/CalendarTaskEditDialog'
import { CalendarGrid } from '@/components/CalendarGrid'
import { CalendarSidebar } from '@/components/CalendarSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { msc_addCalendarMonths, msc_filterTasksForDay, msc_indexTasksByDueDay } from '@/lib/msc_calendar_utils'
import { useIsMaxMd } from '@/lib/msc_hooks'
import { useAppStore } from '@/lib/store'
import type { CalendarViewMode } from '@/lib/types'

const weekStarts = 1 as const

/**
 * Data path: `hydrateVaultFromPayload` → `msc_loadVaultProjects` (PAC/tenant, same as dashboard / Step 1).
 */
export default function Msc_CalendarPage() {
  const projects = useAppStore((s) => s.projects)
  const hydrateVaultFromPayload = useAppStore((s) => s.hydrateVaultFromPayload)
  const appSettings = useAppStore((s) => s.appSettings)
  const setCalendarView = useAppStore((s) => s.setCalendarView)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)

  const { calendarView, selectedDate: selectedYmd } = appSettings
  const isMaxMd = useIsMaxMd()
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<{
    projectId: string
    taskId: string
    cellYmd: string
  } | null>(null)

  useEffect(() => {
    void hydrateVaultFromPayload()
  }, [hydrateVaultFromPayload])

  useEffect(() => {
    if (!isMaxMd) setAgendaOpen(false)
  }, [isMaxMd])

  const byDay = useMemo(() => msc_indexTasksByDueDay(projects, { includeDone: true }), [projects])

  const agenda = useMemo(
    () => msc_filterTasksForDay(byDay, selectedYmd).filter((x) => !x.task.archived),
    [byDay, selectedYmd],
  )

  const parsedSelected = useMemo(
    () => parse(selectedYmd, 'yyyy-MM-dd', new Date()),
    [selectedYmd],
  )

  const rangeLabel = useMemo(() => {
    if (calendarView === 'week') {
      const a = startOfWeek(parsedSelected, { weekStartsOn: weekStarts })
      const b = endOfWeek(parsedSelected, { weekStartsOn: weekStarts })
      return `${format(a, 'MMM d')} – ${format(b, 'MMM d, yyyy')}`
    }
    return format(parsedSelected, 'MMMM yyyy')
  }, [calendarView, parsedSelected])

  const onPrev = () => {
    if (calendarView === 'week') {
      setSelectedDate(format(subWeeks(parsedSelected, 1), 'yyyy-MM-dd'))
    } else {
      setSelectedDate(msc_addCalendarMonths(selectedYmd, -1))
    }
  }

  const onNext = () => {
    if (calendarView === 'week') {
      setSelectedDate(format(addWeeks(parsedSelected, 1), 'yyyy-MM-dd'))
    } else {
      setSelectedDate(msc_addCalendarMonths(selectedYmd, 1))
    }
  }

  const onView = (v: CalendarViewMode) => setCalendarView(v)

  const handleDayPick = (ymd: string) => {
    setSelectedDate(ymd)
  }

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-6">
      <header
        className={cn(
          'flex min-w-0 flex-col gap-3 rounded-xl border border-border/50 bg-card/30 p-3 shadow-inner sm:p-4',
          'backdrop-blur-md',
          'md:flex-row md:items-center md:justify-between',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="grid h-10 w-10 shrink-0 place-content-center rounded-lg border border-msc-gold/25 bg-msc-gold/10 text-msc-gold">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Calendar</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{rangeLabel}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:gap-2.5 md:justify-end">
          <div
            className="inline-flex rounded-lg border border-border/50 bg-card/30 p-0.5"
            role="group"
            aria-label="View mode"
          >
            <Button
              type="button"
              variant="ghost"
              className={cn('h-8 min-w-0 px-3', calendarView === 'month' && 'bg-msc-gold/15 text-msc-gold')}
              onClick={() => onView('month')}
            >
              Month
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn('h-8 min-w-0 px-3', calendarView === 'week' && 'bg-msc-gold/15 text-msc-gold')}
              onClick={() => onView('week')}
            >
              Week
            </Button>
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-card/20 p-0.5">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onPrev} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-0 max-w-[10rem] truncate px-2 text-xs text-muted-foreground"
              onClick={goToToday}
            >
              Today
            </Button>
            {isMaxMd ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 shrink-0 px-2 text-xs"
                onClick={() => setAgendaOpen(true)}
              >
                Agenda
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onNext} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <CalendarGrid
          calendarView={calendarView}
          selectedYmd={selectedYmd}
          onSelectYmd={handleDayPick}
          onEditTask={(projectId, taskId, cellYmd) => setEditing({ projectId, taskId, cellYmd })}
          onAddTask={() => setAddOpen(true)}
          byDay={byDay}
          projects={projects}
        />
        <CalendarSidebar
          className="min-h-[280px] max-h-[min(100vh,56rem)]"
          selectedYmd={selectedYmd}
          agenda={agenda}
          onAddTask={() => setAddOpen(true)}
        />
      </div>

      <Sheet open={agendaOpen} onOpenChange={setAgendaOpen}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[90vh] w-full max-w-full gap-0 border-t-0 p-0 sm:max-w-full"
        >
          <SheetHeader className="sr-only shrink-0 border-0 p-0">
            <SheetTitle>Agenda for selected day</SheetTitle>
          </SheetHeader>
          <CalendarAgendaPanel
            className="min-h-0 max-h-[min(88vh,100%)]"
            selectedYmd={selectedYmd}
            agenda={agenda}
            onAddTask={() => setAddOpen(true)}
          />
        </SheetContent>
      </Sheet>
      <CalendarAddTaskDialog open={addOpen} onOpenChange={setAddOpen} dueYmd={selectedYmd} projects={projects} />
      <CalendarTaskEditDialog
        open={editing != null}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
        projectId={editing?.projectId ?? null}
        taskId={editing?.taskId ?? null}
        dayYmd={editing?.cellYmd ?? selectedYmd}
        projects={projects}
      />
    </div>
  )
}
