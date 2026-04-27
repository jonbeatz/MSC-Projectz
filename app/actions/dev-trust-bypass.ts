'use server'

import { cookies, headers } from 'next/headers'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'
import { MSC_DEV_TRUST_BYPASS_COOKIE } from '@/lib/msc_trust_gate_cookie'

type MscDevBypassResult = {
  ok: boolean
  message: string
}

function msc_isLocalHostValue(value: string | null): boolean {
  if (!value) return false
  const host = value.toLowerCase()
  return host.includes('localhost') || host.includes('127.0.0.1')
}

export async function msc_setDevTrustBypass(enabled: boolean): Promise<MscDevBypassResult> {
  try {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, message: 'Dev trust bypass is disabled in production.' }
    }
    if (process.env.DEV_BYPASS_ENABLED !== 'true') {
      return { ok: false, message: 'Dev trust bypass is disabled by environment policy.' }
    }

    const h = await headers()
    const forwardedHost = h.get('x-forwarded-host')
    const host = h.get('host')
    if (!msc_isLocalHostValue(forwardedHost) && !msc_isLocalHostValue(host)) {
      return { ok: false, message: 'Dev trust bypass is only allowed on localhost.' }
    }

    const ctx = await msc_getVaultLocalApiContext()
    if (!ctx.user || !msc_vaultIsPayloadAdmin(ctx.user as Parameters<typeof msc_vaultIsPayloadAdmin>[0])) {
      return { ok: false, message: 'Admin session required.' }
    }

    const c = await cookies()
    if (!enabled) {
      c.delete({ name: MSC_DEV_TRUST_BYPASS_COOKIE, path: '/' })
      return { ok: true, message: 'Dev trust bypass disabled.' }
    }

    c.set({
      name: MSC_DEV_TRUST_BYPASS_COOKIE,
      value: '1',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
    })
    return { ok: true, message: 'Dev trust bypass enabled for this local session.' }
  } catch (error) {
    console.error('[msc] dev trust bypass action failed:', error)
    return { ok: false, message: 'Unable to update dev trust bypass right now.' }
  }
}
