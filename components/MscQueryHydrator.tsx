'use client'

import { useEffect, useRef } from 'react'
import { useMscProjects } from '@/lib/msc_query_hooks'
import { useAppStore } from '@/lib/store'

/**
 * Bridges TanStack Query state into the Zustand store.
 *
 * When the query returns fresh data, `projects` and `vaultHydrated` are pushed into
 * the Zustand store so all existing components (which read from `useAppStore`) work
 * without changes. The query layer provides caching, dedup, and refetch semantics.
 */
export function MscQueryHydrator() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const msc_hardResetVaultState = useAppStore((s) => s.msc_hardResetVaultState)
  const msc_purgeClientSession = useAppStore((s) => s.msc_purgeClientSession)

  const { data: projects, isLoading, isError } = useMscProjects()

  const prevKey = useRef<string | null>(null)
  const key = isAuthenticated && user?.payloadUserId ? `id:${String(user.payloadUserId)}` : null

  // On session change, reset state before the query re-fetches
  useEffect(() => {
    if (!isAuthenticated || key == null) {
      prevKey.current = null
      msc_hardResetVaultState()
      return
    }
    if (prevKey.current !== null && prevKey.current !== key) {
      msc_hardResetVaultState()
    }
    prevKey.current = key
  }, [isAuthenticated, key, msc_hardResetVaultState])

  // Sync query data into Zustand
  useEffect(() => {
    if (!isAuthenticated || key == null) return
    if (isError) {
      msc_purgeClientSession()
      return
    }
    if (isLoading) return

    if (Array.isArray(projects)) {
      const id = user?.payloadUserId ?? null
      const set = useAppStore.setState
      set({ projects, vaultHydrated: true, vaultUserId: id })
    }
  }, [projects, isLoading, isError, isAuthenticated, key, user?.payloadUserId, msc_purgeClientSession])

  return null
}
