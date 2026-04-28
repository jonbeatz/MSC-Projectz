'use client'

import { format, parse } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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
import { MSC_TASK_STATUS_LABELS, msc_getTaskStatusLabel } from '@/lib/msc_task_status_labels'
import { useAppStore } from '@/lib/store'
import type { Project, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']

export function CalendarTaskEditDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  dayYmd,
  projects,
  onTaskUpdated,
  onTaskDeleted,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  projectId: string | null
  taskId: string | null
  dayYmd: string
  projects: Project[]
  onTaskUpdated?: () => void
  onTaskDeleted?: () => void
}) {
  const updateTaskFields = useAppStore((s) => s.updateTaskFields)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const storeProjects = useAppStore((s) => s.projects)

  const project: Project | null = projectId
    ? (storeProjects.find((p) => p.id === projectId) ?? projects.find((p) => p.id === projectId) ?? null)
    : null
  const task = project?.tasks.find((t) => t.id === taskId) ?? null

  const [title, setTitle] = useState('')
  const [dueYmd, setDueYmd] = useState(dayYmd)
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [assignId, setAssignId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !task || !project) return
    setTitle(task.title)
    setStatus((task.status || 'todo') as TaskStatus)
    if (task.dueDate) {
      const d = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
      if (!Number.isNaN(d.getTime())) {
        setDueYmd(format(d, 'yyyy-MM-dd'))
        return
      }
    }
    setDueYmd(dayYmd)
  }, [open, task, project, dayYmd])

  useEffect(() => {
    if (!open || !task) return
    setAssignId(task.assignedTo ? String(task.assignedTo.id) : null)
  }, [open, task])

  const onSave = async () => {
    if (!projectId || !taskId || !title.trim() || !project) return
    setBusy(true)
    try {
      const due = dueYmd.trim() === '' ? null : dueYmd.trim()
      await updateTaskFields(projectId, taskId, {
        title: title.trim(),
        assignedTo: assignId,
        dueDate: due,
        status,
        completed: status === 'done',
      })
      onTaskUpdated?.()
      onOpenChange(false)
    } catch (e) {
      console.error('[CalendarTaskEditDialog]', e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setBusy(false)
      }}
    >
      <DialogContent
        className={cn(
          'max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg',
          'border border-border/60 bg-card/95 text-foreground shadow-xl backdrop-blur',
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-msc-gold" />
            <DialogTitle>Edit task</DialogTitle>
          </div>
          <DialogDescription className="text-left text-muted-foreground">
            {project ? (
              <span>
                {project.name} — {dayYmd ? format(parse(dayYmd, 'yyyy-MM-dd', new Date()), 'PPP') : ''}
              </span>
            ) : (
              'Loading…'
            )}
          </DialogDescription>
        </DialogHeader>

        {!projectId || !taskId || !project || !task ? (
          <p className="text-sm text-muted-foreground">Task not found. Close and try again.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              {msc_getTaskStatusLabel(status)}
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                className="border-2 border-emerald-500/50 focus-visible:border-emerald-500/80"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void onSave()
                  }
                }}
                placeholder="Task name"
              />
            </div>

            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueYmd} onChange={(e) => setDueYmd(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {MSC_TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <MSC_Projectz_TaskAssigneeSelect
              project={project}
              value={assignId}
              onChange={(next) => setAssignId(next ? String(next) : null)}
            />
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
          {projectId && taskId && project && task && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-destructive hover:text-destructive sm:mr-auto sm:w-auto"
              onClick={async () => {
                if (!projectId || !taskId) return
                if (!window.confirm('Delete this task?')) return
                setBusy(true)
                try {
                  await deleteTask(projectId, taskId)
                  onTaskDeleted?.()
                  onOpenChange(false)
                } catch (e) {
                  console.error(e)
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          )}
          <div className="flex w-full flex-wrap justify-end gap-2 sm:ml-auto sm:w-auto">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void onSave()}
              disabled={busy || !title.trim() || !project}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              {busy ? 'Saving…' : 'Save task'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
