import type { CollectionConfig, Where } from 'payload'
import { msc_isMasterAdminRole } from '@/lib/msc_roles'

/**
 * User directory: Master Admin sees all accounts; other roles only their own row (user cage).
 * Vault/project visibility for admins remains in vault collections — do not conflate with this list.
 */
export const MSC_Projectz_PayloadUsers: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeChange: [
      ({ req, data, originalDoc, operation }) => {
        if (!req.user) return data
        if (msc_isMasterAdminRole((req.user as { role?: unknown }).role)) return data

        const next = data as { role?: unknown }
        if (operation === 'update' && next.role !== undefined) {
          const prevRole = (originalDoc as { role?: unknown } | null | undefined)?.role
          if (next.role !== prevRole) {
            throw new Error('Unauthorized: only a Master Admin can change roles.')
          }
        }
        return data
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (msc_isMasterAdminRole(user.role)) return true
      return { id: { equals: user.id } } as Where
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (msc_isMasterAdminRole(user.role)) return true
      return String(user.id) === String(id)
    },
    create: ({ req: { user } }) => Boolean(user && msc_isMasterAdminRole(user.role)),
    delete: ({ req: { user } }) => Boolean(user && msc_isMasterAdminRole(user.role)),
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
          'Master Admin: full user directory + role control. Other admins: own account only in Settings; vault access follows vault collection rules.',
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
