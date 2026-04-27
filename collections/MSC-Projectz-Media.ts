import type { Access, CollectionConfig, TypeWithID, Where } from 'payload'
import { msc_hasAdminAccess } from '@/lib/msc_roles'

type MscMediaUser = { id: string | number; role?: 'master-admin' | 'admin' | 'user' | null }

const msc_mediaReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (msc_hasAdminAccess((user as MscMediaUser).role)) return true
  return { owner: { equals: (user as MscMediaUser).id } } as Where
}

const msc_mediaWriteAccess: Access = ({ req: { user } }) => Boolean(user)

type MscMediaRow = TypeWithID & {
  owner?: string | number | { id?: string | number } | null
}

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
  hooks: {
    beforeChange: [
      ({ req, data, operation, originalDoc }) => {
        if (!req.user) return data
        if (msc_hasAdminAccess((req.user as MscMediaUser).role)) return data

        const next = { ...(data as Record<string, unknown>) }
        if (operation === 'create') {
          next.owner = req.user.id
          return next
        }

        const prevOwner = (originalDoc as MscMediaRow | undefined)?.owner
        const prevOwnerId =
          typeof prevOwner === 'object' && prevOwner !== null && 'id' in prevOwner
            ? prevOwner.id
            : prevOwner
        next.owner = prevOwnerId ?? req.user.id
        return next
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
