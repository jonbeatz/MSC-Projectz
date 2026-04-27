'use client'

import { useEffect, useRef } from 'react'
import { X, Plus, Vault } from 'lucide-react'
import { ProjectGrid } from './project-grid'
import { MSC_Projectz_TaskPulse } from '@/components/MSC-Projectz-TaskPulse'
import { MSC_Projectz_ProjectReferencePanel } from '@/components/MSC-Projectz-ProjectReferencePanel'
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
  selectedProjectId: string | null
  onClearSelectedProject: () => void
  selectedProject: Project | null
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
  selectedProjectId,
  onClearSelectedProject,
  selectedProject,
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
        className="msc-projectz-dashboard msc-empty-vault flex w-full min-h-[60vh] items-center justify-center bg-background p-6"
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
    <div className="msc-projectz-dashboard flex w-full min-w-0 flex-1 flex-col gap-4 md:gap-6 xl:flex-row">
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

      {selectedProjectId && selectedProject && (
        <div className="w-full min-w-0 shrink-0 xl:max-w-3xl">
          <div className="sticky top-20">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">{selectedProject.name}</h2>
              <button
                type="button"
                onClick={onClearSelectedProject}
                className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close project panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <MSC_Projectz_TaskPulse project={selectedProject} />
            <MSC_Projectz_ProjectReferencePanel
              project={selectedProject}
              onOpenRefsInEditor={() => onEditProject(selectedProject.id)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
