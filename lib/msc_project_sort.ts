import type { Project, ProjectSortMode } from '@/lib/types'

function msc_time(v: Date): number {
  return v instanceof Date ? v.getTime() : new Date(v).getTime()
}

/**
 * Sort a project list for the Command Center dashboard.
 * `manual` uses `manualRank` then `createdAt` then `id` for a stable order.
 */
export function msc_sortProjectsForDashboard(projects: Project[], mode: ProjectSortMode): Project[] {
  const list = [...projects]
  const compareId = (a: Project, b: Project) => a.id.localeCompare(b.id, undefined, { numeric: true })

  switch (mode) {
    case 'manual':
      return list.sort((a, b) => {
        const r = a.manualRank - b.manualRank
        if (r !== 0) return r
        const t = msc_time(a.createdAt) - msc_time(b.createdAt)
        if (t !== 0) return t
        return compareId(a, b)
      })
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || compareId(a, b))
    case 'updated': {
      return list.sort((a, b) => {
        const t = msc_time(b.updatedAt) - msc_time(a.updatedAt)
        if (t !== 0) return t
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || compareId(a, b)
      })
    }
    case 'status': {
      return list.sort((a, b) => {
        const o = a.status === b.status ? 0 : a.status === 'local' ? -1 : 1
        if (o !== 0) return o
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || compareId(a, b)
      })
    }
    default:
      return list
  }
}
