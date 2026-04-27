import type { CollectionConfig, PayloadRequest, TypeWithID } from 'payload'

import { adminRowsStartCollapsed } from '../lib/payload-admin-defaults.ts'
import {
  msc_vaultCreateProject,
  msc_vaultDeleteOwnProject,
  msc_vaultReadOwnProjects,
  msc_vaultUpdateOwnProject,
} from '../lib/msc_vault_payload_access.ts'

function msc_coerceUsersRelId(
  req: { payload: import('payload').Payload },
  id: string | number,
): string | number {
  const idType =
    req.payload.collections['users']?.customIDType || req.payload.db?.defaultIDType || 'text'
  if (idType === 'number' && /^\d+$/.test(String(id).trim())) {
    return Number(String(id).trim())
  }
  return id
}

async function msc_assignProjectUserBeforeChange<T extends TypeWithID>({
  data,
  operation,
  originalDoc,
  req,
}: {
  data: Partial<T>
  operation: 'create' | 'update'
  originalDoc?: T
  req: PayloadRequest
} & Record<string, unknown>): Promise<Partial<T>> {
  const projectData = data as Partial<T> & { user?: string | number | null }
  if (operation === 'update' && originalDoc) {
    const owner = (originalDoc as { user?: string | number | null }).user
    if (owner !== undefined && owner !== null) {
      return { ...data, user: owner } as Partial<T>
    }
  }
  if (req.user) {
    return { ...data, user: msc_coerceUsersRelId(req, req.user.id) } as Partial<T>
  }
  if (projectData.user) {
    return data
  }
  return data
}

export const MSC_Projectz_VaultProjects: CollectionConfig = {
  slug: 'msc-vault-projects',
  labels: { singular: 'Vault Project', plural: 'Vault Projects' },
  admin: {
    useAsTitle: 'name',
    /** `updatedAt` is Payload timestamps — no manual DB index here; Drizzle/Payload own the schema. */
    defaultColumns: ['name', 'status', 'user', 'progress', 'updatedAt'],
  },
  access: {
    /** See `lib/msc_vault_payload_access.ts` — admin: all rows; else `user` = `req.user.id` only. */
    read: msc_vaultReadOwnProjects,
    create: msc_vaultCreateProject,
    update: msc_vaultUpdateOwnProject,
    delete: msc_vaultDeleteOwnProject,
  },
  hooks: {
    beforeChange: [msc_assignProjectUserBeforeChange],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { description: 'Tenant owner; new projects are assigned from the current session when present.' },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Workspace collaborators with access to this project.',
        hidden: false,
      },
    },
    /**
     * Data-URL thumbnails exceed Payload default `defaultMaxTextLength` (40k) unless raised per-field.
     */
    { name: 'thumbnail', type: 'text', maxLength: 15_000_000 },
    { name: 'localPath', type: 'text' },
    { name: 'liveUrl', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'local',
      options: [
        { label: 'Local', value: 'local' },
        { label: 'Live', value: 'live' },
      ],
    },
    {
      name: 'progress',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 0,
    },
    {
      name: 'localNotes',
      type: 'textarea',
      admin: { description: 'Notes for local / dev environment' },
    },
    {
      name: 'liveNotes',
      type: 'textarea',
      admin: { description: 'Notes for production / live deployment' },
    },
    {
      name: 'referencesJson',
      type: 'textarea',
      maxLength: 25_000_000,
      admin: {
        description: 'JSON array of reference links/files (managed by the app UI)',
      },
    },
    {
      name: 'credentials',
      type: 'array',
      ...adminRowsStartCollapsed,
      fields: [
        { name: 'credentialId', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'username', type: 'text', required: true },
        { name: 'password', type: 'text', required: true },
      ],
    },
    {
      name: 'emailSettings',
      type: 'group',
      admin: { description: 'Per-project IMAP (incoming) and SMTP (outgoing). Empty fields fall back to studio defaults when applicable.' },
      fields: [
        {
          name: 'incoming',
          type: 'group',
          label: 'Incoming (IMAP)',
          fields: [
            { name: 'host', type: 'text' },
            { name: 'port', type: 'number', min: 1, max: 65535, defaultValue: 993 },
            { name: 'username', type: 'text' },
            { name: 'password', type: 'text' },
          ],
        },
        {
          name: 'outgoing',
          type: 'group',
          label: 'Outgoing (SMTP)',
          fields: [
            { name: 'host', type: 'text' },
            { name: 'port', type: 'number', min: 1, max: 65535, defaultValue: 465 },
            { name: 'username', type: 'text' },
            { name: 'password', type: 'text' },
            {
              name: 'encryption',
              type: 'select',
              defaultValue: 'ssl',
              options: [
                { label: 'SSL (e.g. 465)', value: 'ssl' },
                { label: 'TLS / STARTTLS (e.g. 587)', value: 'tls' },
                { label: 'None', value: 'none' },
              ],
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
