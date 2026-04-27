import { createHash } from 'node:crypto'

const MSC_PREFIX = '[msc:verification]'

/** Short stable fingerprint for log correlation (not reversible to raw IP in isolation). */
export function msc_hashIpForTelemetry(ip: string): string {
  const salt = process.env.PAYLOAD_SECRET || 'msc-verification-telemetry'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 10)
}

export type MscVerificationTelemetryKind =
  | 'resend_attempt'
  | 'resend_sent'
  | 'resend_user_cooldown'
  | 'resend_ip_limited'
  | 'resend_already_verified'
  | 'register_send'
  | 'register_ip_limited'
  | 'verify_token_ok'
  | 'verify_token_invalid'
  | 'verify_token_expired'
  | 'error'

/**
 * One JSON line per event for log aggregation (drop-off, abuse, SLOs).
 * Never log raw IPs or verification tokens.
 */
export function msc_logVerificationTelemetry(payload: {
  kind: MscVerificationTelemetryKind
  userId?: string | number
  ip?: string
  extra?: Record<string, string | number | boolean | null | undefined>
}): void {
  const { kind, userId, ip, extra } = payload
  const line = {
    t: new Date().toISOString(),
    kind,
    ...(userId != null ? { userId: String(userId) } : {}),
    ...(ip && ip !== 'unknown' ? { ipHash: msc_hashIpForTelemetry(ip) } : {}),
    ...extra,
  }
  try {
    console.log(`${MSC_PREFIX} ${JSON.stringify(line)}`)
  } catch {
    /* ignore */
  }
}
