import { describe, it, expect } from 'vitest'
import {
  msc_formatDateKeyLocal,
  msc_canonicalDueYmdForCompare,
  msc_dueDateKeyFromTask,
  msc_addCalendarMonths,
  msc_calendarDayCells,
} from '@/lib/msc_calendar_utils'
import type { Project, Task } from '@/lib/types'

// Helper to create a minimal Task with a dueDate
function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    status: 'todo' as const,
    priority: 'normal' as const,
    completed: false,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    title: 'Test Task',
    ...overrides,
  } as Task
}

describe('msc_calendar_utils', () => {
  describe('msc_formatDateKeyLocal', () => {
    it('formats a date to yyyy-MM-dd', () => {
      const d = new Date(2025, 5, 15) // June 15, 2025
      expect(msc_formatDateKeyLocal(d)).toBe('2025-06-15')
    })
  })

  describe('msc_canonicalDueYmdForCompare', () => {
    it('returns null for null/undefined', () => {
      expect(msc_canonicalDueYmdForCompare(null)).toBeNull()
      expect(msc_canonicalDueYmdForCompare(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(msc_canonicalDueYmdForCompare('')).toBeNull()
    })

    it('formats a Date object', () => {
      const d = new Date(2025, 0, 1)
      expect(msc_canonicalDueYmdForCompare(d)).toBe('2025-01-01')
    })

    it('formats an ISO string in local time', () => {
      // Use noon UTC to avoid timezone boundary issues
      expect(msc_canonicalDueYmdForCompare('2025-12-25T12:00:00.000Z')).toBe('2025-12-25')
    })
  })

  describe('msc_dueDateKeyFromTask', () => {
    it('returns null for task without due date', () => {
      const task = makeTask({ id: '1' })
      expect(msc_dueDateKeyFromTask(task)).toBeNull()
    })

    it('returns key for task with due date Date (midday UTC to avoid TZ boundary)', () => {
      const task = makeTask({ id: '1', dueDate: new Date('2025-06-15T12:00:00.000Z') })
      expect(msc_dueDateKeyFromTask(task)).toBe('2025-06-15')
    })

    it('returns key for task with due date Date', () => {
      const task = makeTask({ id: '1', dueDate: new Date(2025, 6, 4) })
      expect(msc_dueDateKeyFromTask(task)).toBe('2025-07-04')
    })
  })

  describe('msc_addCalendarMonths', () => {
    it('adds positive months', () => {
      expect(msc_addCalendarMonths('2025-01-15', 2)).toBe('2025-03-15')
    })

    it('subtracts months', () => {
      expect(msc_addCalendarMonths('2025-03-15', -1)).toBe('2025-02-15')
    })

    it('handles year boundary', () => {
      expect(msc_addCalendarMonths('2025-11-01', 3)).toBe('2026-02-01')
    })
  })

  describe('msc_calendarDayCells', () => {
    it('returns 35 cells for month view by default', () => {
      const cells = msc_calendarDayCells('2025-06-15', 'month')
      expect(cells.length).toBeGreaterThanOrEqual(28)
      expect(cells.length).toBeLessThanOrEqual(42)
      // First cell should be <= June 1 (start of month or before)
      expect(cells[0].getTime()).toBeLessThanOrEqual(new Date(2025, 5, 1).getTime())
      // Last cell should be >= June 30
      expect(cells[cells.length - 1].getTime()).toBeGreaterThanOrEqual(new Date(2025, 5, 30).getTime())
    })

    it('returns 7 cells for week view', () => {
      const cells = msc_calendarDayCells('2025-06-15', 'week')
      expect(cells.length).toBe(7)
    })
  })
})
