'use client'

import type { ReactNode } from 'react'
import { useAppStore } from '@/lib/store'
import { msc_isMasterAdminRole } from '@/lib/msc_roles'

type RoleGateProps = {
  allowedRoles: string[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const user = useAppStore((s) => s.user)
  const role = user?.role

  const allowMasterAdminForAdminGate =
    msc_isMasterAdminRole(role) && allowedRoles.includes('admin')
  const isAllowed =
    Boolean(role && allowedRoles.includes(role)) ||
    allowMasterAdminForAdminGate

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
