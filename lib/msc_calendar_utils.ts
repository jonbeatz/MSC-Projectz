import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import type { Project, Task } from '@/lib/types'

const WEEK_STARTS = 1 as const

export type MscCalendarTaskItem = {
  projectId: string
  projectName: string
  task: Task
}

export type DayDetailGroup = {
  clientId: string
  clientName: string
  items: MscCalendarTaskItem[]
}

export type DayDetail = {
  ymd: string
  items: MscCalendarTaskItem[]
  count: number
  clientGroupedItems: DayDetailGroup[]
  emptyState: boolean
}

/** `yyyy-MM-dd` from a calendar `Date` in local time. */
export function msc_formatDateKeyLocal(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/**
 * Single calendar-day key for parity / diffing. Handles `Date`, ISO strings from
 * server-action JSON, and Payload date fields — avoids `String(Date)` vs ISO mismatches.
 */
export function msc_canonicalDueYmdForCompare(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  const d = raw instanceof Date ? raw : new Date(raw as string | number)
  if (!isValid(d)) return null
  return msc_formatDateKeyLocal(d)
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
  const projectClientById = new Map<string, string | null>()
  for (const p of projects) {
    const raw = p.clientId
    const cid = raw === undefined || raw === null || String(raw).trim() === '' ? null : String(raw).trim()
    projectClientById.set(p.id, cid)
  }
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
    list.sort((a, b) => msc_calendarTaskItemSort({ a, b, projectClientById }))
  }
  return map
}

export function msc_filterTasksForDay(byDay: Map<string, MscCalendarTaskItem[]>, ymd: string): MscCalendarTaskItem[] {
  return byDay.get(ymd) ?? []
}

function msc_taskDueSortKey(task: Task): string {
  const due = task.dueDate
  if (!due) return ''
  const d = due instanceof Date ? due : new Date(due)
  if (!isValid(d)) return ''
  return d.toISOString()
}

function msc_taskStatusSortKey(task: Task): string {
  const status = typeof task.status === 'string' ? task.status.trim().toLowerCase() : ''
  if (status === 'todo') return '0:todo'
  if (status === 'in-progress') return '1:in-progress'
  if (status === 'done') return '2:done'
  return `9:${status}`
}

function msc_resolveClientName(args: { clientId: string; clientsById?: ReadonlyMap<string, string> }): string {
  const { clientId, clientsById } = args
  const fromClients = clientsById?.get(clientId)?.trim()
  if (fromClients) return fromClients
  return `Client ${clientId}`
}

function msc_calendarTaskItemSort(args: {
  a: MscCalendarTaskItem
  b: MscCalendarTaskItem
  projectClientById: ReadonlyMap<string, string | null>
  clientsById?: ReadonlyMap<string, string>
}): number {
  const { a, b, projectClientById, clientsById } = args
  const aClient = projectClientById.get(a.projectId)
  const bClient = projectClientById.get(b.projectId)
  const aClientName = aClient == null ? 'Unassigned' : msc_resolveClientName({ clientId: aClient, clientsById })
  const bClientName = bClient == null ? 'Unassigned' : msc_resolveClientName({ clientId: bClient, clientsById })
  const byClient = aClientName.localeCompare(bClientName)
  if (byClient !== 0) return byClient

  const byProject = a.projectName.localeCompare(b.projectName)
  if (byProject !== 0) return byProject

  const byStatus = msc_taskStatusSortKey(a.task).localeCompare(msc_taskStatusSortKey(b.task))
  if (byStatus !== 0) return byStatus

  const byDue = msc_taskDueSortKey(a.task).localeCompare(msc_taskDueSortKey(b.task))
  if (byDue !== 0) return byDue

  const byTitle = String(a.task.title || '').localeCompare(String(b.task.title || ''))
  if (byTitle !== 0) return byTitle

  return String(a.task.id || '').localeCompare(String(b.task.id || ''))
}

/** Canonical day-detail payload for calendar consumers (agenda + day dialog). */
export function buildDayDetail(
  ymd: string,
  projects: Project[],
  tasksByDayOrItems: Map<string, MscCalendarTaskItem[]> | MscCalendarTaskItem[],
  clientsById?: ReadonlyMap<string, string>,
): DayDetail {
  const baseItems = Array.isArray(tasksByDayOrItems) ? tasksByDayOrItems : msc_filterTasksForDay(tasksByDayOrItems, ymd)

  const projectClientById = new Map<string, string | null>()
  for (const p of projects) {
    const raw = p.clientId
    const cid = raw === undefined || raw === null || String(raw).trim() === '' ? null : String(raw).trim()
    projectClientById.set(p.id, cid)
  }

  const items = [...baseItems].sort((a, b) => msc_calendarTaskItemSort({ a, b, projectClientById, clientsById }))

  const grouped = new Map<string, DayDetailGroup>()
  for (const item of items) {
    const rawClient = projectClientById.get(item.projectId)
    const clientId = rawClient ?? 'unassigned'
    const clientName = rawClient == null ? 'Unassigned' : msc_resolveClientName({ clientId: rawClient, clientsById })
    const existing = grouped.get(clientId)
    if (existing) {
      existing.items.push(item)
      continue
    }
    grouped.set(clientId, { clientId, clientName, items: [item] })
  }

  const clientGroupedItems = [...grouped.values()].sort((a, b) => a.clientName.localeCompare(b.clientName))

  return {
    ymd,
    items,
    count: items.length,
    clientGroupedItems,
    emptyState: items.length === 0,
  }
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
