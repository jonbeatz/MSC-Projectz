import type { CollectionConfig } from 'payload'

export const MSC_Projectz_Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  upload: true,
  fields: [],
}
