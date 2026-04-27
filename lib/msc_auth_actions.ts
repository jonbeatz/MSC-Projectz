'use server'

/**
 * Auth-only server actions (registration, future SMTP verification flows).
 * Vault/project APIs remain in `lib/msc_vault_server_actions.ts`.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { msc_validateNewPassword } from '@/lib/msc_password_policy'
import { msc_sendWelcomeEmail } from '@/lib/msc_smtp_nodemailer'

type MscRegisterUserResult = { success: boolean; message: string }

export async function msc_registerUser(
  email: string,
  password: string,
  name: string,
): Promise<MscRegisterUserResult> {
  const payload = await getPayload({ config })
  const msc_email = email.trim().toLowerCase()
  const msc_password = password
  const msc_name = name.trim()

  if (!msc_email) return { success: false, message: 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msc_email)) {
    return { success: false, message: 'Enter a valid email address.' }
  }
  const msc_pwCheck = msc_validateNewPassword(msc_password)
  if (!msc_pwCheck.ok) {
    return { success: false, message: msc_pwCheck.message }
  }
  if (!msc_name) return { success: false, message: 'Name is required.' }

  try {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: msc_email } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      return { success: false, message: 'An account with this email already exists.' }
    }
  } catch {
    return { success: false, message: 'Unable to validate this request right now.' }
  }

  try {
    await payload.create({
      collection: 'users',
      data: {
        username: msc_name,
        email: msc_email,
        password: msc_password,
        role: 'user',
      },
      overrideAccess: true,
    })
    void msc_sendWelcomeEmail(msc_email, msc_name).catch((err) =>
      console.error('[msc] Welcome email failed:', err),
    )
    return { success: true, message: 'Request sent. Return to login to continue.' }
  } catch {
    return { success: false, message: 'Registration failed. Please try again.' }
  }
}
