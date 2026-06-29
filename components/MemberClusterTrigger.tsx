'use client'

import { User } from 'lucide-react'

import { msc_resolveAvatarUrl } from '@/lib/msc_avatar_url'
import { msc_projectMemberInitials, msc_projectMemberLabel } from '@/lib/msc_project_member_display'
import type { MscProjectMember } from '@/types/user-admin'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type MemberClusterFallbackType = 'initials' | 'icon'

export type MemberClusterTriggerProps = {
  /** Read-only list from the parent (e.g. `project.members`); this component does not fetch or mutate. */
  members: MscProjectMember[]
  /** How many avatars to show in the stack before a “+N” control (e.g. 2 or 3). */
  stackLimit: number
  /** Uniform fallback when no photo URL: initials token or Lucide User (same for every slot in this cluster). */
  fallbackType?: MemberClusterFallbackType
  /** Optional: parent can track popover open/close (analytics, focus). */
  onOpenChange?: (open: boolean) => void
  className?: string
  /** Shown to the right of the cluster; default: “N member(s)”. */
  showMemberCountText?: boolean
  /** Max height for the read-only list inside the popover. */
  listMaxHeightClassName?: string
}

const MSC_MEMBER_AVATAR_SHELL =
  'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-card bg-secondary ring-1 ring-border'

function MemberAvatar({
  member,
  className,
  fallbackType,
  size = 'sm',
}: {
  member: MscProjectMember
  className?: string
  fallbackType: MemberClusterFallbackType
  /** `sm` = stack chips (h-7); `md` = popover list rows (h-8). */
  size?: 'sm' | 'md'
}) {
  const label = msc_projectMemberLabel(member)
  const resolved = msc_resolveAvatarUrl(member)
  const iconMax = size === 'md' ? 'max-h-4 max-w-4' : 'max-h-[14px] max-w-[14px]'

  return (
    <span className={cn(MSC_MEMBER_AVATAR_SHELL, 'text-[10px] font-semibold text-foreground', className)} title={label}>
      {resolved ? (
        <img src={resolved} alt="" className="h-full w-full object-cover" />
      ) : fallbackType === 'icon' ? (
        <span className="flex h-full w-full items-center justify-center p-1">
          <User className={cn('text-muted-foreground', iconMax)} strokeWidth={1.5} aria-hidden />
        </span>
      ) : (
        <span className="flex h-full w-full items-center justify-center">{msc_projectMemberInitials(member)}</span>
      )}
    </span>
  )
}

/**
 * Dashboard-only: stack of avatars + optional “+N” that opens a read-only team popover.
 * No project/store state — parent supplies `members` and `stackLimit`.
 */
export function MemberClusterTrigger({
  members,
  stackLimit,
  fallbackType = 'icon',
  onOpenChange,
  className,
  showMemberCountText = true,
  listMaxHeightClassName = 'max-h-60',
}: MemberClusterTriggerProps) {
  if (members.length === 0) {
    return null
  }

  const limit = Math.max(1, Math.floor(stackLimit))
  const visible = members.slice(0, limit)
  const overflow = members.length - visible.length
  const showOverflowPill = overflow > 0

  return (
    <div
      className={cn('flex min-w-0 items-center gap-1.5', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'group inline-flex min-w-0 items-center gap-0 rounded-full text-left outline-none',
              'focus-visible:ring-1 focus-visible:ring-msc-ui-accent/50',
            )}
            aria-label={
              showOverflowPill
                ? `Team, ${members.length} members, ${overflow} not shown in stack`
                : `Team, ${members.length} member${members.length === 1 ? '' : 's'}`
            }
            aria-haspopup="dialog"
          >
            <div className="flex -space-x-2 pr-0.5">
              {visible.map((member) => (
                <MemberAvatar
                  key={String(member.id)}
                  member={member}
                  fallbackType={fallbackType}
                  size="sm"
                  className="h-7 w-7"
                />
              ))}
            </div>
            {showOverflowPill && (
              <span className="z-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border group-hover:border-primary/30 group-hover:text-foreground">
                +{overflow}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 max-w-[min(100vw-1rem,20rem)] border-border/60 bg-card p-0 text-foreground shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border/50 px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">Team</p>
            <p className="text-xs text-muted-foreground">
              {members.length} member{members.length === 1 ? '' : 's'}
            </p>
          </div>
          <ul
            className={cn(
              'overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] py-1',
              listMaxHeightClassName,
            )}
            role="list"
          >
            {members.map((member) => {
              const label = msc_projectMemberLabel(member)
              const email = member.email?.trim()
              return (
                <li key={String(member.id)} className="flex min-w-0 items-center gap-2.5 px-3 py-2" role="listitem">
                  <MemberAvatar member={member} fallbackType={fallbackType} size="md" className="h-8 w-8 text-[11px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground" title={label}>
                      {label}
                    </p>
                    {email && email.toLowerCase() !== label.toLowerCase() && (
                      <p className="truncate text-xs text-muted-foreground" title={email}>
                        {email}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>
      {showMemberCountText && (
        <span className="truncate text-xs text-muted-foreground" aria-hidden>
          {members.length} member{members.length === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}
