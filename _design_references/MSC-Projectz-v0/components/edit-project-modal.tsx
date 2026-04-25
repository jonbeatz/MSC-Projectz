'use client'

import { useState, useEffect } from 'react'
import { X, Upload, FolderOpen, Globe, ImageIcon, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EditProjectModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

export function EditProjectModal({ project, isOpen, onClose }: EditProjectModalProps) {
  const updateProject = useAppStore((s) => s.updateProject)
  
  const [name, setName] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [status, setStatus] = useState<'local' | 'live'>('local')
  const [activeTab, setActiveTab] = useState<'identity' | 'connectivity' | 'status'>('identity')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setThumbnail(project.thumbnail || '')
      setLocalPath(project.localPath)
      setLiveUrl(project.liveUrl || '')
      setStatus(project.status)
    }
  }, [project])

  const handleSave = () => {
    if (!project) return
    
    updateProject(project.id, {
      name,
      thumbnail: thumbnail || undefined,
      localPath,
      liveUrl: liveUrl || undefined,
      status,
    })
    onClose()
  }

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnail(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!project || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/80" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-border">
          <div className="grid grid-cols-3 rounded-lg p-1 bg-secondary">
            {(['identity', 'connectivity', 'status'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-2 rounded-md text-xs font-medium transition-colors capitalize",
                  activeTab === tab 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm text-muted-foreground">
                  Project Name
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Thumbnail</Label>
                <div className="flex gap-3">
                  <div className="w-32 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-secondary border border-border">
                    {thumbnail ? (
                      <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed transition-colors text-sm border-border text-muted-foreground hover:border-primary hover:text-primary">
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </div>
                    </label>
                    {thumbnail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setThumbnail('')}
                        className="text-xs text-muted-foreground"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connectivity Tab */}
          {activeTab === 'connectivity' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-path" className="text-sm flex items-center gap-2 text-muted-foreground">
                  <FolderOpen className="w-4 h-4" />
                  Local Path
                </Label>
                <Input
                  id="edit-path"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="C:\Projects\my-project"
                  className="font-mono text-sm bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-url" className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  Live URL
                </Label>
                <Input
                  id="edit-url"
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://myproject.com"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Project Status</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {status === 'live' ? 'Project is live and accessible online' : 'Project is in local development'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Local</span>
                    <Switch
                      checked={status === 'live'}
                      onCheckedChange={(checked) => setStatus(checked ? 'live' : 'local')}
                    />
                    <span className="text-xs text-primary">Live</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-2xl font-semibold text-foreground">{project.credentials.length}</p>
                  <p className="text-xs text-muted-foreground">Credentials</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-2xl font-semibold text-foreground">{project.tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-secondary/50">
          <Button 
            variant="ghost" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
