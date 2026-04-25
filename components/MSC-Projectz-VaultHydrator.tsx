'use client'

import { useEffect, useRef } from 'react'

import { useAppStore } from '@/lib/store'

/** Resolves a stable per-session key for the signed-in Payload user (tenant boundary). */
function msc_vaultSessionKey(
  isAuthenticated: boolean,
  user: { payloadUserId?: string | number; email?: string } | null,
): string | null {
  if (!isAuthenticated || !user) return null
  if (user.payloadUserId !== undefined && user.payloadUserId !== null) {
    return `id:${String(user.payloadUserId)}`
  }
  if (user.email) return `email:${user.email.toLowerCase()}`
  return null
}

/**
 * Loads vault projects/tasks after auth. On session (user) change, clears in-memory
 * project state before re-fetching so the UI cannot flash another tenant’s data.
 */
export function MSC_Projectz_VaultHydrator() {
  const hydrateVaultFromPayload = useAppStore((s) => s.hydrateVaultFromPayload)
  const msc_hardResetVaultState = useAppStore((s) => s.msc_hardResetVaultState)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const vaultHydrated = useAppStore((s) => s.vaultHydrated)
  const prevKey = useRef<string | null>(null)

  const key = msc_vaultSessionKey(isAuthenticated, user)

  useEffect(() => {
    if (!isAuthenticated) {
      prevKey.current = null
      msc_hardResetVaultState()
      return
    }
    if (key == null) {
      msc_hardResetVaultState()
      return
    }
    if (prevKey.current !== key) {
      msc_hardResetVaultState()
    }
    prevKey.current = key
  }, [isAuthenticated, key, msc_hardResetVaultState])

  useEffect(() => {
    if (!isAuthenticated) return
    if (key == null) return
    if (vaultHydrated) return
    console.log('DASHBOARD: Reactively fetching for:', user?.email)
    void hydrateVaultFromPayload()
  }, [isAuthenticated, key, user?.email, vaultHydrated, hydrateVaultFromPayload])

  return null
}
