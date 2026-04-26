'use client'

import { CalendarDays, Mail, Shield, User as UserIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { MSC_Projectz_UserAdminActions } from '@/components/settings/MSC-Projectz-UserAdminActions'
import { cn } from '@/lib/utils'
import type { MscUserAdminRow } from '@/types/user-admin'

type MSC_Projectz_UserRowProps = {
  user: MscUserAdminRow
  onChanged: () => void
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void
}

function msc_formatCreatedAt(createdAt?: string) {
  if (!createdAt) return 'Created date unavailable'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Created date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function MSC_Projectz_UserRow({ user, onChanged, onMessage }: MSC_Projectz_UserRowProps) {
  const displayName = user.username?.trim() || user.email

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                {user.isCurrentUser && <Badge variant="outline">You</Badge>}
                <Badge
                  className={cn(
                    user.role === 'admin'
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-border bg-secondary text-secondary-foreground',
                  )}
                >
                  <Shield className="h-3 w-3" />
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {msc_formatCreatedAt(user.createdAt)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">ID: {String(user.id)}</p>
            </div>
          </div>
        </div>

        <MSC_Projectz_UserAdminActions user={user} onChanged={onChanged} onMessage={onMessage} />
      </div>
    </li>
  )
}
