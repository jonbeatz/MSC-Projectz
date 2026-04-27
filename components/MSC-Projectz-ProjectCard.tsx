'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  FolderOpen,
  Key,
  MonitorPlay,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Credential, Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { getSafePath } from '@/lib/env-utils'
import { msc_open_project_folder } from '@/lib/msc_native_system_bridge'
import { msc_getScopedKey } from '@/lib/msc_scoped_storage'
import { MscManualProjectMoveControls, type MscManualProjectMove } from '@/components/msc_ManualProjectMoveControls'

export interface MSC_Projectz_ProjectCardProps {
  project: Project
  onSelect: () => void
  onDelete: () => void
  onOpenVault: () => void
  onEdit: () => void
  onOpenTaskDrawer?: () => void
  /** Manual reorder (dashboard): only when sort mode is manual and user may swap with neighbor. */
  manualMove?: MscManualProjectMove
}

function msc_taskCounts(project: Project) {
  const tasks = project.tasks.filter((t) => !t.archived)
  let todo = 0
  let inProgress = 0
  let done = 0
  for (const t of tasks) {
    const s = t.status || 'todo'
    if (s === 'done' || t.completed) done += 1
    else if (s === 'in-progress') inProgress += 1
    else todo += 1
  }
  const total = tasks.length
  return { todo, inProgress, done, total }
}

function msc_projectMemberLabel(member: NonNullable<Project['members']>[number]) {
  return member.username?.trim() || member.email?.trim() || `User ${String(member.id)}`
}

function msc_projectMemberInitials(member: NonNullable<Project['members']>[number]) {
  return msc_projectMemberLabel(member)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export function MSC_Projectz_ProjectCard({
  project,
  onSelect,
  onDelete,
  onOpenVault,
  onEdit,
  onOpenTaskDrawer,
  manualMove,
}: MSC_Projectz_ProjectCardProps) {
  const appSettings = useAppStore((s) => s.appSettings)
  const userId = useAppStore((s) => s.user?.payloadUserId)
  const addTask = useAppStore((s) => s.addTask)
  const isDark = appSettings.theme === 'dark'

  const [credPopoverOpen, setCredPopoverOpen] = useState(false)
  const [visibleCredentialIds, setVisibleCredentialIds] = useState<Record<string, boolean>>({})
  const [managedCredentials, setManagedCredentials] = useState<Credential[]>(project.credentials)
  const [credentialProjectId, setCredentialProjectId] = useState(project.id)
  const [credentialsLoaded, setCredentialsLoaded] = useState(false)
  const [credentialFormOpen, setCredentialFormOpen] = useState(false)
  const [newCredentialLabel, setNewCredentialLabel] = useState('')
  const [newCredentialUsername, setNewCredentialUsername] = useState('')
  const [newCredentialPassword, setNewCredentialPassword] = useState('')
  const [showNewCredentialPassword, setShowNewCredentialPassword] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const [injectOpen, setInjectOpen] = useState(false)
  const [injectTitle, setInjectTitle] = useState('')
  const [injectBusy, setInjectBusy] = useState(false)

  const counts = useMemo(() => msc_taskCounts(project), [project])
  const safeLocalPath = getSafePath(project.localPath)
  const credentialStorageBaseKey = `msc-projectz-credentials-${project.id}`

  useEffect(() => {
    setCredentialsLoaded(false)
    if (userId === undefined || userId === null) {
      setManagedCredentials([])
      setCredentialProjectId(project.id)
      setVisibleCredentialIds({})
      setCredentialFormOpen(false)
      setShowNewCredentialPassword(false)
      return
    }

    const credentialStorageKey = msc_getScopedKey(credentialStorageBaseKey, userId)

    try {
      const stored = window.localStorage.getItem(credentialStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Credential[]
        if (Array.isArray(parsed)) {
          setManagedCredentials(parsed)
        }
      } else {
        setManagedCredentials(project.credentials)
      }
    } catch (error) {
      console.error('[MSC] Failed to load project credentials', error)
      setManagedCredentials(project.credentials)
    }

    setCredentialProjectId(project.id)
    setVisibleCredentialIds({})
    setCredentialFormOpen(false)
    setShowNewCredentialPassword(false)
    setCredentialsLoaded(true)
  }, [credentialStorageBaseKey, project.credentials, project.id, userId])

  useEffect(() => {
    if (!credentialsLoaded) return
    if (credentialProjectId !== project.id) return
    if (userId === undefined || userId === null) return

    const credentialStorageKey = msc_getScopedKey(credentialStorageBaseKey, userId)
    window.localStorage.setItem(credentialStorageKey, JSON.stringify(managedCredentials))
  }, [credentialProjectId, credentialStorageBaseKey, credentialsLoaded, managedCredentials, project.id, userId])

  const handleOpenInExplorer = async () => {
    if (!safeLocalPath.trim()) return
    void msc_open_project_folder(safeLocalPath).catch((err) => {
      console.error('[MSC] msc_open_project_folder', err)
    })

    try {
      await navigator.clipboard.writeText(safeLocalPath)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('[MSC] copy project path', err)
    }
  }

  const handleOpenLiveUrl = () => {
    if (project.liveUrl) {
      window.open(project.liveUrl, '_blank')
    }
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.status === 'done' || t.completed).length

  const msc_copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      console.error('[MSC] clipboard', e)
    }
  }, [])

  const msc_addManagedCredential = () => {
    const label = newCredentialLabel.trim()
    const username = newCredentialUsername.trim()
    const password = newCredentialPassword
    if (!label || !username || !password) return

    const credential: Credential = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `credential-${Date.now()}`,
      label,
      username,
      password,
    }

    setManagedCredentials((current) => [...current, credential])
    setNewCredentialLabel('')
    setNewCredentialUsername('')
    setNewCredentialPassword('')
    setShowNewCredentialPassword(false)
    setCredentialFormOpen(false)
  }

  const msc_deleteManagedCredential = (credentialId: string) => {
    setManagedCredentials((current) => current.filter((credential) => credential.id !== credentialId))
    setVisibleCredentialIds((current) => {
      const next = { ...current }
      delete next[credentialId]
      return next
    })
  }

  const msc_submitQuickTask = async () => {
    const title = injectTitle.trim()
    if (!title || injectBusy) return
    setInjectBusy(true)
    try {
      await addTask(project.id, title)
      setInjectTitle('')
      setInjectOpen(false)
    } catch (e) {
      console.error('[MSC] addTask', e)
    } finally {
      setInjectBusy(false)
    }
  }

  const todoPct = counts.total > 0 ? (counts.todo / counts.total) * 100 : 0
  const inProgressPct = counts.total > 0 ? (counts.inProgress / counts.total) * 100 : 0
  const donePct = counts.total > 0 ? (counts.done / counts.total) * 100 : 0
  const projectMembers = project.members || []

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer',
        'bg-card border border-border',
        !isDark && 'card-shadow hover:card-shadow-lg',
      )}
      onClick={onSelect}
    >
      <div className="aspect-video relative overflow-hidden bg-secondary">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-muted">
              <MonitorPlay className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}

        <Badge
          className={cn(
            'absolute top-3 right-3 uppercase text-[10px] font-semibold tracking-wider border-0',
            project.status === 'live'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {project.status}
        </Badge>

        <div
          className={cn(
            'absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2',
            isDark ? 'bg-background/90' : 'bg-background/95',
          )}
        >
          <Button
            size="sm"
            title="Edit Project"
            aria-label="Edit Project"
            className="h-8 text-xs gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Settings className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={(e) => {
              e.stopPropagation()
              void handleOpenInExplorer()
            }}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <FolderOpen className="w-3.5 h-3.5" />}
            Explorer
          </Button>
          {project.liveUrl && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenLiveUrl()
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live
            </Button>
          )}
        </div>

        {manualMove && (
          <MscManualProjectMoveControls
            layout="card"
            isDark={isDark}
            manualMove={manualMove}
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-foreground">{project.name}</h3>
            {safeLocalPath.trim() ? (
              <p className="text-xs truncate mt-0.5 text-muted-foreground">{safeLocalPath}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground/90">No local path — use Edit to set one</p>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <Popover
              open={credPopoverOpen}
              onOpenChange={(open) => {
                setCredPopoverOpen(open)
                if (!open) {
                  setVisibleCredentialIds({})
                  setCredentialFormOpen(false)
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 text-muted-foreground hover:text-primary',
                    credPopoverOpen && 'text-primary',
                  )}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Open credential quick-view"
                >
                  <Key className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="z-50 w-72 rounded-md border border-[#2a2a2a] bg-[#1c1c1c] p-4 text-foreground shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-3 font-sans text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Credential Manager</p>
                      <h4 className="mt-1 font-medium text-foreground">{project.name}</h4>
                    </div>
                    <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                      {managedCredentials.length}
                    </span>
                  </div>

                  {managedCredentials.length === 0 ? (
                    <p className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                      No credentials saved for this project.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {managedCredentials.map((credential) => {
                        const passwordVisible = Boolean(visibleCredentialIds[credential.id])

                        return (
                          <div
                            key={credential.id}
                            className="rounded-md border border-[#2a2a2a] bg-background/70 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <h5 className="truncate text-sm font-medium text-foreground">
                                {credential.label}
                              </h5>
                              <button
                                type="button"
                                onClick={() => msc_deleteManagedCredential(credential.id)}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                aria-label={`Delete ${credential.label}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Username</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <p className="min-w-0 flex-1 break-all text-sm text-foreground">
                                    {credential.username || '—'}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => msc_copyText(credential.username)}
                                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                    aria-label={`Copy ${credential.label} username`}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">Password</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <p className="min-w-0 flex-1 break-all text-left text-sm text-foreground">
                                    {passwordVisible ? credential.password || '—' : '••••••••'}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVisibleCredentialIds((current) => ({
                                        ...current,
                                        [credential.id]: !current[credential.id],
                                      }))
                                    }
                                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                    aria-label={passwordVisible ? `Hide ${credential.label} password` : `Show ${credential.label} password`}
                                  >
                                    {passwordVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => msc_copyText(credential.password)}
                                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                    aria-label={`Copy ${credential.label} password`}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {credentialFormOpen ? (
                    <div className="space-y-3 rounded-md border border-[#2a2a2a] bg-background/70 p-3">
                      <Input
                        value={newCredentialLabel}
                        onChange={(e) => setNewCredentialLabel(e.target.value)}
                        placeholder="Label, e.g. Client Access"
                        className="bg-[#1c1c1c] text-sm text-foreground"
                      />
                      <Input
                        value={newCredentialUsername}
                        onChange={(e) => setNewCredentialUsername(e.target.value)}
                        placeholder="Username"
                        className="bg-[#1c1c1c] text-sm text-foreground"
                      />
                      <div className="relative">
                        <Input
                          value={newCredentialPassword}
                          onChange={(e) => setNewCredentialPassword(e.target.value)}
                          placeholder="Password"
                          type={showNewCredentialPassword ? 'text' : 'password'}
                          className="bg-[#1c1c1c] pr-10 text-sm text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewCredentialPassword((value) => !value)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={showNewCredentialPassword ? 'Hide new credential password' : 'Show new credential password'}
                        >
                          {showNewCredentialPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={msc_addManagedCredential}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCredentialFormOpen(false)
                            setShowNewCredentialPassword(false)
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setCredentialFormOpen(true)}
                        className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New +
                      </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenVault()
                  }}
                  className="cursor-pointer"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Open Vault
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleOpenInExplorer()
                  }}
                  className="cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4 mr-2" /> : <FolderOpen className="w-4 h-4 mr-2" />}
                  Explorer
                </DropdownMenuItem>
                {project.liveUrl && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenLiveUrl()
                    }}
                    className="cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Live URL
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="cursor-pointer text-muted-foreground focus:text-primary"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3">
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {projectMembers.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {projectMembers.slice(0, 4).map((member) => {
                      const label = msc_projectMemberLabel(member)
                      return (
                        <span
                          key={String(member.id)}
                          className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-card bg-secondary text-[10px] font-semibold text-foreground ring-1 ring-border"
                          title={label}
                        >
                          {member.avatarUrl || member.avatar ? (
                            <img
                              src={member.avatarUrl || member.avatar || ''}
                              alt={label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            msc_projectMemberInitials(member)
                          )}
                        </span>
                      )
                    })}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {projectMembers.length} member{projectMembers.length === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                  }}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-dashed border-border bg-secondary/50 px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  title="Quick-add a project member"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add member
                </button>
              )}
            </div>
            {projectMembers.length > 4 && (
              <span className="rounded-full border border-border bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
                +{projectMembers.length - 4}
              </span>
            )}
          </div>
        </div>

        <div
          className="mt-3 pt-3 border-t border-border space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-2 w-full flex-row overflow-hidden rounded-full border border-border bg-muted">
            {counts.total === 0 ? (
              <div className="h-full w-full bg-muted" />
            ) : (
              <>
                {counts.todo > 0 && (
                  <div
                    className="h-full shrink-0 bg-muted-foreground/35 transition-all"
                    style={{ width: `${todoPct}%` }}
                    title={`To do: ${counts.todo}`}
                  />
                )}
                {counts.inProgress > 0 && (
                  <div
                    className="h-full shrink-0 bg-msc-gold transition-all"
                    style={{ width: `${inProgressPct}%` }}
                    title={`In progress: ${counts.inProgress}`}
                  />
                )}
                {counts.done > 0 && (
                  <div
                    className="h-full shrink-0 bg-primary transition-all"
                    style={{ width: `${donePct}%` }}
                    title={`Done: ${counts.done}`}
                  />
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              <span className="inline-block size-2 rounded-sm bg-muted-foreground/35 align-middle mr-1" />
              {counts.todo} todo
            </span>
            <span>
              <span
                className="inline-block size-2 rounded-sm align-middle mr-1 bg-msc-gold"
                aria-hidden
              />
              {counts.inProgress} in progress
            </span>
            <span>
              <span className="inline-block size-2 rounded-sm bg-primary align-middle mr-1" />
              {counts.done} done
            </span>
            <span className="text-foreground/80">· {counts.total} total</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Key className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {managedCredentials.length} credentials
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenTaskDrawer?.()
                }}
                className="flex items-center gap-1.5 transition-transform hover:scale-105"
                title="Open task drawer"
              >
                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="none" className="stroke-muted" strokeWidth="2" />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="2"
                    strokeDasharray={`${(completedTasks / Math.max(totalTasks, 1)) * 50.3} 50.3`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {completedTasks}/{totalTasks} tasks
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                aria-label="Quick add task"
                onClick={(e) => {
                  e.stopPropagation()
                  setInjectOpen((o) => !o)
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {injectOpen && (
            <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <Input
                placeholder="New task title…"
                value={injectTitle}
                onChange={(e) => setInjectTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void msc_submitQuickTask()
                  if (e.key === 'Escape') {
                    setInjectOpen(false)
                    setInjectTitle('')
                  }
                }}
                className="h-8 text-sm"
                disabled={injectBusy}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0"
                disabled={injectBusy || !injectTitle.trim()}
                onClick={() => void msc_submitQuickTask()}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

