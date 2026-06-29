import type { CollectionConfig } from 'payload'

import { msc_mscClientsAdminWriteAccess, msc_readMscClientsAccess } from '../lib/msc_client_access.ts'

export const MSC_Projectz_Clients: CollectionConfig = {
  slug: 'msc-clients',
  labels: { singular: 'MSC Client', plural: 'MSC Clients' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'status', 'updatedAt'] },
  access: {
    read: msc_readMscClientsAccess,
    create: msc_mscClientsAdminWriteAccess,
    update: msc_mscClientsAdminWriteAccess,
    delete: msc_mscClientsAdminWriteAccess,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'lead',
      options: [
        { label: 'Lead', value: 'lead' },
        { label: 'Active', value: 'active' },
        { label: 'Onboarding', value: 'onboarding' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'primaryContact',
      type: 'group',
      required: true,
      admin: {
        description:
          'Client-facing contact. Link `user` to the Payload account used for the client portal (read access).',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'When set, this user may read this client in the app (client portal / PAC).',
          },
        },
      ],
    },
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'msc-vault-projects',
      hasMany: true,
      admin: {
        description:
          'Projects linked to this account. The vault project’s `client` field is the primary join; this list is kept in sync when possible.',
      },
    },
    {
      name: 'clientVault',
      type: 'json',
      admin: {
        description:
          'Structured CRM metadata. App usage: `{ onboardingChecklist: [{ id, label, completed }] }` (persisted from Command Center client drawer).',
      },
    },
  ],
  timestamps: true,
}
