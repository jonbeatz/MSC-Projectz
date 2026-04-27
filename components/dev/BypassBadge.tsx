import { cookies } from 'next/headers'
import { MSC_DEV_TRUST_BYPASS_COOKIE } from '@/lib/msc_trust_gate_cookie'

export async function BypassBadge() {
  if (process.env.NODE_ENV !== 'development') return null
  if (process.env.DEV_BYPASS_ENABLED !== 'true') return null

  const c = await cookies()
  const active = c.get(MSC_DEV_TRUST_BYPASS_COOKIE)?.value === '1'
  if (!active) return null

  return (
    <div className="fixed bottom-3 right-3 z-9999 rounded-md border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-medium text-amber-200">
      Dev Bypass Active
    </div>
  )
}
