'use client'

import { CalendarDays, Mail, Shield, User as UserIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
    <AccordionItem value={String(user.id)} className="overflow-hidden rounded-lg border border-border bg-card">
      <AccordionTrigger className="px-4 py-3 hover:bg-secondary/40 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 text-left">
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
            <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-border bg-[#1c1c1c] px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {msc_formatCreatedAt(user.createdAt)}
          </span>
          <span className="truncate">ID: {String(user.id)}</span>
        </div>
        <MSC_Projectz_UserAdminActions user={user} onChanged={onChanged} onMessage={onMessage} />
      </AccordionContent>
    </AccordionItem>
  )
}
