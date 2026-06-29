'use client'

import { User, UserRound } from 'lucide-react'

import { msc_resolveAvatarUrl } from '@/lib/msc_avatar_url'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Project, Task } from '@/lib/types'
import type { MscProjectMember } from '@/types/user-admin'

const MSC_UNASSIGNED_VALUE = '__unassigned__'

function msc_projectMemberLabel(member: MscProjectMember) {
  return member.username?.trim() || member.email?.trim() || `User ${String(member.id)}`
}

export function msc_getAssignableTaskMembers(project: Project): MscProjectMember[] {
  const members = project.members || []
  const ownerId = project.ownerUserId
  const ownerFromMembers = members.find((member) => String(member.id) === String(ownerId))
  const owner =
    ownerId === undefined || ownerId === null
      ? null
      : ownerFromMembers || {
          id: ownerId,
          username: 'Owner',
          email: null,
          avatar: null,
          avatarUrl: null,
        }

  const byId = new Map<string, MscProjectMember>()
  if (owner) byId.set(String(owner.id), owner)
  for (const member of members) {
    byId.set(String(member.id), member)
  }

  return Array.from(byId.values())
}

export function msc_resolveTaskAssignee(project: Project, task: Task): MscProjectMember | null {
  if (!task.assignedTo) return null
  const assignable = msc_getAssignableTaskMembers(project)
  const id = String(task.assignedTo.id)
  return assignable.find((member) => String(member.id) === id) || task.assignedTo
}

export function MSC_Projectz_TaskAssigneeBadge({ project, task }: { project: Project; task: Task }) {
  const assignee = msc_resolveTaskAssignee(project, task)
  if (!assignee) return null

  const label = msc_projectMemberLabel(assignee)
  const avatar = msc_resolveAvatarUrl(assignee)

  return (
    <span
      className="inline-flex max-w-[150px] items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-2 py-1 text-[10px] text-muted-foreground"
      title={`Assignee: ${label}`}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[8px] font-semibold text-primary">
        {avatar ? (
          <img src={avatar} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center p-0.5">
            <User className="h-2.5 w-2.5 text-primary" strokeWidth={1.5} aria-hidden />
          </span>
        )}
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}

export function MSC_Projectz_TaskAssigneeSelect({
  project,
  value,
  onChange,
}: {
  project: Project
  value: string | null
  onChange: (nextValue: string | null) => void
}) {
  const assignable = msc_getAssignableTaskMembers(project)

  return (
    <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs text-muted-foreground">
      Assign To
      <Select
        value={value ?? MSC_UNASSIGNED_VALUE}
        onValueChange={(nextValue) => onChange(nextValue === MSC_UNASSIGNED_VALUE ? null : nextValue)}
      >
        <SelectTrigger className="h-8 w-full bg-input text-foreground">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={MSC_UNASSIGNED_VALUE}>
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5" />
              Unassigned
            </span>
          </SelectItem>
          {assignable.map((member) => (
            <SelectItem key={String(member.id)} value={String(member.id)}>
              {msc_projectMemberLabel(member)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
