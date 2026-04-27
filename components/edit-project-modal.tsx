'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, FolderOpen, Globe, ImageIcon, Save, Plus, Trash2, Link2, FileText, Users, Send, Eye, EyeOff, Loader2, Shield } from 'lucide-react'
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
import { msc_listPayloadUsersForSettings } from '@/lib/msc_vault_user_admin'
import { msc_testProjectSmtpConnection } from '@/lib/msc_vault_server_actions'
import type { MscSmtpEncryption } from '@/lib/types'
import type { MscProjectMember, MscUserAdminRow } from '@/types/user-admin'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [availableUsers, setAvailableUsers] = useState<MscUserAdminRow[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'identity' | 'connectivity' | 'status' | 'files' | 'smtp'>('identity')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState(993)
  const [imapUsername, setImapUsername] = useState('')
  const [imapPassword, setImapPassword] = useState('')
  const [showImapPassword, setShowImapPassword] = useState(false)
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(465)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpEncryption, setSmtpEncryption] = useState<MscSmtpEncryption>('ssl')
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [emailTestMessage, setEmailTestMessage] = useState<string | null>(null)
  const [emailTestBusy, setEmailTestBusy] = useState(false)
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
      setSelectedMemberIds((project.members || []).map((member) => String(member.id)))
      const es = project.emailSettings
      if (es) {
        setImapHost(es.incoming?.host || '')
        setImapPort(typeof es.incoming?.port === 'number' && es.incoming.port > 0 ? es.incoming.port : 993)
        setImapUsername(es.incoming?.username || '')
        setImapPassword('')
        setSmtpHost(es.outgoing?.host || '')
        setSmtpPort(typeof es.outgoing?.port === 'number' && es.outgoing.port > 0 ? es.outgoing.port : 465)
        setSmtpUsername(es.outgoing?.username || '')
        setSmtpPassword('')
        setSmtpEncryption(es.outgoing?.encryption || 'ssl')
      } else {
        setImapHost('')
        setImapPort(993)
        setImapUsername('')
        setImapPassword('')
        setSmtpHost('')
        setSmtpPort(465)
        setSmtpUsername('')
        setSmtpPassword('')
        setSmtpEncryption('ssl')
      }
    }
  }, [project])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    const loadUsers = async () => {
      setMembersLoading(true)
      setMembersError(null)
      const result = await msc_listPayloadUsersForSettings()
      if (cancelled) return

      if (result.ok) {
        setAvailableUsers(result.users)
      } else {
        setAvailableUsers([])
        setMembersError(result.error)
      }
      setMembersLoading(false)
    }

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!project) return

    let thumb = thumbnail.trim()
    if (thumb.startsWith('data:image/')) {
      thumb = await msc_compressDataUrlImage(thumb)
    }

    const memberLookup = new Map(availableUsers.map((user) => [String(user.id), user]))
    const members: MscProjectMember[] = selectedMemberIds.map((id) => {
      const user = memberLookup.get(id)
      return {
        id,
        email: user?.email ?? null,
        username: user?.username ?? null,
        avatar: user?.avatar ?? null,
        avatarUrl: user?.avatarUrl ?? null,
      }
    })

    await updateProject(project.id, {
      name,
      thumbnail: thumb || undefined,
      localPath,
      liveUrl: liveUrl || undefined,
      status,
      localNotes: localNotes.trim() || undefined,
      liveNotes: liveNotes.trim() || undefined,
      references,
      members,
      emailSettings: {
        incoming: {
          host: imapHost.trim(),
          port: imapPort,
          username: imapUsername.trim(),
          password: imapPassword.trim() || project.emailSettings?.incoming.password || '',
        },
        outgoing: {
          host: smtpHost.trim(),
          port: smtpPort,
          username: smtpUsername.trim(),
          password: smtpPassword.trim() || project.emailSettings?.outgoing.password || '',
          encryption: smtpEncryption,
        },
      },
    })
    onClose()
  }

  const msc_testSmtp = async () => {
    if (!project) return
    setEmailTestMessage(null)
    setEmailTestBusy(true)
    const r = await msc_testProjectSmtpConnection(project.id, {
      host: smtpHost.trim(),
      port: smtpPort,
      username: smtpUsername.trim(),
      password: smtpPassword.trim() || undefined,
      encryption: smtpEncryption,
    })
    setEmailTestBusy(false)
    if (r.success) {
      setEmailTestMessage(r.message)
    } else {
      setEmailTestMessage(r.message)
    }
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

  const msc_toggleMember = (userId: string | number) => {
    const id = String(userId)
    setSelectedMemberIds((current) =>
      current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
    )
  }

  const msc_memberInitials = (user: MscUserAdminRow) => {
    const label = user.username?.trim() || user.email
    return label
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  }

  if (!project || !isOpen) return null

  const rawOwner = project.ownerUserId ?? (project as Project & { owner?: string | number | { id: string | number } }).owner
  const ownerId =
    rawOwner && typeof rawOwner === 'object' && 'id' in rawOwner
      ? String(rawOwner.id)
      : rawOwner !== undefined && rawOwner !== null
        ? String(rawOwner)
        : null
  const selectedMemberIdSet = new Set(selectedMemberIds)
  const addableUsers = availableUsers.filter((user) => {
    const userId = String(user.id)
    return userId !== ownerId && !selectedMemberIdSet.has(userId)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/80" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">
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
          <div className="grid grid-cols-5 gap-0.5 rounded-lg p-1 bg-secondary">
            {(
              [
                { id: 'identity' as const, label: 'Identity' },
                { id: 'connectivity' as const, label: 'Connect' },
                { id: 'status' as const, label: 'Status' },
                { id: 'files' as const, label: 'Files' },
                { id: 'smtp' as const, label: 'SMTP' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'px-1.5 py-2 rounded-md text-[11px] font-medium transition-colors sm:text-xs',
                  activeTab === id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
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

              <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
                <div>
                  <Label className="flex items-center gap-2 text-sm text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    Project Members
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add collaborators who should appear on this project.
                  </p>
                </div>

                {selectedMemberIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMemberIds.map((memberId) => {
                      const user = availableUsers.find((candidate) => String(candidate.id) === memberId)
                      return (
                        <button
                          key={memberId}
                          type="button"
                          onClick={() => msc_toggleMember(memberId)}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:border-destructive hover:text-destructive"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                            {user ? msc_memberInitials(user) : memberId.slice(0, 2).toUpperCase()}
                          </span>
                          {user?.username || user?.email || `User ${memberId}`}
                          <X className="h-3 w-3" />
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="grid gap-2">
                  {membersLoading ? (
                    <p className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                      Loading workspace users...
                    </p>
                  ) : membersError ? (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {membersError}
                    </p>
                  ) : addableUsers.length === 0 ? (
                    <p className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                      No users available.
                    </p>
                  ) : (
                    addableUsers.map((user) => {
                      return (
                        <button
                          key={String(user.id)}
                          type="button"
                          onClick={() => msc_toggleMember(user.id)}
                          className={cn(
                            'flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
                            'border-border bg-card text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-semibold text-foreground">
                              {msc_memberInitials(user)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm">{user.username || user.email}</span>
                              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                            </span>
                          </span>
                          <span className="text-xs">Add</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connectivity Tab — paths only */}
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
                  placeholder="Enter the project root path"
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

          {activeTab === 'smtp' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Per-project mail. Leave a password field blank to keep the current saved value.
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border bg-[#1c1c1c] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Incoming mail (IMAP)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Host</Label>
                      <Input
                        value={imapHost}
                        onChange={(e) => setImapHost(e.target.value)}
                        placeholder="mail.example.com"
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Port</Label>
                      <Input
                        type="number"
                        min={1}
                        max={65535}
                        value={Number.isFinite(imapPort) ? imapPort : 993}
                        onChange={(e) => setImapPort(parseInt(e.target.value, 10) || 0)}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Username</Label>
                    <Input
                      value={imapUsername}
                      onChange={(e) => setImapUsername(e.target.value)}
                      className="bg-input border-border text-foreground"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        type={showImapPassword ? 'text' : 'password'}
                        value={imapPassword}
                        onChange={(e) => setImapPassword(e.target.value)}
                        className="bg-input border-border pr-10 text-foreground"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowImapPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                        aria-label={showImapPassword ? 'Hide password' : 'Show password'}
                      >
                        {showImapPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-[#1c1c1c] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Outgoing mail (SMTP)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Host</Label>
                      <Input
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="mail.example.com"
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Port</Label>
                      <Input
                        type="number"
                        min={1}
                        max={65535}
                        value={Number.isFinite(smtpPort) ? smtpPort : 465}
                        onChange={(e) => setSmtpPort(parseInt(e.target.value, 10) || 0)}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Username</Label>
                    <Input
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      className="bg-input border-border text-foreground"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        type={showSmtpPassword ? 'text' : 'password'}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        className="bg-input border-border pr-10 text-foreground"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                        aria-label={showSmtpPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Encryption</span>
                    <Select
                      value={smtpEncryption}
                      onValueChange={(v) => setSmtpEncryption(v as MscSmtpEncryption)}
                    >
                      <SelectTrigger className="w-full border-border bg-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssl">SSL (e.g. 465)</SelectItem>
                        <SelectItem value="tls">TLS / STARTTLS (e.g. 587)</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {emailTestMessage && <p className="text-xs text-muted-foreground">{emailTestMessage}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={msc_testSmtp}
                  disabled={emailTestBusy}
                >
                  {emailTestBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Test outgoing (SMTP) connection
                </Button>
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

          {activeTab === 'files' && (
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
