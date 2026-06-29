/**
 * In-process sliding-window limits for verification email abuse.
 * Suitable for a **single Node process** (e.g. cPanel / one PM2 worker). For multi-replica, use a shared store (Redis).
 */

const resendWindow = new Map<string, number[]>()
const registerRequestWindow = new Map<string, number[]>()

function msc_isDisabled(): boolean {
  return (
    process.env.MSC_VERIFICATION_DISABLE_IP_RATE_LIMIT === 'true' ||
    process.env.MSC_VERIFICATION_DISABLE_IP_RATE_LIMIT === '1'
  )
}

function msc_prune(ts: number[], now: number, windowMs: number): number[] {
  return ts.filter((t) => now - t < windowMs)
}

function msc_check(
  m: Map<string, number[]>,
  ip: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  if (msc_isDisabled()) return { ok: true }
  const key = ip && ip !== 'unknown' ? ip : '_unknown_'
  const now = Date.now()
  const prev = m.get(key) ?? []
  const next = msc_prune(prev, now, windowMs)
  if (next.length >= max) {
    const oldest = Math.min(...next)
    const waitMs = oldest + windowMs - now
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) }
  }
  return { ok: true }
}

function msc_record(m: Map<string, number[]>, ip: string, windowMs: number) {
  const key = ip && ip !== 'unknown' ? ip : '_unknown_'
  const now = Date.now()
  const prev = m.get(key) ?? []
  const next = msc_prune([...prev, now], now, windowMs)
  m.set(key, next)
}

/** Resend flow: after per-account cooldown; limits burst abuse per network. */
export function msc_checkResendIpLimit(ip: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const max = Number(process.env.MSC_IP_RESEND_MAX) || 20
  const windowMs = Number(process.env.MSC_IP_RESEND_WINDOW_MS) || 60 * 60 * 1000
  return msc_check(resendWindow, ip, max, windowMs)
}

export function msc_recordResendSend(ip: string) {
  if (msc_isDisabled()) return
  const windowMs = Number(process.env.MSC_IP_RESEND_WINDOW_MS) || 60 * 60 * 1000
  msc_record(resendWindow, ip, windowMs)
}

/**
 * Every **registration form submission** (after field validation), including
 * "email already exists" — blocks brute-force probing without creating users.
 */
export function msc_checkAndRecordRegisterRequest(ip: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
  if (msc_isDisabled()) return { ok: true }
  const max = Number(process.env.MSC_IP_REGISTER_ATTEMPT_MAX) || 25
  const windowMs = Number(process.env.MSC_IP_REGISTER_ATTEMPT_WINDOW_MS) || 60 * 60 * 1000
  const key = ip && ip !== 'unknown' ? ip : '_unknown_'
  const now = Date.now()
  const prev = registerRequestWindow.get(key) ?? []
  const pruned = msc_prune(prev, now, windowMs)
  if (pruned.length >= max) {
    const oldest = Math.min(...pruned)
    const waitMs = oldest + windowMs - now
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) }
  }
  pruned.push(now)
  registerRequestWindow.set(key, pruned)
  return { ok: true }
}
