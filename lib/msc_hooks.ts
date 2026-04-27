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

/** `true` below Tailwind `md` (max-width: 767px) — for calendar mobile layout / Sheet. */
const MAX_MD_MQ = '(max-width: 767px)'

function subscribeMaxMd(onStoreChange: () => void) {
  const mql = window.matchMedia(MAX_MD_MQ)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshotMaxMd() {
  return window.matchMedia(MAX_MD_MQ).matches
}

export function useIsMaxMd() {
  return useSyncExternalStore(subscribeMaxMd, getSnapshotMaxMd, getServerSnapshot)
}
