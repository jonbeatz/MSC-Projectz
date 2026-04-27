'use client'

import type { MscCalendarTaskItem } from '@/lib/msc_calendar_utils'
import { CalendarAgendaPanel } from '@/components/CalendarAgendaPanel'
import { cn } from '@/lib/utils'

export function CalendarSidebar({
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
    <aside
      className={cn(
        'hidden min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card/25 shadow-inner md:flex',
        'md:max-w-[20rem] lg:max-w-[20rem] xl:max-w-[24rem]',
        className,
      )}
    >
      <CalendarAgendaPanel selectedYmd={selectedYmd} agenda={agenda} onAddTask={onAddTask} className="h-full" />
    </aside>
  )
}
