import type { CollectionConfig } from 'payload'

import {
  msc_vaultCreateTask,
  msc_vaultDeleteOwnTasks,
  msc_vaultReadOwnTasks,
  msc_vaultUpdateOwnTasks,
} from '../lib/msc_vault_payload_access.ts'

export const MSC_Projectz_VaultTasks: CollectionConfig = {
  slug: 'msc-vault-tasks',
  labels: { singular: 'Vault Task', plural: 'Vault Tasks' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'project', 'updatedAt'],
  },
  access: {
    read: msc_vaultReadOwnTasks,
    create: msc_vaultCreateTask,
    update: msc_vaultUpdateOwnTasks,
    delete: msc_vaultDeleteOwnTasks,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'todo',
      options: [
        { label: 'To Do', value: 'todo' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Done', value: 'done' },
      ],
    },
    { name: 'completed', type: 'checkbox', defaultValue: false },
    { name: 'archived', type: 'checkbox', defaultValue: false },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'msc-vault-projects',
      required: true,
    },
  ],
  timestamps: true,
}
