'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'

import { MSC_Projectz_ClientDrawer } from '@/components/MSC-Projectz-ClientDrawer'
import { msc_createClient, msc_listClients } from '@/lib/msc_client_actions'
import type { MscClientListRow } from '@/lib/msc_client_types'
import { msc_isQuietInfrastructureUiMessage, msc_publicPayloadError } from '@/lib/msc_public_error'
import { Badge } from '@/components/ui/badge'
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

function msc_statusBadgeVariant(
  s: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'active') return 'default'
  if (s === 'onboarding') return 'secondary'
  if (s === 'lead') return 'outline'
  if (s === 'completed') return 'secondary'
  if (s === 'archived') return 'outline'
  return 'secondary'
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
  }, [
    load,
    newClientName,
    newContactEmail,
    newContactName,
    newContactPhone,
    openClient,
    resetCreateForm,
  ])

  return (
    <div
      className="msc-clients-route msc-clients-route-bg flex min-h-screen flex-col gap-6 p-6"
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
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
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
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => openClient(c.id)}
                className={cn(
                  'msc-clients-glass-card relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl p-4 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-msc-gold/40',
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_50%)]"
                />
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <span className="line-clamp-2 font-medium text-foreground">{c.name}</span>
                  <Badge variant={msc_statusBadgeVariant(c.status)} className="shrink-0 capitalize">
                    {c.status}
                  </Badge>
                </div>
                <p className="relative z-10 text-[11px] text-muted-foreground">
                  Updated {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
                </p>
              </button>
            </li>
          ))}
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
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
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
