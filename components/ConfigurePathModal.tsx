'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ConfigurePathModalProps {
  isOpen: boolean
  initialPath?: string
  projectName?: string
  onClose: () => void
  onSave: (localPath: string) => Promise<void> | void
}

export function ConfigurePathModal({
  isOpen,
  initialPath = '',
  projectName,
  onClose,
  onSave,
}: ConfigurePathModalProps) {
  const [localPath, setLocalPath] = useState(initialPath)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setLocalPath(initialPath)
  }, [initialPath, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextPath = localPath.trim()
    if (!nextPath || isSaving) return
    setIsSaving(true)
    try {
      await onSave(nextPath)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="msc-configure-path-title"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg border border-border bg-secondary/50 p-2 text-primary">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 id="msc-configure-path-title" className="text-base font-semibold text-foreground">
                Configure Local Path
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {projectName ? `Set the local workspace path for ${projectName}.` : 'Set the local workspace path.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close configure path modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label htmlFor="msc-local-path" className="mb-2 block text-sm font-medium text-foreground">
          Local Path
        </label>
        <Input
          id="msc-local-path"
          value={localPath}
          onChange={(e) => setLocalPath(e.target.value)}
          placeholder="Enter the project root path"
          className="bg-background text-foreground"
          autoFocus
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="msc-cta-initialize"
            disabled={isSaving || !localPath.trim()}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
