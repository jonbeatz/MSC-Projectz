import type { TaskStatus } from '@/lib/types'

/**
 * Display labels for calendar / schedule (Soft Studio) without migrating DB values.
 * Payload and API keep `todo` | `in-progress` | `done`.
 */
export const MSC_TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Backlog',
  'in-progress': 'Active',
  done: 'Complete',
}

/**
 * User-facing name for a task status (Sprint 5+ calendar, sidebar).
 */
export function msc_getTaskStatusLabel(status: TaskStatus | string | null | undefined): string {
  if (status === 'todo' || status === 'in-progress' || status === 'done') {
    return MSC_TASK_STATUS_LABELS[status]
  }
  if (status == null || String(status).trim() === '') {
    return MSC_TASK_STATUS_LABELS.todo
  }
  return String(status)
}
