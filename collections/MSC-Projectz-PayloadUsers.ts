import type { Access, CollectionConfig, Where } from 'payload'

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
      if (user.role === 'admin') return true
      return { id: { equals: user.id } } as Where
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return String(user.id) === String(id)
    },
    create: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
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
      ],
      admin: { description: 'Admins can see all vault projects; users are scoped to their own.' },
    },
  ],
}
