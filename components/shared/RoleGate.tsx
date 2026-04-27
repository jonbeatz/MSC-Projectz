'use client'

import type { ReactNode } from 'react'
import { useAppStore } from '@/lib/store'

type RoleGateProps = {
  allowedRoles: string[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const user = useAppStore((s) => s.user)
  const role = user?.role

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
