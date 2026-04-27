import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { msc_createSmtpTransporter } from '@/lib/msc_smtp_nodemailer'
import { msc_outgoingSmtpIsSendReady } from '@/lib/msc_smtp_resolve'

const MSC_VERIFICATION_TTL_HOURS = 24

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
}): Promise<void> {
  const { transporter, fromAddress, layered } = msc_createSmtpTransporter(null)
  if (!msc_outgoingSmtpIsSendReady(layered)) {
    console.warn(
      '[msc] Verification email skipped: outgoing SMTP is not fully configured. Set `MSC_STUDIO_OUTGOING_*` or project/System SMTP.',
    )
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://127.0.0.1:3000'
  const verifyUrl = `${baseUrl.replace(/\/$/, '')}/auth/verify?token=${encodeURIComponent(input.token)}`
  const greeting = input.name?.trim() ? `Hello ${input.name.trim()},` : 'Hello,'

  await transporter.sendMail({
    from: fromAddress,
    to: input.email,
    subject: 'Verify your MSC-Projectz account',
    text:
      `${greeting}\n\n` +
      `Please verify your email address to activate your account.\n\n` +
      `${verifyUrl}\n\n` +
      `This link expires in ${MSC_VERIFICATION_TTL_HOURS} hours.`,
  })
}
