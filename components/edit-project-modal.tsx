'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, FolderOpen, Globe, ImageIcon, Save, Plus, Trash2, Link2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import type { Project, ProjectReference } from '@/lib/types'
import { cn } from '@/lib/utils'
import { msc_compressDataUrlImage } from '@/lib/msc_compress_thumbnail'
import { msc_createEmptyReference } from '@/lib/msc_project_references'

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
  const [localNotes, setLocalNotes] = useState('')
  const [liveNotes, setLiveNotes] = useState('')
  const [references, setReferences] = useState<ProjectReference[]>([])
  const [activeTab, setActiveTab] = useState<'identity' | 'connectivity' | 'status' | 'references'>('identity')
  const refFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setThumbnail(project.thumbnail || '')
      setLocalPath(project.localPath)
      setLiveUrl(project.liveUrl || '')
      setStatus(project.status)
      setLocalNotes(project.localNotes || '')
      setLiveNotes(project.liveNotes || '')
      setReferences(project.references ? [...project.references] : [])
    }
  }, [project])

  const handleSave = async () => {
    if (!project) return

    let thumb = thumbnail.trim()
    if (thumb.startsWith('data:image/')) {
      thumb = await msc_compressDataUrlImage(thumb)
    }

    await updateProject(project.id, {
      name,
      thumbnail: thumb || undefined,
      localPath,
      liveUrl: liveUrl || undefined,
      status,
      localNotes: localNotes.trim() || undefined,
      liveNotes: liveNotes.trim() || undefined,
      references,
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

  const msc_addReferenceLink = () => {
    const title = window.prompt('Label for this link', 'Documentation')?.trim()
    const url = window.prompt('URL (https://…)', 'https://')?.trim()
    if (!title || !url) return
    setReferences((prev) => [...prev, { ...msc_createEmptyReference('link', title), url }])
  }

  const handleReferenceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const max = 4 * 1024 * 1024
    if (file.size > max) {
      window.alert('File is larger than 4MB. Add a link instead, or use a smaller export.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setReferences((prev) => [
        ...prev,
        {
          ...msc_createEmptyReference('file', file.name),
          fileDataUrl: dataUrl,
          mime: file.type || 'application/octet-stream',
          fileName: file.name,
        },
      ])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
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
          <div className="grid grid-cols-4 rounded-lg p-1 bg-secondary">
            {(['identity', 'connectivity', 'status', 'references'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-2 py-2 rounded-md text-xs font-medium transition-colors capitalize",
                  activeTab === tab 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === 'references' ? 'Refs' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px] max-h-[60vh] overflow-y-auto">
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
              <div className="space-y-2">
                <Label htmlFor="edit-local-notes" className="text-xs text-muted-foreground">
                  Local / dev notes
                </Label>
                <Textarea
                  id="edit-local-notes"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  rows={3}
                  className="resize-y bg-input border-border text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-live-notes" className="text-xs text-muted-foreground">
                  Live / production notes
                </Label>
                <Textarea
                  id="edit-live-notes"
                  value={liveNotes}
                  onChange={(e) => setLiveNotes(e.target.value)}
                  rows={3}
                  className="resize-y bg-input border-border text-sm"
                />
              </div>
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

          {activeTab === 'references' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">Reference library</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Links, PDFs, images, or small docs stored with this project (kept in your local DB).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={msc_addReferenceLink}>
                  <Link2 className="w-3.5 h-3.5" />
                  Add link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => refFileInputRef.current?.click()}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add file
                </Button>
                <input
                  ref={refFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,video/*"
                  onChange={handleReferenceFile}
                />
              </div>
              {references.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No references yet.</p>
              ) : (
                <ul className="space-y-2">
                  {references.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border bg-secondary/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {r.kind === 'link' ? (
                            <Link2 className="w-3.5 h-3.5 shrink-0 text-primary" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
                          )}
                          <span className="truncate">{r.title}</span>
                        </div>
                        {r.kind === 'link' && r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline break-all"
                          >
                            {r.url}
                          </a>
                        )}
                        {r.kind === 'file' && r.fileName && (
                          <p className="text-xs text-muted-foreground mt-1">{r.fileName}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setReferences((prev) => prev.filter((x) => x.id !== r.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
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
