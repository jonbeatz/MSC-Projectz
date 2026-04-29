'use client'

import type { DayDetail } from '@/lib/msc_calendar_utils'
import { CalendarAgendaPanel } from '@/components/CalendarAgendaPanel'
import { cn } from '@/lib/utils'

export function CalendarSidebar({
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
  return (
    <aside
      className={cn(
        'msc-calendar-glass-panel relative z-[1] hidden min-h-0 w-full min-w-0 flex-col overflow-hidden md:flex',
        'md:max-w-[20rem] lg:max-w-[20rem] xl:max-w-[24rem]',
        className,
      )}
    >
      <CalendarAgendaPanel
        selectedYmd={selectedYmd}
        dayDetail={dayDetail}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onJumpToClient={onJumpToClient}
        className="h-full"
      />
    </aside>
  )
}
