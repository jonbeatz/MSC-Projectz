'use server'

/**
 * Auth-only server actions (registration, future SMTP verification flows).
 * Vault/project APIs remain in `lib/msc_vault_server_actions.ts`.
 */

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { msc_getClientIpFromHeaders } from '@/lib/msc_client_ip'
import { msc_generateVerificationToken, msc_sendVerificationEmail } from '@/lib/msc_auth_verification'
import { msc_validateNewPassword } from '@/lib/msc_password_policy'
import { msc_sendWelcomeEmail } from '@/lib/msc_smtp_nodemailer'
import { msc_checkAndRecordRegisterRequest } from '@/lib/msc_verification_ip_rate_limit'
import { msc_logVerificationTelemetry } from '@/lib/msc_verification_telemetry'

type MscRegisterUserResult = { success: boolean; message: string }

export async function msc_registerUser(
  email: string,
  password: string,
  name: string,
): Promise<MscRegisterUserResult> {
  const payload = await getPayload({ config })
  const msc_email = email.trim().toLowerCase()
  const msc_password = password
  const msc_name = name.trim()

  if (!msc_email) return { success: false, message: 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msc_email)) {
    return { success: false, message: 'Enter a valid email address.' }
  }
  const msc_pwCheck = msc_validateNewPassword(msc_password)
  if (!msc_pwCheck.ok) {
    return { success: false, message: msc_pwCheck.message }
  }
  if (!msc_name) return { success: false, message: 'Name is required.' }

  const h = await headers()
  const clientIp = msc_getClientIpFromHeaders(h)
  const regLimit = msc_checkAndRecordRegisterRequest(clientIp)
  if (!regLimit.ok) {
    msc_logVerificationTelemetry({
      kind: 'register_ip_limited',
      ip: clientIp,
      extra: { retryAfterSeconds: regLimit.retryAfterSeconds, scope: 'register_request' },
    })
    return {
      success: false,
      message: 'Registration is temporarily limited. Please try again in a little while.',
    }
  }

  try {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: msc_email } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      return { success: false, message: 'An account with this email already exists.' }
    }
  } catch {
    return { success: false, message: 'Unable to validate this request right now.' }
  }

  try {
    const verification = msc_generateVerificationToken()
    const created = await payload.create({
      collection: 'users',
      data: {
        username: msc_name,
        email: msc_email,
        password: msc_password,
        role: 'user',
        isVerified: false,
        verificationToken: verification.tokenHash,
        verificationTokenExpires: verification.expiresAt.toISOString(),
        lastVerificationSentAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    msc_logVerificationTelemetry({
      kind: 'register_send',
      userId: (created as { id?: string | number }).id,
      ip: clientIp,
    })
    void msc_sendVerificationEmail({
      email: msc_email,
      name: msc_name,
      token: verification.rawToken,
    }).catch((err) => console.error('[msc] Verification email failed:', err))
    void msc_sendWelcomeEmail(msc_email, msc_name).catch((err) =>
      console.error('[msc] Welcome email failed:', err),
    )
    return { success: true, message: 'Request sent. Check your email to verify your account.' }
  } catch {
    return { success: false, message: 'Registration failed. Please try again.' }
  }
}
