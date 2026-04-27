'use client'

import { RefreshCw, ShieldAlert, Users } from 'lucide-react'

import { MSC_Projectz_UserRow } from '@/components/settings/MSC-Projectz-UserRow'
import { Accordion } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { MscUserAdminRow } from '@/types/user-admin'

type MSC_Projectz_UsersDirectoryProps = {
  users: MscUserAdminRow[]
  isMasterAdmin: boolean
  loading: boolean
  onRefresh: () => void
  onChanged: () => void
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void
}

export function MSC_Projectz_UsersDirectory({
  users,
  isMasterAdmin,
  loading,
  onRefresh,
  onChanged,
  onMessage,
}: MSC_Projectz_UsersDirectoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Payload directory
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Server-backed accounts used by the app and Payload admin.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading && users.length === 0 ? (
        <div className="space-y-2 rounded-lg border border-border bg-secondary/20 p-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No Payload users found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isMasterAdmin
              ? 'Create the first server user below, or refresh the directory.'
              : 'If you expect accounts here, sign in as a Master Admin or refresh.'}
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {users.map((user) => (
            <MSC_Projectz_UserRow
              key={String(user.id)}
              user={user}
              isMasterAdmin={isMasterAdmin}
              onChanged={onChanged}
              onMessage={onMessage}
            />
          ))}
        </Accordion>
      )}
    </div>
  )
}
