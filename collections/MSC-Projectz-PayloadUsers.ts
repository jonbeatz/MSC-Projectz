import type { Access, CollectionConfig, Where } from 'payload'
import { msc_hasAdminAccess } from '@/lib/msc_roles'

/**
 * Distinguish Payload admins (full vault visibility) from standard users (tenant-scoped data).
 * Sync with Vader `User.role` in the app UI.
 */
export const MSC_Projectz_PayloadUsers: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (msc_hasAdminAccess(user.role)) return true
      return { id: { equals: user.id } } as Where
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (msc_hasAdminAccess(user.role)) return true
      return String(user.id) === String(id)
    },
    create: ({ req: { user } }) => Boolean(user && msc_hasAdminAccess(user.role)),
    delete: ({ req: { user } }) => Boolean(user && msc_hasAdminAccess(user.role)),
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      admin: { description: 'Display name shown in the Command Center UI.' },
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'media',
      admin: { description: 'Profile avatar media document.' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Master Admin', value: 'master-admin' },
      ],
      admin: {
        description:
          'Master Admin and Admin can see all vault projects; users are scoped to their own.',
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Whether this account has completed email verification.' },
    },
    {
      name: 'verificationToken',
      type: 'text',
      index: true,
      required: false,
      admin: { description: 'SHA-256 hash of active email verification token.' },
    },
    {
      name: 'verificationTokenExpires',
      type: 'date',
      required: false,
      admin: { description: 'Verification token expiry timestamp (UTC).' },
    },
    {
      name: 'lastVerificationSentAt',
      type: 'date',
      required: false,
      admin: { description: 'Most recent verification email send timestamp (for resend throttling).' },
    },
  ],
}
