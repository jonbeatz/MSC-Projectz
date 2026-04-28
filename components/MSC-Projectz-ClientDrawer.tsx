'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  FolderKanban,
  Loader2,
  Sparkles,
} from 'lucide-react'

import {
  msc_getClient,
  msc_getClientPulse,
  msc_updateClientChecklist,
} from '@/lib/msc_client_actions'
import type {
  MscClientDetail,
  MscClientPulseStats,
  OnboardingChecklist,
} from '@/lib/msc_client_types'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { msc_isQuietInfrastructureUiMessage, msc_publicPayloadError } from '@/lib/msc_public_error'
import { cn } from '@/lib/utils'

function msc_statusBadgeVariant(
  s: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'active') return 'default'
  if (s === 'onboarding') return 'secondary'
  if (s === 'archived') return 'outline'
  return 'secondary'
}

export type MSC_Projectz_ClientDrawerTab = 'details' | 'pulse' | 'vault'

export type MSC_Projectz_ClientDrawerProps = {
  clientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When the sheet opens, selects this tab (e.g. Vault deep-link from Task Pulse). */
  initialTab?: MSC_Projectz_ClientDrawerTab
}

function PulseStatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-secondary/25 px-3 py-3 backdrop-blur-sm',
        'shadow-sm',
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function MSC_Projectz_ClientDrawer({
  clientId,
  open,
  onOpenChange,
  initialTab = 'details',
}: MSC_Projectz_ClientDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<MscClientDetail | null>(null)

  const [pulseLoading, setPulseLoading] = useState(false)
  const [pulseError, setPulseError] = useState<string | null>(null)
  const [pulse, setPulse] = useState<MscClientPulseStats | null>(null)

  const [checklist, setChecklist] = useState<OnboardingChecklist>([])
  const [checklistSavingId, setChecklistSavingId] = useState<string | null>(null)
  const [checklistError, setChecklistError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<MSC_Projectz_ClientDrawerTab>('details')

  useEffect(() => {
    if (open && clientId) {
      setActiveTab(initialTab)
    }
  }, [open, clientId, initialTab])

  useEffect(() => {
    if (!open || !clientId) {
      setDetail(null)
      setError(null)
      setPulse(null)
      setPulseError(null)
      setChecklist([])
      setChecklistError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void msc_getClient(clientId).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setDetail(null)
        setError(res.error)
        return
      }
      setDetail(res.client)
      setChecklist(res.client.onboardingChecklist)
    })
    return () => {
      cancelled = true
    }
  }, [open, clientId])

  useEffect(() => {
    if (!open || !clientId) {
      setPulse(null)
      return
    }
    let cancelled = false
    setPulseLoading(true)
    setPulseError(null)
    void msc_getClientPulse(clientId).then((res) => {
      if (cancelled) return
      setPulseLoading(false)
      if (!res.ok) {
        setPulse(null)
        setPulseError(res.error)
        return
      }
      setPulse(res.pulse)
    })
    return () => {
      cancelled = true
    }
  }, [open, clientId])

  const onToggleChecklist = useCallback(
    async (itemId: string, completed: boolean) => {
      if (!clientId) return
      const prev = checklist
      const next = prev.map((x) => (x.id === itemId ? { ...x, completed } : x))
      setChecklist(next)
      setChecklistSavingId(itemId)
      setChecklistError(null)
      const res = await msc_updateClientChecklist(clientId, next)
      setChecklistSavingId(null)
      if (!res.ok) {
        setChecklist(prev)
        setChecklistError(res.error)
        return
      }
      setDetail((d) => (d ? { ...d, onboardingChecklist: next } : d))
    },
    [clientId, checklist],
  )

  const title = detail?.name ?? 'Client'
  const status = detail?.status ?? ''

  const noProjects = pulse && pulse.totalProjects === 0

  const onboardingDone = checklist.filter((x) => x.completed).length
  const onboardingTotal = Math.max(checklist.length, 1)
  const linkedProjectCount = detail?.projectIds?.length ?? 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-xl',
        )}
      >
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg leading-tight">{loading ? 'Loading…' : title}</SheetTitle>
              <SheetDescription className="sr-only">MSC CRM client detail</SheetDescription>
              {!loading && detail && (
                <Badge variant={msc_statusBadgeVariant(status)} className="mt-2 capitalize">
                  {status}
                </Badge>
              )}
            </div>
          </div>
          {error && !msc_isQuietInfrastructureUiMessage(error) ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {msc_publicPayloadError(error)}
            </p>
          ) : null}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading && (
            <div className="flex flex-1 items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span className="text-sm">Loading client…</span>
            </div>
          )}

          {!loading && detail && (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as MSC_Projectz_ClientDrawerTab)}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <TabsList className="w-full shrink-0 justify-start rounded-none border-b border-border bg-background/60 px-4 py-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="pulse">Pulse</TabsTrigger>
                <TabsTrigger value="vault">Vault</TabsTrigger>
              </TabsList>

              <TabsContent
                value="details"
                className="mt-0 flex-1 overflow-y-auto px-4 py-4 text-sm text-muted-foreground"
              >
                <dl className="space-y-3">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Primary contact</dt>
                    <dd className="mt-1 text-foreground">{detail.primaryContact.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
                    <dd className="mt-1 text-foreground">{detail.primaryContact.email}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</dt>
                    <dd className="mt-1 text-foreground">
                      {detail.primaryContact.phone?.trim()
                        ? detail.primaryContact.phone
                        : <span className="text-muted-foreground">Not on file</span>}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8 rounded-xl border border-border/80 bg-secondary/10 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Onboarding</h3>
                    <span className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                      {onboardingDone}/{onboardingTotal} complete
                    </span>
                  </div>
                  {checklistError && !msc_isQuietInfrastructureUiMessage(checklistError) ? (
                    <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive" role="alert">
                      {msc_publicPayloadError(checklistError)}
                    </p>
                  ) : checklistError && msc_isQuietInfrastructureUiMessage(checklistError) ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Checklist couldn&apos;t sync—try again after refresh.
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-3">
                    {checklist.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`msc-onboarding-${detail.id}-${item.id}`}
                          checked={item.completed}
                          disabled={checklistSavingId === item.id}
                          onCheckedChange={(v) => void onToggleChecklist(item.id, v === true)}
                          className="mt-0.5"
                          aria-label={item.label}
                        />
                        <Label
                          htmlFor={`msc-onboarding-${detail.id}-${item.id}`}
                          className={cn(
                            'cursor-pointer text-sm font-normal leading-snug text-foreground',
                            item.completed && 'text-muted-foreground line-through',
                          )}
                        >
                          {item.label}
                          {checklistSavingId === item.id ? (
                            <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin align-middle text-muted-foreground" aria-hidden />
                          ) : null}
                        </Label>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent
                value="pulse"
                className="mt-0 flex-1 overflow-y-auto px-4 py-4 text-sm text-muted-foreground"
              >
                {pulseLoading && (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    <span className="text-sm">Loading pulse…</span>
                  </div>
                )}
                {pulseError && !pulseLoading ? (
                  <div className="space-y-3">
                    {!msc_isQuietInfrastructureUiMessage(pulseError) ? (
                      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                        {msc_publicPayloadError(pulseError)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Pulse metrics couldn&apos;t load.</p>
                    )}
                    {detail ? (
                      <div className="rounded-lg border border-border bg-secondary/15 px-3 py-3 text-xs text-muted-foreground">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <Activity className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                          Snapshot from CRM record
                        </p>
                        <p className="mt-2 leading-relaxed">
                          Linked vault projects (relationship):{' '}
                          <span className="tabular-nums text-foreground">{linkedProjectCount}</span>
                          {linkedProjectCount === 0 ? (
                            <span className="block pt-1 text-[11px] text-muted-foreground">
                              Attach a vault project to this client in Payload to unlock Pulse metrics.
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!pulseLoading && pulse && noProjects && (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/15 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-foreground">No projects assigned</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Link vault projects to this client (Payload Admin or project record) to see task and snippet pulse metrics.
                    </p>
                  </div>
                )}
                {!pulseLoading && pulse && !noProjects && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <PulseStatCard label="Projects" value={pulse.totalProjects} />
                    <PulseStatCard label="Open tasks" value={pulse.totalTasks} hint="Todo / in progress" />
                    <PulseStatCard label="Overdue" value={pulse.overdueTasks} />
                    <PulseStatCard label="Due in 7 days" value={pulse.upcomingTasks} />
                    <PulseStatCard label="Active snippets" value={pulse.activeSnippets} hint="Non-archived" />
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="vault"
                className="mt-0 flex-1 overflow-y-auto px-4 py-6 text-sm text-muted-foreground"
              >
                <div className="rounded-xl border border-border bg-secondary/15 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    Code vault (workspace)
                  </p>
                  <p className="mt-2 text-xs leading-relaxed">
                    Snippets and implementation notes live on the vault project linked to this client. Use the steps below as
                    a quick tour—nothing here is required for CRM to function.
                  </p>
                </div>
                <ol className="mt-5 space-y-4 text-left">
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-[11px] font-semibold text-foreground">
                      1
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" aria-hidden />
                        Open the project on the Dashboard
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Select the vault build tied to <span className="text-foreground">{detail.name}</span>. CRM links one
                        client → one or more vault projects.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-[11px] font-semibold text-foreground">
                      2
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Task Pulse → Code Vault tab</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Browse and edit snippets scoped to that project (drafts, publish rules, categories).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-[11px] font-semibold text-foreground">
                      3
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Cross-check Pulse metrics</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        The <span className="text-foreground">Pulse</span> tab aggregates open tasks and snippets across all
                        projects linked to this client.
                      </p>
                    </div>
                  </li>
                </ol>
                <p className="mt-6 rounded-lg border border-dashed border-border/90 bg-background/40 px-3 py-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                  Demo tip: seed data adds two published snippets per project so this flow isn’t empty after{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">/api/seed</code>.
                </p>
              </TabsContent>
            </Tabs>
          )}

          {!loading && !detail && clientId && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
              {error && !msc_isQuietInfrastructureUiMessage(error) ? (
                <p className="text-destructive" role="alert">
                  {msc_publicPayloadError(error)}
                </p>
              ) : null}
              {error && msc_isQuietInfrastructureUiMessage(error) ? (
                <p>Couldn&apos;t load this client. Refresh the page.</p>
              ) : null}
              {!error ? <p>No client selected.</p> : null}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
