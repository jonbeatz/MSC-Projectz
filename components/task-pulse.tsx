'use client'

import { useState } from 'react'
import { Plus, X, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import type { Project } from '@/lib/types'

interface TaskPulseProps {
  project: Project
}

export function TaskPulse({ project }: TaskPulseProps) {
  const { addTask, toggleTask, deleteTask } = useAppStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      await addTask(project.id, newTaskTitle.trim())
      setNewTaskTitle('')
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleAddTask()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTaskTitle('')
    }
  }

  const completedCount = project.tasks.filter((t) => t.completed).length
  const totalCount = project.tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm text-foreground">Task Pulse</h3>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {!isAdding && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="px-4 py-2 border-b border-border bg-secondary/50">
          <div className="h-1.5 rounded-full overflow-hidden bg-secondary">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#DA9516]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="max-h-64 overflow-y-auto">
        {project.tasks.length === 0 && !isAdding ? (
          <div className="px-4 py-8 text-center">
            <Circle className="w-8 h-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tasks yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs mt-1 text-primary"
            >
              Add your first task
            </button>
          </div>
        ) : (
          <ul>
            {project.tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-border hover:bg-secondary/50"
              >
                <button
                  type="button"
                  onClick={() => void toggleTask(project.id, task.id)}
                  className="shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 transition-colors text-muted-foreground hover:text-primary" />
                  )}
                </button>
                <span
                  className={cn(
                    'flex-1 text-sm transition-colors',
                    task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => void deleteTask(project.id, task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 transition-all text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add Task Input */}
        {isAdding && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-border">
            <Input
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm bg-input border-border text-foreground"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void handleAddTask()}
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setIsAdding(false)
                setNewTaskTitle('')
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
