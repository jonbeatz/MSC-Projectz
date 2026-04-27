'use server'

import { createPayloadRequest, generatePayloadCookie, getPayload } from 'payload'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import config from '@payload-config'

function msc_revalidateVaultUi() {
  revalidatePath('/')
}

function msc_resolvePayloadRequestOrigin(h: Headers): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const configured = (() => {
    if (!envOrigin) return null
    try {
      return new URL(envOrigin)
    } catch (e) {
      console.warn('[msc] Invalid NEXT_PUBLIC_SITE_URL; falling back to request headers.', e)
      return null
    }
  })()
  const host = h.get('x-forwarded-host') || h.get('host') || configured?.host || 'example.com'
  const proto = h.get('x-forwarded-proto') || configured?.protocol.replace(':', '') || 'https'
  return `${proto}://${host}`
}

/**
 * Signs into Payload (same `users` collection as `/admin`) and sets the auth cookie
 * so server actions see `req.user` for tenant-scoped vault access.
 */
export async function msc_vaultSignInToPayload(
  email: string,
  password: string,
): Promise<{
  ok: boolean
  error?: string
  userId?: string | number
  role?: string | null
}> {
  const normEmail = email.trim().toLowerCase()
  if (!normEmail || !password) {
    return { ok: false, error: 'Email and password are required' }
  }

  const payload = await getPayload({ config })
  const h = await headers()
  const request = new Request(`${msc_resolvePayloadRequestOrigin(h)}/`, { headers: h })
  const req = await createPayloadRequest({ request, config })

  let result: { token?: string; user?: { id?: string | number; role?: string | null } } | null = null
  try {
    result = await payload.login({
      collection: 'users',
      data: { email: normEmail, password },
      req,
    })
  } catch {
    return { ok: false, error: 'Invalid email or password' }
  }

  if (!result?.token) {
    return { ok: false, error: 'Invalid email or password' }
  }

  const col = payload.collections['users']
  const prefix = payload.config.cookiePrefix

  const cookie = generatePayloadCookie({
    collectionAuthConfig: col.config.auth,
    cookiePrefix: prefix,
    token: result.token,
    returnCookieAsObject: true,
  }) as {
    name: string
    value: string
    expires?: string
    maxAge?: number
    domain?: string
    path?: string
    httpOnly?: boolean
    sameSite?: string
    secure?: boolean
  }

  const c = await cookies()
  c.set({
    name: cookie.name,
    value: cookie.value,
    path: cookie.path || '/',
    maxAge: cookie.maxAge,
    httpOnly: cookie.httpOnly,
    sameSite: (cookie.sameSite?.toLowerCase() as 'lax' | 'strict' | 'none' | undefined) || 'lax',
    secure: Boolean(cookie.secure),
  })
  msc_revalidateVaultUi()
  return {
    ok: true,
    userId: result.user?.id,
    role: result.user?.role ?? null,
  }
}

export async function msc_vaultSignOutPayload(): Promise<void> {
  const payload = await getPayload({ config })
  const prefix = payload.config.cookiePrefix
  const c = await cookies()
  c.delete({ name: `${prefix}-token`, path: '/' })
  msc_revalidateVaultUi()
}
