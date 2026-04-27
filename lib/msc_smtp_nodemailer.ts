import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { EmailSettings, MscProjectOutgoingSmtp, MscSmtpEncryption, SpacemailSMTP } from '@/lib/types'
import { MSC_STUDIO_DEFAULT_OUTGOING_SMTP } from '@/lib/msc_studio_default_smtp'
import {
  msc_mergedOutgoingForSmtp,
  msc_outgoingSmtpIsSendReady,
  msc_spacemailToDefaultProjectEmailSettings,
} from '@/lib/msc_smtp_resolve'

type MscSmtpBuildInput = { host: string; port: number; username: string; password: string; encryption: string }

/**
 * Read optional env fallbacks to supplement client-only "global" defaults on the server.
 * Does not log secrets; same keys the operator can set in deployment env.
 */
function msc_envOutgoingOverride(): SpacemailSMTP {
  const base = { ...MSC_STUDIO_DEFAULT_OUTGOING_SMTP }
  const h = process.env.MSC_STUDIO_OUTGOING_HOST?.trim()
  const p = process.env.MSC_STUDIO_OUTGOING_PORT?.trim()
  if (h) base.outgoingHost = h
  if (p) base.outgoingPort = p
  if (process.env.MSC_STUDIO_OUTGOING_USER != null) base.username = process.env.MSC_STUDIO_OUTGOING_USER
  if (process.env.MSC_STUDIO_OUTGOING_PASS != null) base.password = process.env.MSC_STUDIO_OUTGOING_PASS
  if (process.env.MSC_STUDIO_OUTGOING_SSL != null) {
    base.ssl = /^(1|true|yes)$/i.test(String(process.env.MSC_STUDIO_OUTGOING_SSL).trim())
  }
  return base
}

export function msc_createSmtpTransporter(
  fromProject: EmailSettings | null | undefined,
  globalSmtp: SpacemailSMTP = msc_envOutgoingOverride(),
): { transporter: Transporter; fromAddress: string; layered: MscProjectOutgoingSmtp } {
  const layered = msc_mergedOutgoingForSmtp(fromProject, globalSmtp)
  const t = msc_nodemailerOptionsFromSettings(layered)
  const fromAddress = layered.username.includes('@') ? layered.username : 'noreply@localhost'
  return {
    transporter: nodemailer.createTransport(t),
    fromAddress,
    layered,
  }
}

function msc_nodemailerOptionsFromSettings(s: MscSmtpBuildInput) {
  const { host, port, username, password } = s
  const enc = (s.encryption || 'ssl').toLowerCase()
  const auth = { user: username, pass: password }
  if (enc === 'ssl') {
    return { host, port, secure: true, auth }
  }
  if (enc === 'none') {
    return { host, port, secure: false, auth, ignoreTLS: true } as const
  }
  return { host, port, secure: false, requireTLS: true, auth }
}

export async function msc_smtpVerifyOutgoingSettings(settings: MscProjectOutgoingSmtp): Promise<void> {
  const t = msc_nodemailerOptionsFromSettings(settings)
  const transporter = nodemailer.createTransport(t)
  await transporter.verify()
}

export function msc_testSettingsFromForm(input: {
  host: string
  port: number
  username: string
  password: string
  encryption: string
}): Promise<void> {
  return msc_smtpVerifyOutgoingSettings({
    host: input.host,
    port: input.port,
    username: input.username,
    password: input.password,
    encryption: input.encryption as MscSmtpEncryption,
  })
}

/**
 * Fires when a task titled like "Send notification" is completed. Uses project `emailSettings` first,
 * then the same environment/studio default fallback as the rest of the stack.
 * Never throws: failures are logged for operators.
 */
export async function msc_sendSendNotificationTaskEmail(opts: {
  toEmail: string
  taskTitle: string
  projectName: string
  fromProject: EmailSettings | null | undefined
}): Promise<void> {
  const { transporter, fromAddress, layered } = msc_createSmtpTransporter(opts.fromProject)
  if (!msc_outgoingSmtpIsSendReady(layered)) {
    console.warn(
      '[msc] Send Notification task completed but outgoing SMTP is not fully configured. Set project email settings, System SMTP (client) mirror env `MSC_STUDIO_OUTGOING_*`, or .env host/user/pass.',
    )
    return
  }
  try {
    await transporter.sendMail({
      from: fromAddress,
      to: opts.toEmail,
      subject: `MSC: ${opts.taskTitle}`,
      text: `Task completed on “${opts.projectName}”.\n\n${opts.taskTitle}\n`,
    })
  } catch (e) {
    console.warn('[msc] outgoing mail send failed', e)
  }
}

/**
 * Registration welcome: uses studio/env outgoing SMTP (no per-project `EmailSettings`).
 * `sendMail` errors propagate so callers can fire-and-forget with `.catch`.
 * Returns early (no throw) if SMTP is not send-ready; same `msc_outgoingSmtpIsSendReady` as task mail.
 */
export async function msc_sendWelcomeEmail(email: string, name: string): Promise<void> {
  const { transporter, fromAddress, layered } = msc_createSmtpTransporter(null)
  if (!msc_outgoingSmtpIsSendReady(layered)) {
    console.warn(
      '[msc] Welcome email skipped: outgoing SMTP is not fully configured. Set `MSC_STUDIO_OUTGOING_*` or project/System SMTP.',
    )
    return
  }
  const greeting = name.trim() ? `Hello ${name.trim()},` : 'Hello,'
  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Welcome to MSC-Projectz',
    text: `${greeting}\n\nYour MSC-Projectz account is ready. You can sign in with this email address.\n`,
  })
}

/**
 * For server actions that have no `EmailSettings` but can pass global `SpacemailSMTP` from the app store shape.
 */
export function msc_verifyFromSpacemail(smtp: SpacemailSMTP) {
  const o = msc_spacemailToDefaultProjectEmailSettings(smtp).outgoing
  return msc_smtpVerifyOutgoingSettings(o)
}
