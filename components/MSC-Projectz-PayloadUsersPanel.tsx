'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Plus, RefreshCw, Shield, Trash2, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  msc_createPayloadUserAsAdmin,
  msc_deletePayloadUserAsAdmin,
  msc_listPayloadUsersForSettings,
  type MscPayloadUserRow,
} from '@/lib/msc_vault_user_admin'
import { cn } from '@/lib/utils'

/**
 * Server-backed directory (Payload `users`) for tenant isolation. Requires `msc_vaultSignInToPayload` first.
 */
export function MSC_Projectz_PayloadUsersPanel() {
  const [rows, setRows] = useState<MscPayloadUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await msc_listPayloadUsersForSettings()
    if (r.ok) {
      setRows(r.users)
    } else {
      setError(r.error)
      setRows([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onCreate = async () => {
    if (!email.trim() || !password) return
    setSubmitting(true)
    setError(null)
    const r = await msc_createPayloadUserAsAdmin({ email, password, role })
    setSubmitting(false)
    if (r.ok) {
      setEmail('')
      setPassword('')
      setRole('user')
      void load()
    } else {
      setError(r.error)
    }
  }

  const onDelete = async (id: string | number) => {
    if (!window.confirm('Remove this server user account?')) return
    const r = await msc_deletePayloadUserAsAdmin(id)
    if (r.ok) {
      void load()
    } else {
      setError(r.error)
    }
  }

  return (
    <div className="space-y-6 text-foreground">
      {error && (
        <p className="text-sm text-destructive" role="status">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Shield className="w-4 h-4 text-primary" />
          Server directory (Payload)
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-secondary/40 p-2">
          {rows.length === 0 && !loading && (
            <li className="text-sm text-muted-foreground px-2 py-3">No server users, or not signed in to Payload.</li>
          )}
          {rows.map((u) => (
            <li
              key={String(u.id)}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm bg-card border border-border"
            >
              <div className="flex min-w-0 items-center gap-2">
                <UserIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.email}</div>
                  <div className="text-xs text-muted-foreground">ID: {String(u.id)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {u.role === 'admin' ? 'Admin' : 'User'}
                </span>
                <button
                  type="button"
                  onClick={() => void onDelete(u.id)}
                  className="p-1.5 rounded-md text-destructive hover:bg-destructive/10"
                  title="Delete server user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Create server user
        </h4>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-input border-border"
              placeholder="teammate@example.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Password (min. 6)</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-input border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            className="h-9 rounded-md border border-border bg-input px-2 text-sm"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto bg-primary text-primary-foreground"
          onClick={() => void onCreate()}
          disabled={submitting || !email.trim() || password.length < 6}
        >
          {submitting ? 'Creating…' : 'Create user'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Admins on Payload can see all vault projects; users only see their own. Sign in from the lock screen
          (same email/password as <span className="text-foreground/90">/admin</span>) so the browser holds the session cookie.
        </p>
      </div>
    </div>
  )
}
