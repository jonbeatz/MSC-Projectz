'use server'

import { cookies, headers } from 'next/headers'
import { msc_generateVerificationToken, msc_sendVerificationEmail } from '@/lib/msc_auth_verification'
import { msc_getClientIpFromHeaders } from '@/lib/msc_client_ip'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_checkResendIpLimit, msc_recordResendSend } from '@/lib/msc_verification_ip_rate_limit'
import { msc_logVerificationTelemetry } from '@/lib/msc_verification_telemetry'
import { MSC_TRUST_GATE_COOKIE } from '@/lib/msc_trust_gate_cookie'

const MSC_RESEND_COOLDOWN_MS = 60 * 1000
const MSC_GENERIC_RESEND_MESSAGE = 'If an account exists, a verification email has been sent.'

type MscResendResult = {
  ok: boolean
  message: string
  cooldownSeconds?: number
}

type MscUserForResend = {
  id: string | number
  email?: string | null
  username?: string | null
  isVerified?: boolean | null
  lastVerificationSentAt?: string | Date | null
}

export async function msc_resendVerificationAction(): Promise<MscResendResult> {
  const h = await headers()
  const clientIp = msc_getClientIpFromHeaders(h)

  try {
    const ctx = await msc_getVaultLocalApiContext()
    if (!ctx.user?.id) {
      msc_logVerificationTelemetry({ kind: 'resend_attempt', ip: clientIp, extra: { anonymous: true } })
      return { ok: true, message: MSC_GENERIC_RESEND_MESSAGE }
    }

    msc_logVerificationTelemetry({ kind: 'resend_attempt', userId: ctx.user.id, ip: clientIp })

    const user = (await ctx.payload.findByID({
      collection: 'users',
      id: ctx.user.id,
      depth: 0,
      overrideAccess: true,
    })) as MscUserForResend

    if (!user) {
      return { ok: true, message: MSC_GENERIC_RESEND_MESSAGE }
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
      msc_logVerificationTelemetry({ kind: 'resend_already_verified', userId: user.id, ip: clientIp })
      return { ok: true, message: 'Your account is already verified.' }
    }

    const now = Date.now()
    const lastSent = user.lastVerificationSentAt ? new Date(user.lastVerificationSentAt).getTime() : 0
    if (lastSent && Number.isFinite(lastSent)) {
      const elapsed = now - lastSent
      if (elapsed < MSC_RESEND_COOLDOWN_MS) {
        const remaining = Math.ceil((MSC_RESEND_COOLDOWN_MS - elapsed) / 1000)
        msc_logVerificationTelemetry({
          kind: 'resend_user_cooldown',
          userId: user.id,
          ip: clientIp,
          extra: { remainingSeconds: remaining },
        })
        return {
          ok: false,
          message: `Too many requests. Please wait ${remaining}s before retrying.`,
          cooldownSeconds: remaining,
        }
      }
    }

    const ipLimit = msc_checkResendIpLimit(clientIp)
    if (!ipLimit.ok) {
      const mins = Math.max(1, Math.ceil(ipLimit.retryAfterSeconds / 60))
      msc_logVerificationTelemetry({
        kind: 'resend_ip_limited',
        userId: user.id,
        ip: clientIp,
        extra: { retryAfterSeconds: ipLimit.retryAfterSeconds },
      })
      return {
        ok: false,
        message: `Too many verification requests from this network. Please try again in about ${mins} minute(s).`,
        cooldownSeconds: ipLimit.retryAfterSeconds,
      }
    }

    const verification = msc_generateVerificationToken()
    await ctx.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        verificationToken: verification.tokenHash,
        verificationTokenExpires: verification.expiresAt.toISOString(),
        lastVerificationSentAt: new Date(now).toISOString(),
      },
      overrideAccess: true,
    })

    msc_recordResendSend(clientIp)

    if (user.email?.trim()) {
      void msc_sendVerificationEmail({
        email: user.email.trim().toLowerCase(),
        name: user.username || null,
        token: verification.rawToken,
      }).catch((err) => {
        console.error('[msc] resend verification email failed:', err)
        msc_logVerificationTelemetry({
          kind: 'error',
          userId: user.id,
          ip: clientIp,
          extra: { step: 'send_email' },
        })
      })
    }

    msc_logVerificationTelemetry({ kind: 'resend_sent', userId: user.id, ip: clientIp })

    const c = await cookies()
    c.set({
      name: MSC_TRUST_GATE_COOKIE,
      value: '0',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
    return { ok: true, message: MSC_GENERIC_RESEND_MESSAGE }
  } catch (error) {
    console.error('ResendActionError:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    msc_logVerificationTelemetry({ kind: 'error', ip: clientIp, extra: { where: 'resend_action' } })
    return { ok: false, message: 'Unable to resend verification right now. Please try again.' }
  }
}
