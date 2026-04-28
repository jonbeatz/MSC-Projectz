'use client'

import { Shrink } from 'lucide-react'

import { MSC_Projectz_TaskPulse } from '@/components/MSC-Projectz-TaskPulse'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Project } from '@/lib/types'

type MscTaskPulseFocusDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  activeTab: 'tasks' | 'code-vault'
  onActiveTabChange: (tab: 'tasks' | 'code-vault') => void
}

export function MSC_Projectz_TaskPulseFocusDrawer({
  open,
  onOpenChange,
  project,
  activeTab,
  onActiveTabChange,
}: MscTaskPulseFocusDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="msc-clients-glass-card h-full! w-[95vw]! max-w-none! gap-0 border-border bg-card/95 p-0 backdrop-blur-2xl sm:w-[95vw]! sm:max-w-none! md:w-[1100px]! md:max-w-[1100px]! lg:w-[1200px]! lg:max-w-[1200px]!"
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3 pr-8">
              <div>
                <SheetTitle className="text-left text-sm font-semibold">
                  {project ? project.name : 'Focus Workspace'}
                </SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Task Pulse + Code Vault focus workspace
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border bg-secondary/30 text-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                  onClick={() => onOpenChange(false)}
                >
                  <Shrink className="h-3.5 w-3.5" />
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {project ? (
              <MSC_Projectz_TaskPulse project={project} activeTab={activeTab} onActiveTabChange={onActiveTabChange} />
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-secondary/20 text-sm text-muted-foreground">
                Select a project to open Focus Workspace.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

