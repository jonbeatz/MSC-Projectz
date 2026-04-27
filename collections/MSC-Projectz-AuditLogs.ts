import type { CollectionConfig } from 'payload'
import { msc_vaultIsPayloadAdmin } from '../lib/msc_vault_payload_access.ts'

export const MSC_Projectz_AuditLogs: CollectionConfig = {
  slug: 'msc-audit-logs',
  labels: { singular: 'Audit Log', plural: 'Audit Logs' },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'actor', 'target', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      const user = req.user as Parameters<typeof msc_vaultIsPayloadAdmin>[0]
      return msc_vaultIsPayloadAdmin(user)
    },
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { description: 'Admin user who initiated the action.' },
    },
    {
      name: 'target',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: { description: 'Target user record for the action, if applicable.' },
    },
    {
      name: 'action',
      type: 'text',
      required: true,
      admin: { description: 'Audit action key (e.g. USER_DELETE, PASSWORD_RESET).' },
    },
    {
      name: 'details',
      type: 'json',
      required: false,
      admin: { description: 'Structured metadata (never include secrets).' },
    },
  ],
  timestamps: true,
}
