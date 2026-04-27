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
    defaultColumns: ['title', 'status', 'priority', 'dueDate', 'project', 'updatedAt'],
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
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: { description: 'Optional. Shown in task details and (future) calendar view.' },
    },
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
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'normal',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
      ],
      admin: { description: 'Used for schedule ordering and (future) calendar affordances.' },
    },
    {
      name: 'dueDate',
      type: 'date',
      label: 'Due date',
      admin: {
        description: 'Date-only. Appears on the project calendar (Sprint 5) when set.',
      },
    },
    { name: 'completed', type: 'checkbox', defaultValue: false },
    { name: 'archived', type: 'checkbox', defaultValue: false },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'msc-vault-projects',
      required: true,
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User assigned to this task.',
      },
    },
  ],
  timestamps: true,
}
