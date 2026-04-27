import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { MSC_DEV_TRUST_BYPASS_COOKIE, MSC_TRUST_GATE_COOKIE } from '@/lib/msc_trust_gate_cookie'

const MSC_AUTH_ALLOWLIST_PREFIXES = [
  '/_next/',
  '/auth/verify',
  '/auth/verify-reminder',
  '/static/',
  '/api/public/',
]

const MSC_AUTH_ALLOWLIST_EXACT = new Set(['/auth', '/auth/login', '/auth/register'])

function msc_isAllowlistedPath(pathname: string): boolean {
  if (MSC_AUTH_ALLOWLIST_EXACT.has(pathname)) return true
  return MSC_AUTH_ALLOWLIST_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function msc_hasPayloadSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get('payload-token')?.value || req.cookies.get('__Secure-payload-token')?.value,
  )
}

function msc_isLocalDevRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const host = req.nextUrl.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1'
}

function msc_isDevBypassMasterSwitchOn(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_ENABLED === 'true'
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/admin/auth/verify' || pathname === '/admin/auth/verify/') {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/verify'
    return NextResponse.redirect(url)
  }
  if (pathname === '/admin/auth/verify-reminder' || pathname === '/admin/auth/verify-reminder/') {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/verify-reminder'
    return NextResponse.redirect(url)
  }

  if (msc_isAllowlistedPath(pathname)) {
    return NextResponse.next()
  }

  const isAuthenticated = msc_hasPayloadSessionCookie(req)
  const isVerified = req.cookies.get(MSC_TRUST_GATE_COOKIE)?.value === '1'
  const isBypassEnabled = msc_isDevBypassMasterSwitchOn()
  const hasDevBypass =
    isBypassEnabled &&
    msc_isLocalDevRequest(req) &&
    req.cookies.get(MSC_DEV_TRUST_BYPASS_COOKIE)?.value === '1'

  if (isAuthenticated && !isVerified && !hasDevBypass) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/verify-reminder'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!favicon.ico|media/).*)'],
}
