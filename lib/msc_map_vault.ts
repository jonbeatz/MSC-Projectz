import type { Credential, EmailSettings, Project, Task, TaskStatus } from '@/lib/types'
import { getSafePath } from '@/lib/env-utils'
import { msc_parseReferencesJson } from '@/lib/msc_project_references'

type MscVaultProjectDoc = {
  id: number | string
  name: string
  user?: string | number | { id: string | number } | null
  thumbnail?: string | null
  localPath?: string | null
  liveUrl?: string | null
  status: 'local' | 'live'
  localNotes?: string | null
  liveNotes?: string | null
  referencesJson?: string | null
  progress?: number | null
  credentials?: Array<{
    credentialId?: string | null
    id?: string | null
    label: string
    username: string
    password: string
  }> | null
  emailSettings?: EmailSettings | null
  createdAt: string
  updatedAt: string
}

type MscVaultTaskDoc = {
  id: number | string
  title: string
  status: TaskStatus
  completed?: boolean | null
  archived?: boolean | null
  project: number | string | MscVaultProjectDoc
  createdAt: string
  updatedAt: string
}

export function msc_resolveProjectId(
  rel: MscVaultTaskDoc['project'],
): string {
  if (rel == null) return ''
  if (typeof rel === 'object' && 'id' in rel) {
    return String(rel.id)
  }
  return String(rel)
}

export function msc_mapTaskDoc(doc: MscVaultTaskDoc): Task {
  return {
    id: String(doc.id),
    title: doc.title,
    status: (doc.status || 'todo') as TaskStatus,
    completed: Boolean(doc.completed),
    archived: Boolean(doc.archived),
    createdAt: new Date(doc.createdAt),
  }
}

export function msc_mapCredentialRow(row: NonNullable<MscVaultProjectDoc['credentials']>[number]): Credential {
  const id = row.credentialId || row.id || msc_generateLocalId()
  return {
    id,
    label: row.label,
    username: row.username,
    password: row.password,
  }
}

function msc_generateLocalId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `cred-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function msc_mapProjectDoc(doc: MscVaultProjectDoc, tasks: Task[]): Project {
  const emailSettings = doc.emailSettings
  const refs = msc_parseReferencesJson(doc.referencesJson ?? undefined)
  const owner = doc.user
  const ownerUserId =
    owner == null
      ? undefined
      : typeof owner === 'object' && 'id' in owner
        ? (owner as { id: string | number }).id
        : owner
  return {
    id: String(doc.id),
    ownerUserId: ownerUserId as string | number | undefined,
    name: doc.name,
    thumbnail: doc.thumbnail || undefined,
    localPath: getSafePath(doc.localPath || ''),
    liveUrl: doc.liveUrl || undefined,
    status: doc.status,
    localNotes: doc.localNotes?.trim() ? doc.localNotes.trim() : undefined,
    liveNotes: doc.liveNotes?.trim() ? doc.liveNotes.trim() : undefined,
    references: refs.length ? refs : undefined,
    credentials: (doc.credentials || []).map(msc_mapCredentialRow),
    emailSettings: emailSettings
      ? {
          email: emailSettings.email || '',
          smtpHost: emailSettings.smtpHost || '',
          smtpPort: emailSettings.smtpPort || '',
          smtpUser: emailSettings.smtpUser || '',
          smtpPass: emailSettings.smtpPass || '',
        }
      : undefined,
    tasks,
    progress: typeof doc.progress === 'number' ? doc.progress : 0,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  }
}

export function msc_mergeProjectsAndTasks(
  projectDocs: MscVaultProjectDoc[],
  taskDocs: MscVaultTaskDoc[],
): Project[] {
  const byProject: Record<string, Task[]> = {}
  for (const t of taskDocs) {
    const pid = msc_resolveProjectId(t.project)
    if (!byProject[pid]) byProject[pid] = []
    byProject[pid].push(msc_mapTaskDoc(t))
  }
  return projectDocs.map((p) => msc_mapProjectDoc(p, byProject[String(p.id)] || []))
}
