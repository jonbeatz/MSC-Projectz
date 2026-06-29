'use client'

import { MscQueryHydrator } from '@/components/MscQueryHydrator'

/**
 * Loads vault projects/tasks after auth using TanStack Query and syncs into
 * the Zustand store. Replaces the old VaultHydrator that called
 * `hydrateVaultFromPayload` directly from the store.
 *
 * On session (user) change, clears in-memory project state before re-fetching
 * so the UI cannot flash another tenant's data.
 */
export function MSC_Projectz_VaultHydrator() {
  return <MscQueryHydrator />
}
