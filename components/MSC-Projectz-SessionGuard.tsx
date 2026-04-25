'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useAppStore } from '@/lib/store'

function msc_isPublicPath(p: string): boolean {
  if (p === '/login' || p === '/auth' || p === '/auth/register') return true
  if (p.startsWith('/auth/')) return true
  return false
}

/**
 * If persisted auth flags are inconsistent (e.g. `isAuthenticated` without a
 * Payload-backed user), purge local storage and send the operator to `/login`.
 */
export function MSC_Projectz_SessionGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const msc_purgeClientSession = useAppStore((s) => s.msc_purgeClientSession)
  const router = useRouter()
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (isAuthenticated && (!user || user.payloadUserId == null)) {
      msc_purgeClientSession()
      if (!msc_isPublicPath(pathname)) {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, user, pathname, router, msc_purgeClientSession])

  return <>{children}</>
}
