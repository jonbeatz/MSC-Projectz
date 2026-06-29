import { describe, it, expect } from 'vitest'
import { msc_compareCalendarByDayParity } from '@/lib/msc_calendar_parity'
import type { DayDetail } from '@/lib/msc_calendar_utils'

function makeDayDetail(ymd: string, count: number, emptyState = count === 0): DayDetail {
  return {
    ymd,
    count,
    emptyState,
    items: [],
    clientGroupedItems: [],
  }
}

function makeDayDetailWithTasks(ymd: string, tasks: Array<{ id: string; title: string }>): DayDetail {
  return {
    ymd,
    count: tasks.length,
    emptyState: tasks.length === 0,
    items: tasks.map((t) => ({
      projectId: 'proj-1',
      projectName: 'Test Project',
      task: {
        id: t.id,
        title: t.title,
        status: 'todo' as const,
        priority: 'normal' as const,
        completed: false,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })),
    clientGroupedItems: [],
  }
}

describe('msc_calendar_parity', () => {
  it('returns match for identical day details', () => {
    const byDay = {
      '2025-06-01': makeDayDetail('2025-06-01', 0, true),
      '2025-06-02': makeDayDetail('2025-06-02', 1),
    }
    const result = msc_compareCalendarByDayParity({ serverByDay: byDay, clientByDay: byDay })
    expect(result.match).toBe(true)
  })

  it('detects mismatched counts', () => {
    const server: Record<string, DayDetail> = {
      '2025-06-01': makeDayDetail('2025-06-01', 3),
    }
    const client: Record<string, DayDetail> = {
      '2025-06-01': makeDayDetail('2025-06-01', 2),
    }
    const result = msc_compareCalendarByDayParity({ serverByDay: server, clientByDay: client })
    expect(result.match).toBe(false)
    expect(result.message).toContain('2025-06-01')
  })

  it('detects missing days', () => {
    const server: Record<string, DayDetail> = {
      '2025-06-01': makeDayDetail('2025-06-01', 0),
      '2025-06-02': makeDayDetail('2025-06-02', 0),
    }
    const client: Record<string, DayDetail> = {
      '2025-06-01': makeDayDetail('2025-06-01', 0),
    }
    const result = msc_compareCalendarByDayParity({ serverByDay: server, clientByDay: client })
    expect(result.match).toBe(false)
    expect(result.message).toContain('2025-06-02')
  })

  it('detects mismatched task data', () => {
    const server: Record<string, DayDetail> = {
      '2025-06-01': makeDayDetailWithTasks('2025-06-01', [{ id: 't1', title: 'Task A' }]),
    }
    const client: Record<string, DayDetail> = {
      '2025-06-01': makeDayDetailWithTasks('2025-06-01', [{ id: 't1', title: 'Task B' }]),
    }
    const result = msc_compareCalendarByDayParity({ serverByDay: server, clientByDay: client })
    expect(result.match).toBe(false)
  })

  it('handles empty records', () => {
    const result = msc_compareCalendarByDayParity({ serverByDay: {}, clientByDay: {} })
    expect(result.match).toBe(true)
  })
})
