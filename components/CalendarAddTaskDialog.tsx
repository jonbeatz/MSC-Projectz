'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parse } from 'date-fns'

import { MSC_Projectz_TaskAssigneeSelect } from '@/components/MSC-Projectz-TaskAssignee'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

type CalendarAddTaskDialogProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  dueYmd: string
  projects: Project[]
  onTaskCreated?: () => void
}

function formatDueHeading(ymd: string): string {
  const d = parse(ymd, 'yyyy-MM-dd', new Date())
  return format(d, 'PPP')
}

function formatDueInputValue(ymd: string): string {
  const d = parse(ymd, 'yyyy-MM-dd', new Date())
  return format(d, 'yyyy-MM-dd')
}

export function CalendarAddTaskDialog({
  open,
  onOpenChange,
  dueYmd,
  projects,
  onTaskCreated,
}: CalendarAddTaskDialogProps) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [assignId, setAssignId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const addTask = useAppStore((s) => s.addTask)

  const selectedProject = useMemo(
    () => (projectId ? projects.find((p) => p.id === projectId) ?? null : null),
    [projectId, projects],
  )

  useEffect(() => {
    if (open && projects[0] && (projectId === '' || !projects.some((p) => p.id === projectId))) {
      setProjectId(projects[0].id)
    }
  }, [open, projects, projectId])

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setTitle('')
          setAssignId(null)
          setBusy(false)
        }
      }}
    >
      <DialogContent
        className={cn(
          'max-h-[min(90vh,560px)] overflow-y-auto sm:max-w-md',
          'border border-border/60 bg-card/95 text-foreground shadow-xl backdrop-blur',
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">Add task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            New task for <span className="text-foreground/90">{formatDueHeading(dueYmd)}</span> — due
            date is set to the selected day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">Create a project in the Code Manager first.</p>
          )}
          {projects.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                  disabled={projects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input value={formatDueInputValue(dueYmd)} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  className="border-2 border-emerald-500/30 focus-visible:border-emerald-500/70"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !busy && title.trim()) {
                      e.preventDefault()
                    }
                  }}
                  placeholder="Task name"
                />
              </div>
              {selectedProject && (
                <MSC_Projectz_TaskAssigneeSelect
                  project={selectedProject}
                  value={assignId}
                  onChange={(next) => setAssignId(next ? String(next) : null)}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (!title.trim() || !projectId) return
              setBusy(true)
              try {
                await addTask(projectId, title.trim(), {
                  dueDate: dueYmd,
                  assignedTo: assignId,
                })
                onTaskCreated?.()
                setTitle('')
                setAssignId(null)
                onOpenChange(false)
              } finally {
                setBusy(false)
              }
            }}
            disabled={busy || projects.length === 0 || !title.trim() || !projectId}
            className="bg-msc-gold text-msc-gold-foreground hover:brightness-95"
          >
            {busy ? 'Saving…' : 'Add task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
