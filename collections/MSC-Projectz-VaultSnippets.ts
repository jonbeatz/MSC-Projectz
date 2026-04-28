import type { CollectionConfig, PayloadRequest } from 'payload'

import { msc_hasAdminAccess } from '../lib/msc_roles.ts'
import {
  msc_vaultCreateSnippet,
  msc_vaultDeleteOwnSnippets,
  msc_vaultReadOwnSnippets,
  msc_vaultUpdateOwnSnippets,
  msc_vaultUserOwnsProjectForWrite,
  type MscUserWithRole,
} from '../lib/msc_vault_payload_access.ts'

type MscSnippetDoc = {
  author?: string | number | { id: string | number } | null
  project?: string | number | { id: string | number } | null
  status?: 'draft' | 'published' | 'archived' | null
}

function msc_snippetProjectId(doc: MscSnippetDoc | null | undefined): string | number | null {
  const p = doc?.project
  if (p == null) return null
  if (typeof p === 'object' && 'id' in p) return (p as { id: string | number }).id
  return p
}

function msc_vaultSnippetBeforeValidate(args: {
  data?: Partial<Record<string, unknown>>
  req: PayloadRequest
  operation: 'create' | 'update' | 'delete'
}) {
  const { data, req, operation } = args
  if (!data) return data
  const user = req.user as MscUserWithRole | undefined
  if (operation === 'create' && user && (data.author === undefined || data.author === null)) {
    data.author = user.id
  }
  return data
}

async function msc_vaultSnippetBeforeChange({
  data,
  req,
  operation,
  originalDoc,
}: {
  data: Record<string, unknown>
  req: PayloadRequest
  operation: 'create' | 'update' | 'delete'
  originalDoc?: Record<string, unknown> | null
}) {
  const user = req.user as MscUserWithRole | undefined
  if (!user) return data

  const prevStatus = (originalDoc as MscSnippetDoc | undefined)?.status
  const nextStatus = (data.status as MscSnippetDoc['status']) ?? prevStatus
  const wasPublished = prevStatus === 'published'
  const willBePublished = nextStatus === 'published'

  if (willBePublished && !wasPublished) {
    const projectId =
      (data.project as string | number | undefined) ?? msc_snippetProjectId(originalDoc as MscSnippetDoc)
    if (projectId == null) {
      throw new Error('Snippet must be linked to a project before publishing.')
    }
    const project = await req.payload.findByID({
      collection: 'msc-vault-projects',
      id: projectId,
      depth: 0,
      overrideAccess: true,
    })
    const projectRow = project as { user?: unknown; members?: unknown } | null
    if (!msc_hasAdminAccess(user.role) && !msc_vaultUserOwnsProjectForWrite(user, projectRow)) {
      throw new Error('Only project owners or admins can publish snippets.')
    }
  }

  return data
}

export const MSC_Projectz_VaultSnippets: CollectionConfig = {
  slug: 'msc-vault-snippets',
  labels: { singular: 'Vault Snippet', plural: 'Vault Snippets' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'author', 'status', 'visibility', 'updatedAt'],
  },
  access: {
    read: msc_vaultReadOwnSnippets,
    create: msc_vaultCreateSnippet,
    update: msc_vaultUpdateOwnSnippets,
    delete: msc_vaultDeleteOwnSnippets,
  },
  hooks: {
    beforeValidate: [msc_vaultSnippetBeforeValidate],
    beforeChange: [msc_vaultSnippetBeforeChange],
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'msc-vault-projects',
      required: true,
      admin: { description: 'Vault project this snippet belongs to.' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: { description: 'Defaults to the current user on create (beforeValidate).' },
    },
    { name: 'title', type: 'text', required: true },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: { description: 'Snippet body (code or notes).' },
    },
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'typescript',
      options: [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'CSS', value: 'css' },
        { label: 'PHP', value: 'php' },
        { label: 'HTML', value: 'html' },
        { label: 'JSON', value: 'json' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'Shell', value: 'shell' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [
        { label: 'Core Engine', value: 'core-engine' },
        { label: 'Divi Custom', value: 'divi-custom' },
        { label: 'CSS Fixes', value: 'css-fixes' },
        { label: 'API Logic', value: 'api-logic' },
        { label: 'SKILLS', value: 'skills' },
        { label: 'Rules', value: 'rules' },
        { label: 'General', value: 'general' },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'personal',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Project', value: 'project' },
      ],
      admin: {
        description:
          'Personal: visible only to the author until published rules apply. Project: shared when published.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
  timestamps: true,
}
