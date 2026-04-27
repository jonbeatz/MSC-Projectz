'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Users } from 'lucide-react'

import { RoleGate } from '@/components/shared/RoleGate'
import { MSC_Projectz_CreateUserForm } from '@/components/settings/MSC-Projectz-CreateUserForm'
import { MSC_Projectz_UsersDirectory } from '@/components/settings/MSC-Projectz-UsersDirectory'
import { useAppStore } from '@/lib/store'
import { useTaskPulseSignal } from '@/lib/useTaskPulseSignal'
import { msc_listPayloadUsersForSettings } from '@/lib/msc_vault_user_admin'
import { cn } from '@/lib/utils'
import type { MscUserAdminRow } from '@/types/user-admin'

type MSC_Projectz_SettingsUsersSectionProps = {
  enabled?: boolean
}

type MscSettingsUserMessage = {
  type: 'success' | 'error'
  text: string
}

export function MSC_Projectz_SettingsUsersSection({ enabled = true }: MSC_Projectz_SettingsUsersSectionProps) {
  const [users, setUsers] = useState<MscUserAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<MscSettingsUserMessage | null>(null)
  const projects = useAppStore((s) => s.projects)

  const msc_loadUsers = useCallback(async () => {
    setLoading(true)
    const result = await msc_listPayloadUsersForSettings()

    if (result.ok) {
      setUsers(result.users)
      setMessage(null)
    } else {
      setUsers([])
      setMessage({ type: 'error', text: result.error })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    void msc_loadUsers()
  }, [enabled, msc_loadUsers])

  const stats = useMemo(() => {
    const masterAdmins = users.filter((user) => user.role === 'master-admin').length
    const admins = users.filter((user) => user.role === 'admin').length
    return {
      total: users.length,
      masterAdmins,
      admins,
      standard: users.length - admins - masterAdmins,
    }
  }, [users])

  const msc_setMessage = (nextMessage: MscSettingsUserMessage) => {
    setMessage(nextMessage)
    window.setTimeout(() => setMessage(null), 4000)
  }

  if (!enabled) {
    return null
  }

  return (
    <RoleGate allowedRoles={['admin']}>
      <section id="users" className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Identity Control
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Users
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage server-backed Payload accounts, roles, and administrative access.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
            <div className="col-span-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 md:col-span-1">
              <p className="text-lg font-semibold text-foreground">{stats.total}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <p className="text-lg font-semibold text-amber-400">{stats.masterAdmins}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Master</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <p className="text-lg font-semibold text-primary">{stats.admins}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Admins</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <p className="text-lg font-semibold text-foreground">{stats.standard}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {message && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
              message.type === 'success'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-destructive/30 bg-destructive/10 text-destructive',
            )}
            role="status"
          >
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <MSC_Projectz_UsersDirectory
          users={users}
          loading={loading}
          onRefresh={() => void msc_loadUsers()}
          onChanged={() => void msc_loadUsers()}
          onMessage={msc_setMessage}
        />

        <MSC_Projectz_CreateUserForm
          onCreated={() => {
            void msc_loadUsers()
            const fallbackProjectId = projects[0]?.id ?? null
            useTaskPulseSignal.getState().setSignal(true, fallbackProjectId)
          }}
          onMessage={msc_setMessage}
        />
      </div>
      </section>
    </RoleGate>
  )
}
