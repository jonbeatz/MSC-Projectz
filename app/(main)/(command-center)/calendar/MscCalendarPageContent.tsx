'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addWeeks, endOfWeek, format, parse, startOfWeek, subWeeks } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { CalendarAddTaskDialog } from '@/components/CalendarAddTaskDialog'
import { CalendarAgendaPanel } from '@/components/CalendarAgendaPanel'
import { CalendarTaskEditDialog } from '@/components/CalendarTaskEditDialog'
import { CalendarGrid } from '@/components/CalendarGrid'
import { CalendarSidebar } from '@/components/CalendarSidebar'
import { MSC_Projectz_ClientDrawer } from '@/components/MSC-Projectz-ClientDrawer'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { msc_listClients } from '@/lib/msc_client_actions'
import { msc_compareCalendarByDayParity } from '@/lib/msc_calendar_parity'
import { msc_getCalendarDayDetailsRange } from '@/lib/msc_vault_server_actions'
import { cn } from '@/lib/utils'
import type { DayDetail } from '@/lib/msc_calendar_utils'
import {
  buildDayDetail,
  msc_addCalendarMonths,
  msc_calendarDayCells,
  msc_indexTasksByDueDay,
} from '@/lib/msc_calendar_utils'
import { useIsMaxMd } from '@/lib/msc_hooks'
import { useAppStore } from '@/lib/store'
import type { CalendarViewMode } from '@/lib/types'

const weekStarts = 1 as const

/**
 * Client-only calendar page content (extracted so the parent page can suspend).
 * Data path: TanStack Query → Zustand store → local aggregation.
 */
export default function Msc_CalendarPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projects = useAppStore((s) => s.projects)
  const hydrateVaultFromPayload = useAppStore((s) => s.hydrateVaultFromPayload)
  const appSettings = useAppStore((s) => s.appSettings)
  const setCalendarView = useAppStore((s) => s.setCalendarView)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)

  const { calendarView, selectedDate: selectedYmd } = appSettings
  const clientParam = searchParams.get('client')
  const isMaxMd = useIsMaxMd()
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [clientsById, setClientsById] = useState<Map<string, string>>(new Map())
  const [clientsHydrated, setClientsHydrated] = useState(false)
  const [dayDetailsByYmd, setDayDetailsByYmd] = useState<Record<string, DayDetail>>({})
  const loggedAggregationFallbackRef = useRef(false)
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

  useEffect(() => {
    let cancelled = false
    void msc_listClients().then((res) => {
      if (cancelled) return
      if (res.ok) {
        const map = new Map<string, string>()
        for (const c of res.clients) {
          map.set(String(c.id), String(c.name))
        }
        setClientsById(map)
      }
      setClientsHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const byDay = useMemo(() => msc_indexTasksByDueDay(projects, { includeDone: true }), [projects])
  const forceFallback =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('force_fallback') === 'true'

  const loadCalendarData = useCallback(async () => {
    const dayCells = msc_calendarDayCells(selectedYmd, calendarView)
    const sortedDayKeys = dayCells.map((d) => format(d, 'yyyy-MM-dd')).sort((a, b) => a.localeCompare(b))
    const startYmd = sortedDayKeys[0]
    const endYmd = sortedDayKeys[sortedDayKeys.length - 1]
    if (!startYmd || !endYmd) {
      setDayDetailsByYmd({})
      return
    }

    try {
      if (forceFallback) {
        throw new Error('Forced fallback via ?force_fallback=true')
      }
      const res = await msc_getCalendarDayDetailsRange({ startYmd, endYmd, includeDone: true })
      setDayDetailsByYmd(res.byDay)

      if (process.env.NODE_ENV !== 'production' && clientsHydrated) {
        const clientByDay: Record<string, DayDetail> = {}
        for (const ymd of sortedDayKeys) {
          clientByDay[ymd] = buildDayDetail(ymd, projects, byDay, clientsById)
        }
        const parity = msc_compareCalendarByDayParity({
          serverByDay: res.byDay,
          clientByDay,
        })
        if (!parity.match) {
          console.warn('[calendar] parity drift detected', { reason: parity.message })
        }
      }
    } catch (err) {
      if (!loggedAggregationFallbackRef.current) {
        loggedAggregationFallbackRef.current = true
        console.warn('[calendar] server aggregation unavailable, falling back to local detail builder.', err)
      }
      const fallbackByDay: Record<string, DayDetail> = {}
      for (const ymd of sortedDayKeys) {
        fallbackByDay[ymd] = buildDayDetail(ymd, projects, byDay, clientsById)
      }
      setDayDetailsByYmd(fallbackByDay)
    }
  }, [byDay, calendarView, clientsById, clientsHydrated, forceFallback, projects, selectedYmd])

  useEffect(() => {
    void loadCalendarData()
  }, [loadCalendarData])

  const selectedDayDetail = useMemo(
    () => dayDetailsByYmd[selectedYmd] ?? buildDayDetail(selectedYmd, projects, byDay, clientsById),
    [byDay, clientsById, dayDetailsByYmd, projects, selectedYmd],
  )

  const resolveDayDetail = useCallback(
    (ymd: string) => dayDetailsByYmd[ymd] ?? buildDayDetail(ymd, projects, byDay, clientsById),
    [byDay, clientsById, dayDetailsByYmd, projects],
  )

  const parsedSelected = useMemo(() => parse(selectedYmd, 'yyyy-MM-dd', new Date()), [selectedYmd])

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

  const onOpenCalendarAddTask = useCallback(
    (ymd: string) => {
      setSelectedDate(ymd)
      setAddOpen(true)
    },
    [setSelectedDate],
  )

  const openClientFromCalendar = useCallback(
    (clientId: string) => {
      router.push(`/calendar?client=${encodeURIComponent(clientId)}`)
    },
    [router],
  )

  return (
    <div className="msc-calendar-route-bg relative flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 rounded-2xl p-3 sm:gap-4 sm:p-6">
      <header
        className={cn(
          'msc-calendar-glass-panel relative z-[1] flex min-h-10 min-w-0 flex-col gap-2 px-3 py-2',
          'md:flex-row md:items-center md:justify-between md:gap-3',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-content-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-muted-foreground backdrop-blur-sm">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Calendar</h1>
            <p className="truncate text-xs text-muted-foreground">{rangeLabel}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 md:justify-end">
          <div
            className="inline-flex rounded-lg border border-border/50 bg-card/30 p-0.5"
            role="group"
            aria-label="View mode"
          >
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'h-8 min-w-0 px-3',
                calendarView === 'month' && 'bg-white/10 text-foreground ring-1 ring-inset ring-white/12',
              )}
              onClick={() => onView('month')}
            >
              Month
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'h-8 min-w-0 px-3',
                calendarView === 'week' && 'bg-white/10 text-foreground ring-1 ring-inset ring-white/12',
              )}
              onClick={() => onView('week')}
            >
              Week
            </Button>
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-card/20 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onPrev}
              aria-label="Previous period"
            >
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
                Scheduled
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onNext}
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(28rem,1fr)_minmax(18rem,22rem)] xl:grid-cols-[minmax(32rem,1fr)_minmax(20rem,24rem)]">
        <CalendarGrid
          calendarView={calendarView}
          selectedYmd={selectedYmd}
          onSelectYmd={handleDayPick}
          onEditTask={(projectId, taskId, cellYmd) => setEditing({ projectId, taskId, cellYmd })}
          onAddTask={onOpenCalendarAddTask}
          byDay={byDay}
          projects={projects}
          resolveDayDetail={resolveDayDetail}
          onJumpToClient={openClientFromCalendar}
        />
        <CalendarSidebar
          className="min-h-[280px] max-h-[min(100vh,56rem)]"
          selectedYmd={selectedYmd}
          dayDetail={selectedDayDetail}
          onAddTask={onOpenCalendarAddTask}
          onEditTask={(projectId, taskId, dayYmd) => setEditing({ projectId, taskId, cellYmd: dayYmd })}
          onJumpToClient={openClientFromCalendar}
        />
      </div>

      <Sheet open={agendaOpen} onOpenChange={setAgendaOpen}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[90vh] w-full max-w-full gap-0 border-t-0 p-0 sm:max-w-full"
        >
          <SheetHeader className="sr-only shrink-0 border-0 p-0">
            <SheetTitle>Scheduled for selected day</SheetTitle>
          </SheetHeader>
          <CalendarAgendaPanel
            className="min-h-0 max-h-[min(88vh,100%)]"
            selectedYmd={selectedYmd}
            dayDetail={selectedDayDetail}
            onAddTask={onOpenCalendarAddTask}
            onEditTask={(projectId, taskId, dayYmd) => {
              setAgendaOpen(false)
              setEditing({ projectId, taskId, cellYmd: dayYmd })
            }}
            onJumpToClient={openClientFromCalendar}
          />
        </SheetContent>
      </Sheet>
      <CalendarAddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        dueYmd={selectedYmd}
        projects={projects}
        onTaskCreated={() => void loadCalendarData()}
      />
      <CalendarTaskEditDialog
        open={editing != null}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
        projectId={editing?.projectId ?? null}
        taskId={editing?.taskId ?? null}
        dayYmd={editing?.cellYmd ?? selectedYmd}
        projects={projects}
        onTaskUpdated={() => void loadCalendarData()}
        onTaskDeleted={() => void loadCalendarData()}
      />
      <MSC_Projectz_ClientDrawer
        clientId={clientParam}
        open={Boolean(clientParam)}
        onOpenChange={(open) => {
          if (!open) {
            router.push('/calendar')
          }
        }}
      />
    </div>
  )
}
