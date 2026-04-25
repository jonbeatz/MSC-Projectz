import type { CollectionConfig } from 'payload'

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
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
      admin: { description: 'Admins can see all vault projects; users are scoped to their own.' },
    },
  ],
}
