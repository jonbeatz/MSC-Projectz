import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isValid, startOfMonth, startOfWeek } from 'date-fns'

import type { Project, Task } from '@/lib/types'

const WEEK_STARTS = 1 as const

export type MscCalendarTaskItem = {
  projectId: string
  projectName: string
  task: Task
}

/** `yyyy-MM-dd` from a calendar `Date` in local time. */
export function msc_formatDateKeyLocal(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** `yyyy-MM-dd` from a task’s due date, or null. */
export function msc_dueDateKeyFromTask(t: Task): string | null {
  const due = t.dueDate
  if (!due) return null
  const d = due instanceof Date ? due : new Date(due)
  if (!isValid(d)) return null
  return msc_formatDateKeyLocal(d)
}

/**
 * For calendar chips: all tasks with a due date (exclude archived) keyed by `yyyy-MM-dd`.
 */
export function msc_indexTasksByDueDay(
  projects: Project[],
  opts?: { includeDone?: boolean },
): Map<string, MscCalendarTaskItem[]> {
  const map = new Map<string, MscCalendarTaskItem[]>()
  const includeDone = opts?.includeDone !== false
  for (const p of projects) {
    for (const t of p.tasks) {
      if (t.archived) continue
      if (!includeDone && t.status === 'done') continue
      const key = msc_dueDateKeyFromTask(t)
      if (!key) continue
      const list = map.get(key) ?? []
      list.push({ projectId: p.id, projectName: p.name, task: t })
      map.set(key, list)
    }
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.task.title.localeCompare(b.task.title))
  }
  return map
}

export function msc_filterTasksForDay(
  byDay: Map<string, MscCalendarTaskItem[]>,
  ymd: string,
): MscCalendarTaskItem[] {
  return byDay.get(ymd) ?? []
}

export function msc_calendarDayCells(ymd: string, view: 'month' | 'week'): Date[] {
  const base = new Date(ymd + 'T12:00:00')
  if (view === 'week') {
    const s = startOfWeek(base, { weekStartsOn: WEEK_STARTS })
    const e = endOfWeek(base, { weekStartsOn: WEEK_STARTS })
    return eachDayOfInterval({ start: s, end: e })
  }
  const m0 = startOfMonth(base)
  const m1 = endOfMonth(m0)
  const start = startOfWeek(m0, { weekStartsOn: WEEK_STARTS })
  const end = endOfWeek(m1, { weekStartsOn: WEEK_STARTS })
  return eachDayOfInterval({ start, end })
}

export function msc_addCalendarMonths(ymd: string, delta: number): string {
  const base = new Date(ymd + 'T12:00:00')
  return format(addMonths(base, delta), 'yyyy-MM-dd')
}
