'use client'

import { CalendarDays, Mail, Shield, User as UserIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MSC_Projectz_UserAdminActions } from '@/components/settings/MSC-Projectz-UserAdminActions'
import { cn } from '@/lib/utils'
import type { MscUserAdminRow } from '@/types/user-admin'

type MSC_Projectz_UserRowProps = {
  user: MscUserAdminRow
  isMasterAdmin: boolean
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

export function MSC_Projectz_UserRow({ user, isMasterAdmin, onChanged, onMessage }: MSC_Projectz_UserRowProps) {
  const displayName = user.username?.trim() || user.email

  return (
    <AccordionItem
      value={String(user.id)}
      className="overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-md shadow-black/15 backdrop-blur-sm dark:border-white/[0.07] dark:bg-zinc-950/40 dark:shadow-black/40"
    >
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/25 hover:no-underline dark:hover:bg-white/[0.04]">
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
                  user.role === 'master-admin'
                    ? 'border-msc-ui-accent/45 bg-msc-ui-accent/18 text-sky-50 shadow-[0_0_14px_rgba(89,158,222,0.22)]'
                    : user.role === 'admin'
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-border bg-secondary text-secondary-foreground',
                )}
              >
                <Shield className="h-3 w-3" />
                {user.role === 'master-admin' ? 'Master Admin' : user.role === 'admin' ? 'Admin' : 'User'}
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-border/60 bg-muted/15 px-4 py-4 dark:border-white/[0.06] dark:bg-black/20">
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
        <MSC_Projectz_UserAdminActions
          user={user}
          isMasterAdmin={isMasterAdmin}
          onChanged={onChanged}
          onMessage={onMessage}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
