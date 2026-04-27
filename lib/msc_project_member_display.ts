import type { MscProjectMember } from '@/types/user-admin'

export function msc_projectMemberLabel(member: MscProjectMember) {
  return member.username?.trim() || member.email?.trim() || `User ${String(member.id)}`
}

export function msc_projectMemberInitials(member: MscProjectMember) {
  return (
    msc_projectMemberLabel(member)
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  )
}
