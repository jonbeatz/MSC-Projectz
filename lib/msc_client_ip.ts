/**
 * Best-effort client IP for rate limits and telemetry (no PII in logs — use with `msc_hashIpForTelemetry`).
 * Trust order: `cf-connecting-ip` → first `x-forwarded-for` hop → `x-real-ip` → `unknown`.
 */
export function msc_getClientIpFromHeaders(h: { get: (name: string) => string | null | undefined }): string {
  const cf = h.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const xff = h.get('x-forwarded-for')?.trim()
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }

  const real = h.get('x-real-ip')?.trim()
  if (real) return real

  return 'unknown'
}
