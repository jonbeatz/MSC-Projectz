/**
 * Server-only: invite temp passwords use Node crypto. Do not import from client components.
 */
import { randomBytes } from 'crypto'

import { msc_validateNewPassword } from '@/lib/msc_password_policy'

/** Random password meeting {@link msc_validateNewPassword} (email invites; user changes after first sign-in). */
export function msc_generateCompliantRandomPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  for (let attempt = 0; attempt < 256; attempt++) {
    const raw = randomBytes(20)
    let p = ''
    for (let i = 0; i < 18; i++) {
      p += alphabet[raw[i] % alphabet.length]
    }
    if (msc_validateNewPassword(p).ok) return p
  }
  return 'Invite9!AaMmXxYyZz'
}
