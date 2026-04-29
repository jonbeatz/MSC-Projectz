'use client'

import { useEffect, useRef } from 'react'
import { Plus, Vault } from 'lucide-react'
import { ProjectGrid } from './project-grid'
import { MSC_Projectz_TaskPulseFocusDrawer } from '@/components/MSC-Projectz-TaskPulseFocusDrawer'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import type { Project } from '@/lib/types'

export interface MSC_Projectz_DashboardProps {
  projects: Project[]
  filteredProjects: Project[]
  searchQuery: string
  /** Opens AddProjectModal, which completes creation via `msc_createVaultProject`. */
  onInitializeNewVault: () => void
  onAddProject: () => void
  onSelectProject: (id: string) => void
  onOpenVault: (id: string) => void
  onEditProject: (id: string) => void
  onOpenTaskDrawer: (id: string) => void
  focusProject: Project | null
  focusOpen: boolean
  onFocusOpenChange: (open: boolean) => void
  focusTab: 'tasks' | 'code-vault'
  onFocusTabChange: (tab: 'tasks' | 'code-vault') => void
}

/**
 * Day One / Command Center main surface: empty vault CTA or full project grid.
 * CTA uses `--msc-accent` (see `app/globals.css`); structure uses `msc-` BEM-style classes.
 */
export function MSC_Projectz_Dashboard({
  projects,
  filteredProjects,
  searchQuery,
  onInitializeNewVault,
  onAddProject,
  onSelectProject,
  onOpenVault,
  onEditProject,
  onOpenTaskDrawer,
  focusProject,
  focusOpen,
  onFocusOpenChange,
  focusTab,
  onFocusTabChange,
}: MSC_Projectz_DashboardProps) {
  const msc_hardResetVaultState = useAppStore((s) => s.msc_hardResetVaultState)
  const sessionUser = useAppStore((s) => s.user)
  const msc_prevUserId = useRef<string | number | undefined>(undefined)

  // Zero-leak: on tenant (Payload user) change, clear projects before the hydrator re-fetches.
  useEffect(() => {
    const id = sessionUser?.payloadUserId
    if (id === undefined) {
      msc_prevUserId.current = undefined
      msc_hardResetVaultState()
      return
    }
    console.log('DASHBOARD: Reactively fetching for:', sessionUser?.email)
    if (
      msc_prevUserId.current !== undefined &&
      String(msc_prevUserId.current) !== String(id)
    ) {
      msc_hardResetVaultState()
    }
    msc_prevUserId.current = id
  }, [sessionUser?.payloadUserId, sessionUser?.email, msc_hardResetVaultState])

  useEffect(() => {
    console.log('DASHBOARD: Rendering projects for:', sessionUser?.email)
  }, [sessionUser?.email, projects.length])

  if (projects.length === 0) {
    return (
      <div
        className="msc-projectz-dashboard msc-cc-route-canvas msc-empty-vault flex min-h-full w-full items-center justify-center p-6"
        data-msc-day-one="true"
      >
        <div className="msc-empty-vault__surface w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary/40"
            aria-hidden
          >
            <Vault className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="msc-empty-vault__headline text-xl font-semibold tracking-tight text-foreground">
            No Vaults Initialized
          </h2>
          <p className="msc-empty-vault__lede mt-2 text-sm text-muted-foreground">
            Initialize your first project to begin the Vader Protocol.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onInitializeNewVault}
              className={cn(
                'msc-cta-initialize inline-flex items-center justify-center gap-2',
                'rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity',
                'hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Initialize New Vault
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="msc-projectz-dashboard msc-cc-route-canvas flex min-h-full w-full min-w-0 flex-1 flex-col gap-4 md:gap-6">
      <div className="min-w-0 flex-1">
        <ProjectGrid
          projects={filteredProjects}
          searchQuery={searchQuery}
          onAddProject={onAddProject}
          onSelectProject={onSelectProject}
          onOpenVault={onOpenVault}
          onEditProject={onEditProject}
          onOpenTaskDrawer={onOpenTaskDrawer}
        />
      </div>
      <MSC_Projectz_TaskPulseFocusDrawer
        open={focusOpen}
        onOpenChange={onFocusOpenChange}
        project={focusProject}
        activeTab={focusTab}
        onActiveTabChange={onFocusTabChange}
      />
    </div>
  )
}
