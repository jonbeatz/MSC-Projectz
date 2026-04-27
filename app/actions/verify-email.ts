'use server'

import { getPayload } from 'payload'
import { cookies, headers } from 'next/headers'
import config from '@payload-config'
import { msc_getClientIpFromHeaders } from '@/lib/msc_client_ip'
import { msc_hashVerificationToken, msc_verifyToken } from '@/lib/msc_auth_verification'
import { msc_logVerificationTelemetry } from '@/lib/msc_verification_telemetry'
import { MSC_TRUST_GATE_COOKIE } from '@/lib/msc_trust_gate_cookie'

type MscVerifyEmailResult = {
  ok: boolean
  message: string
}

type MscVerificationUserDoc = {
  id: string | number
  isVerified?: boolean | null
  verificationToken?: string | null
  verificationTokenExpires?: string | Date | null
}

export async function msc_verifyEmailAction(token: string): Promise<MscVerifyEmailResult> {
  const h = await headers()
  const clientIp = msc_getClientIpFromHeaders(h)

  const rawToken = token.trim()
  if (!rawToken) {
    msc_logVerificationTelemetry({ kind: 'verify_token_invalid', ip: clientIp, extra: { reason: 'empty' } })
    return { ok: false, message: 'Invalid verification link.' }
  }

  try {
    const payload = await getPayload({ config })
    const tokenHash = msc_hashVerificationToken(rawToken)

    const result = await payload.find({
      collection: 'users',
      where: {
        verificationToken: {
          equals: tokenHash,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const user = result.docs[0] as MscVerificationUserDoc | undefined
    if (!user) {
      msc_logVerificationTelemetry({ kind: 'verify_token_invalid', ip: clientIp, extra: { reason: 'no_user' } })
      return { ok: false, message: 'Verification link is invalid or expired.' }
    }

    if (user.isVerified) {
      const c = await cookies()
      c.set({
        name: MSC_TRUST_GATE_COOKIE,
        value: '1',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
      msc_logVerificationTelemetry({ kind: 'verify_token_ok', userId: user.id, ip: clientIp, extra: { already: true } })
      return { ok: true, message: 'Your account is already verified.' }
    }

    const isValid = msc_verifyToken({
      storedHash: user.verificationToken,
      rawToken,
      expiresAt: user.verificationTokenExpires,
    })
    if (!isValid) {
      msc_logVerificationTelemetry({ kind: 'verify_token_expired', userId: user.id, ip: clientIp })
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          verificationToken: null,
          verificationTokenExpires: null,
        },
        overrideAccess: true,
      })
      return { ok: false, message: 'Verification link is invalid or expired.' }
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
      overrideAccess: true,
    })
    msc_logVerificationTelemetry({ kind: 'verify_token_ok', userId: user.id, ip: clientIp, extra: { firstVerify: true } })
    const c = await cookies()
    c.set({
      name: MSC_TRUST_GATE_COOKIE,
      value: '1',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })

    return { ok: true, message: 'Email verified successfully. Redirecting to login...' }
  } catch (error) {
    console.error('[msc] verify email action failed:', error)
    msc_logVerificationTelemetry({ kind: 'error', ip: clientIp, extra: { where: 'verify_email' } })
    return { ok: false, message: 'Unable to verify this email right now. Please try again.' }
  }
}
