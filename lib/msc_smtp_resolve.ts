import type { EmailSettings, MscProjectOutgoingSmtp, MscSmtpEncryption, SpacemailSMTP } from '@/lib/types'
import { MSC_STUDIO_DEFAULT_OUTGOING_SMTP } from '@/lib/msc_studio_default_smtp'

/**
 * System Settings SMTP in the app store is client-only. Server-side sends use
 * this shape layered with project `outgoing` and optional env in `msc_smtp_nodemailer.ts`.
 */
export function msc_spacemailToDefaultProjectEmailSettings(s: SpacemailSMTP): EmailSettings {
  const inPort = parseInt(String(s.incomingPort || '993').trim(), 10)
  const outPort = parseInt(String(s.outgoingPort || '465').trim(), 10)
  return {
    incoming: {
      host: (s.incomingHost || '').trim(),
      port: Number.isFinite(inPort) && inPort > 0 ? inPort : 993,
      username: s.username || '',
      password: s.password || '',
    },
    outgoing: {
      host: (s.outgoingHost || '').trim(),
      port: Number.isFinite(outPort) && outPort > 0 ? outPort : 465,
      username: s.username || '',
      password: s.password || '',
      encryption: s.ssl ? 'ssl' : 'tls',
    },
  }
}

/**
 * Effective **outgoing** SMTP for send/verify: project `outgoing` first, then `globalSmtp` per field.
 */
export function msc_mergedOutgoingForSmtp(
  project: EmailSettings | null | undefined,
  globalSmtp: SpacemailSMTP = MSC_STUDIO_DEFAULT_OUTGOING_SMTP,
): MscProjectOutgoingSmtp {
  const g = msc_spacemailToDefaultProjectEmailSettings(globalSmtp).outgoing
  if (!project || !String(project.outgoing?.host || '').trim()) {
    return g
  }
  const o = project.outgoing
  return {
    host: String(o.host).trim(),
    port: typeof o.port === 'number' && o.port > 0 ? o.port : g.port,
    username: String(o.username || '').trim() || g.username,
    password: String(o.password || '').trim() || g.password,
    encryption: (o.encryption as MscSmtpEncryption) || g.encryption,
  }
}

/**
 * `true` when the merged outgoing config can authenticate with nodemailer.
 */
export function msc_outgoingSmtpIsSendReady(settings: MscProjectOutgoingSmtp): boolean {
  if (!String(settings.host || '').trim()) return false
  if (!String(settings.username || '').trim() || !String(settings.password || '').trim()) return false
  if (!(typeof settings.port === 'number') || settings.port <= 0) return false
  return true
}
