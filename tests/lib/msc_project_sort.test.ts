import { describe, it, expect } from 'vitest'
import { msc_sortProjectsForDashboard } from '@/lib/msc_project_sort'
import type { Project } from '@/lib/types'

function makeProject(overrides: Partial<Project> & { id: string }): Project {
  return {
    name: 'Test Project',
    status: 'local',
    progress: 0,
    manualRank: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
    credentials: [],
    references: [],
    ...overrides,
  } as Project
}

describe('msc_project_sort', () => {
  const projects: Project[] = [
    makeProject({ id: 'a', name: 'Alpha', manualRank: 1, createdAt: new Date('2025-01-01') }),
    makeProject({ id: 'b', name: 'Beta', manualRank: 2, createdAt: new Date('2025-01-02') }),
    makeProject({ id: 'c', name: 'Gamma', manualRank: 0, createdAt: new Date('2025-01-03') }),
    makeProject({ id: 'd', name: 'Delta', status: 'live', manualRank: 3, createdAt: new Date('2025-01-04') }),
  ]

  describe('manual mode', () => {
    it('sorts by manualRank ascending', () => {
      const sorted = msc_sortProjectsForDashboard(projects, 'manual')
      expect(sorted[0].id).toBe('c') // rank 0
      expect(sorted[1].id).toBe('a') // rank 1
      expect(sorted[2].id).toBe('b') // rank 2
      expect(sorted[3].id).toBe('d') // rank 3
    })

    it('breaks ties with createdAt then id', () => {
      const tied = [
        makeProject({ id: 'z', name: 'Zeta', manualRank: 0, createdAt: new Date('2025-06-01') }),
        makeProject({ id: 'y', name: 'Yota', manualRank: 0, createdAt: new Date('2025-06-01') }),
      ]
      const sorted = msc_sortProjectsForDashboard(tied, 'manual')
      // Same rank + same createdAt → stable by id
      expect(sorted[0].id).toBe('y')
      expect(sorted[1].id).toBe('z')
    })
  })

  describe('name mode', () => {
    it('sorts alphabetically', () => {
      const sorted = msc_sortProjectsForDashboard(projects, 'name')
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Beta')
      expect(sorted[2].name).toBe('Delta')
      expect(sorted[3].name).toBe('Gamma')
    })

    it('is case-insensitive', () => {
      const mixed = [makeProject({ id: '1', name: 'apple' }), makeProject({ id: '2', name: 'Banana' })]
      const sorted = msc_sortProjectsForDashboard(mixed, 'name')
      expect(sorted[0].name).toBe('apple')
      expect(sorted[1].name).toBe('Banana')
    })
  })

  describe('updated mode', () => {
    it('sorts by updatedAt descending', () => {
      const updated = [
        makeProject({ id: '1', name: 'Old', updatedAt: new Date('2025-01-01') }),
        makeProject({ id: '2', name: 'New', updatedAt: new Date('2025-06-01') }),
        makeProject({ id: '3', name: 'Mid', updatedAt: new Date('2025-03-01') }),
      ]
      const sorted = msc_sortProjectsForDashboard(updated, 'updated')
      expect(sorted[0].name).toBe('New')
      expect(sorted[1].name).toBe('Mid')
      expect(sorted[2].name).toBe('Old')
    })
  })

  describe('status mode', () => {
    it('sorts local before live', () => {
      const statusProjects = [
        makeProject({ id: '1', name: 'Live', status: 'live' }),
        makeProject({ id: '2', name: 'Local', status: 'local' }),
      ]
      const sorted = msc_sortProjectsForDashboard(statusProjects, 'status')
      expect(sorted[0].status).toBe('local')
      expect(sorted[1].status).toBe('live')
    })
  })

  it('returns a new array (does not mutate input)', () => {
    const original = [...projects]
    const sorted = msc_sortProjectsForDashboard(projects, 'name')
    expect(sorted).not.toBe(projects)
    expect(projects).toEqual(original)
  })
})
