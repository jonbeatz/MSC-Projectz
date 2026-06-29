import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { msc_createSmtpTransporter } from '@/lib/msc_smtp_nodemailer'
import { msc_outgoingSmtpIsSendReady } from '@/lib/msc_smtp_resolve'
import {
  MSC_VERIFICATION_EMAIL_TTL_HOURS,
  msc_buildVerificationEmailParts,
} from '@/lib/msc_verification_email_template'

const MSC_VERIFICATION_TTL_HOURS = MSC_VERIFICATION_EMAIL_TTL_HOURS

export function msc_hashVerificationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export function msc_generateVerificationToken(ttlHours = MSC_VERIFICATION_TTL_HOURS): {
  rawToken: string
  tokenHash: string
  expiresAt: Date
} {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = msc_hashVerificationToken(rawToken)
  const expiresAt = new Date(Date.now() + Math.max(1, ttlHours) * 60 * 60 * 1000)
  return { rawToken, tokenHash, expiresAt }
}

export function msc_verifyToken(input: {
  storedHash: string | null | undefined
  rawToken: string
  expiresAt: Date | string | null | undefined
}): boolean {
  const { storedHash, rawToken, expiresAt } = input
  if (!storedHash || !rawToken.trim()) return false

  const expiry = expiresAt ? new Date(expiresAt) : null
  if (!expiry || Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) return false

  const computed = msc_hashVerificationToken(rawToken.trim())
  const stored = Buffer.from(storedHash)
  const incoming = Buffer.from(computed)
  if (stored.length !== incoming.length) return false
  return timingSafeEqual(stored, incoming)
}

export async function msc_sendVerificationEmail(input: {
  email: string
  name?: string | null
  token: string
  /** When set, email explains studio invite and includes temp password for sign-in after verify. */
  inviteTemporaryPassword?: string
}): Promise<void> {
  const { transporter, fromAddress, layered } = msc_createSmtpTransporter(null)
  if (!msc_outgoingSmtpIsSendReady(layered)) {
    console.warn(
      '[msc] Verification email skipped: outgoing SMTP is not fully configured. Set `MSC_STUDIO_OUTGOING_*` or project/System SMTP.',
    )
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://127.0.0.1:3000'
  const origin = baseUrl.replace(/\/$/, '')
  const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(input.token)}`
  const invitePw = input.inviteTemporaryPassword?.trim()
  const parts = msc_buildVerificationEmailParts({
    recipientName: input.name,
    recipientEmail: input.email,
    verifyUrl,
    signInOrigin: origin,
    mode: invitePw ? 'invite' : 'signup',
    inviteTemporaryPassword: invitePw || undefined,
    ttlHours: MSC_VERIFICATION_TTL_HOURS,
  })

  await transporter.sendMail({
    from: fromAddress,
    to: input.email,
    subject: parts.subject,
    text: parts.text,
    html: parts.html,
  })
}
