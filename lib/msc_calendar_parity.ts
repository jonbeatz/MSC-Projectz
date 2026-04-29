import { msc_canonicalDueYmdForCompare, type DayDetail } from '@/lib/msc_calendar_utils'

type MscParityCheckResult = {
  match: boolean
  message: string
}

function msc_normalizeDayDetail(detail: DayDetail) {
  return {
    ymd: String(detail.ymd),
    count: Number(detail.count),
    emptyState: Boolean(detail.emptyState),
    items: detail.items.map((item) => ({
      projectId: String(item.projectId),
      projectName: String(item.projectName),
      task: {
        id: String(item.task.id),
        title: String(item.task.title || ''),
        status: String(item.task.status || ''),
        completed: Boolean(item.task.completed),
        archived: Boolean(item.task.archived),
        dueDate: msc_canonicalDueYmdForCompare(item.task.dueDate),
      },
    })),
    clientGroupedItems: detail.clientGroupedItems.map((group) => ({
      clientId: String(group.clientId),
      clientName: String(group.clientName),
      itemTaskIds: group.items.map((item) => String(item.task.id)),
    })),
  }
}

function msc_normalizeByDay(byDay: Record<string, DayDetail>) {
  const keys = Object.keys(byDay).sort((a, b) => a.localeCompare(b))
  const out: Record<string, ReturnType<typeof msc_normalizeDayDetail>> = {}
  for (const key of keys) {
    out[key] = msc_normalizeDayDetail(byDay[key])
  }
  return out
}

export function msc_compareCalendarByDayParity(args: {
  serverByDay: Record<string, DayDetail>
  clientByDay: Record<string, DayDetail>
}): MscParityCheckResult {
  if (process.env.NODE_ENV === 'production') {
    return { match: true, message: 'Skipping parity check in production.' }
  }

  const serverNorm = msc_normalizeByDay(args.serverByDay)
  const clientNorm = msc_normalizeByDay(args.clientByDay)
  const serverJson = JSON.stringify(serverNorm)
  const clientJson = JSON.stringify(clientNorm)
  if (serverJson === clientJson) {
    return { match: true, message: 'Server and client DayDetail payloads are in parity.' }
  }

  const allKeys = Array.from(new Set([...Object.keys(serverNorm), ...Object.keys(clientNorm)])).sort((a, b) =>
    a.localeCompare(b),
  )
  for (const ymd of allKeys) {
    const s = serverNorm[ymd]
    const c = clientNorm[ymd]
    if (!s || !c) {
      return { match: false, message: `Mismatch at ${ymd}: missing day in one path.` }
    }
    if (JSON.stringify(s) !== JSON.stringify(c)) {
      return { match: false, message: `Mismatch at ${ymd}: normalized DayDetail differs.` }
    }
  }
  return { match: false, message: 'Mismatch detected in normalized parity check.' }
}
