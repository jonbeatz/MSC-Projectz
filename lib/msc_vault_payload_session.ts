'use server'

import { createPayloadRequest, generatePayloadCookie, getPayload } from 'payload'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import config from '@payload-config'

function msc_revalidateVaultUi() {
  revalidatePath('/')
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
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const request = new Request(`${proto}://${host}/`, { headers: h })
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
    sameSite: (cookie.sameSite as 'lax' | 'strict' | 'none' | undefined) || 'Lax',
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
