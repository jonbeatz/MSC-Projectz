import type { Access, CollectionConfig, Where } from 'payload'

type MscMediaUser = { id: string | number; role?: 'admin' | 'user' | null }

const msc_mediaReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as MscMediaUser).role === 'admin') return true
  return { owner: { equals: (user as MscMediaUser).id } } as Where
}

const msc_mediaWriteAccess: Access = ({ req: { user } }) => Boolean(user)

export const MSC_Projectz_Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: msc_mediaReadAccess,
    create: msc_mediaWriteAccess,
    update: msc_mediaReadAccess,
    delete: msc_mediaReadAccess,
  },
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { description: 'Tenant owner for uploaded media.' },
    },
  ],
}
