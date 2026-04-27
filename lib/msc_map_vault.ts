import type {
  Credential,
  EmailSettings,
  MscProjectIncomingMail,
  MscProjectOutgoingSmtp,
  MscSmtpEncryption,
  MscTaskPriority,
  Project,
  Task,
  TaskStatus,
} from '@/lib/types'
import { getSafePath } from '@/lib/env-utils'
import { msc_parseReferencesJson } from '@/lib/msc_project_references'
import { msc_resolveAvatarUrl, type MscAvatarSource } from '@/lib/msc_avatar_url'
import type { MscProjectMember } from '@/types/user-admin'

type MscVaultProjectDoc = {
  id: number | string
  name: string
  user?: string | number | { id: string | number } | null
  members?: Array<string | number | MscProjectMember> | null
  thumbnail?: string | null
  localPath?: string | null
  liveUrl?: string | null
  status: 'local' | 'live'
  localNotes?: string | null
  liveNotes?: string | null
  manualRank?: number | null
  referencesJson?: string | null
  progress?: number | null
  credentials?: Array<{
    credentialId?: string | null
    id?: string | null
    label: string
    username: string
    password: string
  }> | null
  emailSettings?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

type MscVaultTaskDoc = {
  id: number | string
  title: string
  description?: string | null
  status: TaskStatus
  priority?: MscTaskPriority | null
  /** Payload `date` (ISO or YYYY-MM-DD string) */
  dueDate?: string | null
  completed?: boolean | null
  archived?: boolean | null
  project: number | string | MscVaultProjectDoc
  assignedTo?: string | number | MscProjectMember | null
  createdAt: string
  updatedAt: string
}

function msc_parseTaskDueDate(raw: string | null | undefined): Date | null {
  if (raw == null || String(raw).trim() === '') return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

const MSC_TASK_PRIORITIES: MscTaskPriority[] = ['low', 'normal', 'high']

function msc_mapTaskPriority(raw: unknown): MscTaskPriority {
  if (typeof raw === 'string' && (MSC_TASK_PRIORITIES as string[]).includes(raw)) {
    return raw as MscTaskPriority
  }
  return 'normal'
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
  const assignedTo = doc.assignedTo == null ? null : msc_mapProjectMember(doc.assignedTo)
  const desc = typeof doc.description === 'string' ? doc.description.trim() : ''
  return {
    id: String(doc.id),
    title: doc.title,
    description: desc === '' ? undefined : desc,
    status: (doc.status || 'todo') as TaskStatus,
    completed: Boolean(doc.completed),
    archived: Boolean(doc.archived),
    dueDate: msc_parseTaskDueDate(doc.dueDate),
    priority: msc_mapTaskPriority(doc.priority),
    assignedTo,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt || doc.createdAt),
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

function msc_mapProjectMember(member: string | number | MscProjectMember): MscProjectMember {
  if (typeof member === 'object' && member !== null && 'id' in member) {
    /** Runtime Payload shapes may include populated media on `avatar`; narrowed via `MscAvatarSource`. */
    const avatarUrl = msc_resolveAvatarUrl(member as MscAvatarSource)
    return {
      id: member.id,
      email: member.email ?? null,
      username: member.username ?? null,
      avatar: null,
      avatarUrl,
    }
  }

  return { id: member }
}

function msc_generateLocalId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `cred-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function msc_coerceMscSmtpEncryption(value: string | null | undefined): MscSmtpEncryption {
  const v = (value || 'ssl').toLowerCase()
  if (v === 'tls' || v === 'none' || v === 'ssl') return v
  return 'ssl'
}

function msc_mapIncomingDoc(sub: Record<string, unknown> | null | undefined): MscProjectIncomingMail {
  if (!sub) return { host: '', port: 993, username: '', password: '' }
  const p = sub
  const port = typeof p.port === 'number' ? p.port : parseInt(String(p.port != null && p.port !== '' ? p.port : '993'), 10) || 993
  return {
    host: String((p.host as string) || '').trim(),
    port,
    username: String((p.username as string) || '').trim(),
    password: String((p.password as string) || '').trim(),
  }
}

function msc_mapOutgoingDoc(sub: Record<string, unknown> | null | undefined): MscProjectOutgoingSmtp {
  if (!sub) {
    return { host: '', port: 465, username: '', password: '', encryption: 'ssl' }
  }
  const p = sub
  const port = typeof p.port === 'number' ? p.port : parseInt(String(p.port != null && p.port !== '' ? p.port : '465'), 10) || 465
  return {
    host: String((p.host as string) || '').trim(),
    port,
    username: String((p.username as string) || '').trim(),
    password: String((p.password as string) || '').trim(),
    encryption: msc_coerceMscSmtpEncryption((p.encryption as string) || undefined),
  }
}

/**
 * `emailSettings.incoming` / `outgoing` or legacy top-level `host` (SMTP) from older app builds.
 */
export function msc_normalizeProjectEmailSettings(raw: Record<string, unknown> | null | undefined): EmailSettings {
  if (!raw || typeof raw !== 'object') {
    return {
      incoming: { host: '', port: 993, username: '', password: '' },
      outgoing: { host: '', port: 465, username: '', password: '', encryption: 'ssl' },
    }
  }
  const r = raw as Record<string, unknown>
  if (r.incoming || r.outgoing) {
    return {
      incoming: msc_mapIncomingDoc((r.incoming as Record<string, unknown>) || undefined),
      outgoing: msc_mapOutgoingDoc((r.outgoing as Record<string, unknown>) || undefined),
    }
  }
  const legacyHost = (r.smtpHost as string) || (r.smtp_host as string) || ''
  const host = String((r.host as string) || legacyHost || '').trim()
  const rawPort = r.port ?? r.smtpPort
  const portNum =
    typeof rawPort === 'number'
      ? rawPort
      : parseInt(String(rawPort != null && rawPort !== '' ? rawPort : '465').trim(), 10) || 465
  const username = String((r.username as string) || (r.smtpUser as string) || (r.smtp_user as string) || '')
  const password = String((r.password as string) || (r.smtpPass as string) || (r.smtp_pass as string) || '')
  const enc = msc_coerceMscSmtpEncryption((r.encryption as string) || undefined)
  return {
    incoming: { host: '', port: 993, username: '', password: '' },
    outgoing: {
      host,
      port: portNum,
      username,
      password,
      encryption: enc,
    },
  }
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
    members: (doc.members || []).map(msc_mapProjectMember),
    name: doc.name,
    thumbnail: doc.thumbnail || undefined,
    localPath: getSafePath(doc.localPath || ''),
    liveUrl: doc.liveUrl || undefined,
    status: doc.status,
    localNotes: doc.localNotes?.trim() ? doc.localNotes.trim() : undefined,
    liveNotes: doc.liveNotes?.trim() ? doc.liveNotes.trim() : undefined,
    references: refs.length ? refs : undefined,
    credentials: (doc.credentials || []).map(msc_mapCredentialRow),
    emailSettings: emailSettings ? msc_normalizeProjectEmailSettings(emailSettings) : undefined,
    tasks,
    progress: typeof doc.progress === 'number' ? doc.progress : 0,
    manualRank: typeof doc.manualRank === 'number' && !Number.isNaN(doc.manualRank) ? doc.manualRank : 0,
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
