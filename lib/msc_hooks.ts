'use client'

import { useSyncExternalStore } from 'react'

const MOBILE_MQ = '(max-width: 1023px)'

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_MQ)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches
}

/**
 * `false` on the server to avoid layout shift; updates on the client after hydration.
 * Aligns with Tailwind `lg` (≥1024px).
 */
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
