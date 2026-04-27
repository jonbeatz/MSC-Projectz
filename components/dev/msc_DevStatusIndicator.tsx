'use client'

import { useEffect, useState } from 'react'
import { msc_getDevTrustBypassStatus } from '@/app/actions/dev-trust-bypass'

export function Msc_DevStatusIndicator() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    let mounted = true
    void msc_getDevTrustBypassStatus().then((result) => {
      if (!mounted) return
      setActive(Boolean(result.active))
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!active) return null

  return (
    <span
      className="inline-flex h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: 'var(--msc-accent)' }}
      title="Dev Bypass Active"
      aria-label="Dev Bypass Active"
    />
  )
}
