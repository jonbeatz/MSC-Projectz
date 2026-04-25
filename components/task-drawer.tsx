'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Pencil,
  FolderOpen,
  Circle,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getSafePath } from '@/lib/env-utils'
import type { Project, Task, TaskStatus } from '@/lib/types'

interface TaskDrawerProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

// Status configuration with Tailwind classes
const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; colorClass: string; bgClass: string }> = {
  'todo': { 
    label: 'To Do', 
    icon: Circle, 
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50'
  },
  'in-progress': { 
    label: 'In Progress', 
    icon: Clock, 
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10'
  },
  'done': { 
    label: 'Done', 
    icon: CheckCircle2, 
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10'
  },
}

export function TaskDrawer({ isOpen, onClose, project }: TaskDrawerProps) {
  const [newTaskText, setNewTaskText] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  
  const addTask = useAppStore((s) => s.addTask)
  const cycleTaskStatus = useAppStore((s) => s.cycleTaskStatus)
  const updateTaskTitle = useAppStore((s) => s.updateTaskTitle)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const appSettings = useAppStore((s) => s.appSettings)
  const projects = useAppStore((s) => s.projects)
  
  // Get live project data from store
  const liveProject = projects.find(p => p.id === project?.id) || project
  
  const isDark = appSettings.theme === 'dark'
  
  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTaskId])
  
  const handleAddTask = async () => {
    if (!newTaskText.trim() || !liveProject) return
    await addTask(liveProject.id, newTaskText.trim())
    setNewTaskText('')
  }

  const handleCycleStatus = async (taskId: string) => {
    if (!liveProject) return
    await cycleTaskStatus(liveProject.id, taskId)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!liveProject) return
    await deleteTask(liveProject.id, taskId)
  }
  
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingText(task.title)
  }
  
  const handleSaveEdit = async () => {
    if (!liveProject || !editingTaskId || !editingText.trim()) {
      setEditingTaskId(null)
      return
    }
    await updateTaskTitle(liveProject.id, editingTaskId, editingText.trim())
    setEditingTaskId(null)
    setEditingText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') void handleAddTask()
      else void handleSaveEdit()
    }
    if (e.key === 'Escape' && action === 'edit') {
      setEditingTaskId(null)
    }
  }
  
  if (!liveProject) return null
  
  // Separate tasks by status
  const todoTasks = liveProject.tasks.filter(t => (t.status || 'todo') === 'todo' && !t.archived)
  const inProgressTasks = liveProject.tasks.filter(t => t.status === 'in-progress' && !t.archived)
  const doneTasks = liveProject.tasks.filter(t => t.status === 'done' || t.archived)
  
  const totalTasks = liveProject.tasks.length
  const completedCount = doneTasks.length
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  const renderTask = (task: Task) => {
    const status = task.status || 'todo'
    const config = statusConfig[status]
    const StatusIcon = config.icon
    const isDone = status === 'done'
    const isInProgress = status === 'in-progress'
    
    return (
      <div 
        key={task.id}
        className={cn(
          'group flex items-center gap-3 p-3 rounded-lg transition-all border',
          isDone && 'opacity-60',
          isInProgress 
            ? 'bg-amber-500/5 border-amber-500/30' 
            : 'bg-secondary border-border'
        )}
      >
        {/* Status Badge - Clickable */}
        <button
          type="button"
          onClick={() => void handleCycleStatus(task.id)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:scale-105 shrink-0",
            config.bgClass
          )}
          title={`Status: ${config.label} (click to change)`}
        >
          <StatusIcon className={cn("w-3.5 h-3.5", config.colorClass)} />
          <span className={cn("text-[10px] font-medium uppercase tracking-wider", config.colorClass)}>
            {config.label}
          </span>
        </button>
        
        {/* Task Title - Editable */}
        {editingTaskId === task.id ? (
          <Input
            ref={editInputRef}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'edit')}
            onBlur={handleSaveEdit}
            className="flex-1 h-8 text-sm bg-card border-primary text-foreground"
          />
        ) : (
          <span 
            className={cn(
              'flex-1 text-sm cursor-pointer transition-colors hover:opacity-80',
              isDone ? 'line-through text-muted-foreground' : 'text-foreground'
            )}
            onClick={() => handleStartEdit(task)}
          >
            {task.title}
          </span>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleStartEdit(task)}
            className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteTask(task.id)}
            className="p-1.5 rounded transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 z-50 transition-opacity duration-300 bg-black/50',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-screen w-full max-w-md z-50 transform transition-transform duration-300 ease-out flex flex-col',
          'bg-background border-l border-border',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 shrink-0 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{liveProject.name}</h2>
              <p className="text-xs truncate max-w-[200px] text-muted-foreground">
                {getSafePath(liveProject.localPath)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Summary */}
        <div className="p-4 shrink-0 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Task Progress</span>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-muted">
            <div 
              className="h-full rounded-full transition-all duration-300 bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Circle className="w-3 h-3 text-muted-foreground" />
              {todoTasks.length} To Do
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              {inProgressTasks.length} In Progress
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              {doneTasks.length} Done
            </span>
          </div>
        </div>
        
        {/* Add Task Input */}
        <div className="p-4 shrink-0 border-b border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'add')}
              className="text-base bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="button"
              onClick={() => void handleAddTask()}
              disabled={!newTaskText.trim()}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Task List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* To Do Tasks */}
          {todoTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 text-muted-foreground">
                <Circle className="w-3 h-3" />
                To Do ({todoTasks.length})
              </h3>
              <div className="space-y-2">
                {todoTasks.map(renderTask)}
              </div>
            </div>
          )}
          
          {/* In Progress Tasks */}
          {inProgressTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 text-amber-500">
                <Clock className="w-3 h-3" />
                In Progress ({inProgressTasks.length})
              </h3>
              <div className="space-y-2">
                {inProgressTasks.map(renderTask)}
              </div>
            </div>
          )}
          
          {/* Done Tasks */}
          {doneTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-3 h-3" />
                Done ({doneTasks.length})
              </h3>
              <div className="space-y-2">
                {doneTasks.map(renderTask)}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {todoTasks.length === 0 && inProgressTasks.length === 0 && doneTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-secondary">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium mb-1 text-foreground">No Tasks Yet</h3>
              <p className="text-sm text-center max-w-xs text-muted-foreground">
                Add your first task using the input above
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
