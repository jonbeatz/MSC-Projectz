'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, CalendarDays, ChevronRight, Loader2 } from 'lucide-react'

import { MSC_Projectz_ClientDrawer } from '@/components/MSC-Projectz-ClientDrawer'
import { msc_createClient, msc_listClients } from '@/lib/msc_client_actions'
import type { MscClientListRow } from '@/lib/msc_client_types'
import { msc_isQuietInfrastructureUiMessage, msc_publicPayloadError } from '@/lib/msc_public_error'
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
import { cn } from '@/lib/utils'

/** Visual “relationship” fill for the route tile progress strip (Ideaz-style); not a KPI. */
function msc_clientStatusProgressPercent(status: string): number {
  const s = status.toLowerCase()
  if (s === 'lead') return 28
  if (s === 'onboarding') return 52
  if (s === 'active') return 78
  if (s === 'completed') return 100
  return 45
}

function msc_clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function msc_formatRelativeUpdated(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const diffM = Math.floor(diffMs / 60000)
  if (diffM < 1) return 'just now'
  if (diffM < 60) return `${diffM}m ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 48) return `${diffH}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function msc_statusPillClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active') return 'border border-emerald-400/25 bg-emerald-500/15 text-emerald-100/95'
  if (s === 'onboarding') return 'border border-msc-ui-accent/30 bg-msc-ui-accent/14 text-sky-50/95'
  if (s === 'lead') return 'border border-white/12 bg-white/[0.06] text-muted-foreground'
  if (s === 'completed') return 'border border-sky-400/22 bg-sky-500/12 text-sky-50/95'
  return 'border border-white/10 bg-white/[0.06] text-muted-foreground'
}

export function MSC_Projectz_ClientsRouteView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientParam = searchParams.get('client')

  const [clients, setClients] = useState<MscClientListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newClientName, setNewClientName] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await msc_listClients()
    if (!res.ok) {
      setClients([])
      setError(res.error)
      setLoading(false)
      return
    }
    setClients(res.clients.filter((c) => c.status !== 'archived'))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const drawerOpen = Boolean(clientParam)

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        router.push('/clients')
      }
    },
    [router],
  )

  const openClient = useCallback(
    (id: string) => {
      router.push(`/clients?client=${encodeURIComponent(id)}`)
    },
    [router],
  )

  const resetCreateForm = useCallback(() => {
    setCreateError(null)
    setNewClientName('')
    setNewContactName('')
    setNewContactEmail('')
    setNewContactPhone('')
  }, [])

  const onCreateClient = useCallback(async () => {
    setCreateSaving(true)
    setCreateError(null)
    const res = await msc_createClient({
      name: newClientName,
      primaryContact: {
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone.trim() === '' ? null : newContactPhone.trim(),
      },
    })
    setCreateSaving(false)
    if (!res.ok) {
      setCreateError(res.error)
      return
    }
    setCreateOpen(false)
    resetCreateForm()
    await load()
    openClient(res.id)
  }, [load, newClientName, newContactEmail, newContactName, newContactPhone, openClient, resetCreateForm])

  return (
    <div
      className="msc-clients-route flex min-h-screen flex-col gap-6 px-4 py-6 sm:px-6"
      data-msc-component="clients-route"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">CRM</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clients</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Active studio relationships and onboarding pipeline. Select a client to open details.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetCreateForm()
            setCreateOpen(true)
          }}
        >
          New Client
        </Button>
      </header>

      {error && !msc_isQuietInfrastructureUiMessage(error) ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {msc_publicPayloadError(error)}
        </p>
      ) : error && msc_isQuietInfrastructureUiMessage(error) ? (
        <p className="rounded-md border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
          CRM list couldn&apos;t refresh. Try again shortly.
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <span className="text-sm">Loading clients…</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10 px-8 py-16 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground opacity-60" aria-hidden />
          <p className="text-sm font-medium text-foreground">No clients yet</p>
          <p className="mt-2 max-w-md text-xs text-muted-foreground">
            Create your first client here to kick off onboarding directly from Command Center CRM.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => {
              resetCreateForm()
              setCreateOpen(true)
            }}
          >
            New Client
          </Button>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const pct = msc_clientStatusProgressPercent(c.status)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-label={`Open client ${c.name}`}
                  onClick={() => openClient(c.id)}
                  className={cn(
                    'msc-clients-glass-card msc-clients-route-tile group relative flex w-full flex-col gap-5 overflow-hidden p-6 text-left',
                    'transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(0,0,0,0.58)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-msc-ui-accent/40',
                  )}
                >
                  <div className="relative z-10 flex gap-4">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-sm font-semibold tracking-tight text-white/90 shadow-inner shadow-black/40"
                      aria-hidden
                    >
                      {msc_clientInitials(c.name)}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground">
                          {c.name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                            msc_statusPillClass(c.status),
                          )}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Studio CRM · Command Center</p>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>Pipeline</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-black/45 ring-1 ring-white/6"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-full bg-linear-to-r from-msc-ui-accent via-sky-400 to-msc-ui-accent shadow-[0_0_12px_rgba(89,158,222,0.38)] transition-[width] duration-500 group-hover:shadow-[0_0_16px_rgba(89,158,222,0.5)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/8 pt-4 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      <span>Updated {msc_formatRelativeUpdated(c.updatedAt)}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                      Open
                      <ChevronRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!createSaving) {
            setCreateOpen(next)
            if (!next) resetCreateForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New client</DialogTitle>
            <DialogDescription>
              Add a CRM record with onboarding defaults so work can start from Command Center.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void onCreateClient()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="msc-create-client-name">Client name</Label>
              <Input
                id="msc-create-client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                disabled={createSaving}
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msc-create-client-contact-name">Primary contact name</Label>
              <Input
                id="msc-create-client-contact-name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                disabled={createSaving}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msc-create-client-contact-email">Primary contact email</Label>
              <Input
                id="msc-create-client-contact-email"
                type="email"
                inputMode="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                disabled={createSaving}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msc-create-client-contact-phone">Primary contact phone (optional)</Label>
              <Input
                id="msc-create-client-contact-phone"
                type="tel"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                disabled={createSaving}
                autoComplete="tel"
              />
            </div>
            {createError && !msc_isQuietInfrastructureUiMessage(createError) ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                role="alert"
              >
                {msc_publicPayloadError(createError)}
              </p>
            ) : createError && msc_isQuietInfrastructureUiMessage(createError) ? (
              <p className="text-xs text-muted-foreground">Couldn&apos;t create client right now. Try again.</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (createSaving) return
                  setCreateOpen(false)
                  resetCreateForm()
                }}
                disabled={createSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSaving}>
                {createSaving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    <span>Creating…</span>
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MSC_Projectz_ClientDrawer
        clientId={clientParam}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClientArchived={() => {
          void load()
          router.push('/clients')
        }}
      />
    </div>
  )
}
