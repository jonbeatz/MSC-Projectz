/** Rules for newly set passwords (signup, register, admin create/reset). */

export const MSC_PASSWORD_MIN_LENGTH = 8

export function msc_newPasswordPolicyHint(): string {
  return 'At least 8 characters with one uppercase letter, one number, and one special character.'
}

export function msc_validateNewPassword(password: string): { ok: true } | { ok: false; message: string } {
  const p = password ?? ''
  if (p.length < MSC_PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MSC_PASSWORD_MIN_LENGTH} characters.`,
    }
  }
  if (!/[A-Z]/.test(p)) {
    return { ok: false, message: 'Password must include at least one uppercase letter.' }
  }
  if (!/[0-9]/.test(p)) {
    return { ok: false, message: 'Password must include at least one number.' }
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    return {
      ok: false,
      message: 'Password must include at least one special character (for example !@#$%).',
    }
  }
  return { ok: true }
}

export function msc_isNewPasswordCompliant(password: string): boolean {
  return msc_validateNewPassword(password).ok
}

/** Progress meter: length 8+, uppercase, digit, special (4 rules). */
export function msc_newPasswordRulesScore(password: string): { met: number; total: 4 } {
  const p = password ?? ''
  let met = 0
  if (p.length >= MSC_PASSWORD_MIN_LENGTH) met++
  if (/[A-Z]/.test(p)) met++
  if (/[0-9]/.test(p)) met++
  if (/[^A-Za-z0-9]/.test(p)) met++
  return { met, total: 4 }
}
