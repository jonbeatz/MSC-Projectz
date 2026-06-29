import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { OnboardingChecklist } from '@/lib/msc_client_domain'
import { getSafePath } from '@/lib/env-utils'

export type MscSeedDatabaseResult =
  | {
      ok: true
      skipped: boolean
      message: string
      clientsCreated?: number
      projectsCreated?: number
      tasksCreated?: number
      snippetsCreated?: number
    }
  | { ok: false; error: string }

export type MscBackfillDemoResult = { ok: true; message: string; clientsUpdated: number } | { ok: false; error: string }

const MSC_SEED_MARKER_NAME = 'Nebula Digital'

const MSC_SEED_CLIENTS: Array<{
  name: string
  status: 'lead' | 'active' | 'onboarding' | 'completed' | 'archived'
  contactName: string
  contactEmail: string
  /** Demo phone so Details isn’t empty */
  contactPhone: string
  projectName: string
  localPathSuffix: string
}> = [
  {
    name: 'Nebula Digital',
    status: 'active',
    contactName: 'Alex Rivera',
    contactEmail: 'alex@nebula.demo.msc',
    contactPhone: '(555) 010-7701',
    projectName: 'Nebula — Marketing Site',
    localPathSuffix: 'demo/nebula-digital',
  },
  {
    name: 'Echo Audio',
    status: 'onboarding',
    contactName: 'Jordan Lee',
    contactEmail: 'jordan@echo.demo.msc',
    contactPhone: '(555) 010-7702',
    projectName: 'Echo — Podcast Platform',
    localPathSuffix: 'demo/echo-audio',
  },
  {
    name: 'Solstice Agency',
    status: 'lead',
    contactName: 'Sam Ortiz',
    contactEmail: 'sam@solstice.demo.msc',
    contactPhone: '(555) 010-7703',
    projectName: 'Solstice — Client Portal',
    localPathSuffix: 'demo/solstice-agency',
  },
]

/** Varied checklist completion so Command Center onboarding doesn’t look blank. */
function msc_demoOnboardingChecklist(seedIndex: number): OnboardingChecklist {
  const patterns: boolean[][] = [
    [true, true, false, false],
    [true, false, false, false],
    [false, false, false, false],
  ]
  const [contract, hosting, dns, credentials] = patterns[seedIndex] ?? patterns[2]
  return [
    { id: 'contract', label: 'Contract signed', completed: contract },
    { id: 'hosting', label: 'Hosting set up', completed: hosting },
    { id: 'dns', label: 'DNS configured', completed: dns },
    { id: 'credentials', label: 'Credentials received', completed: credentials },
  ]
}

function msc_demoClientVault(seedIndex: number): Record<string, unknown> {
  return {
    onboardingChecklist: msc_demoOnboardingChecklist(seedIndex),
    demoBlurb: 'MSC seed record — edit freely in Payload Admin.',
  }
}

function msc_ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function msc_taskSpecs(now: Date): Array<{
  title: string
  status: 'todo' | 'in-progress' | 'done'
  completed: boolean
  priority: 'low' | 'normal' | 'high'
  dueDate: string | null
}> {
  const past = new Date(now)
  past.setDate(past.getDate() - 14)
  const soon = new Date(now)
  soon.setDate(soon.getDate() + 5)
  const week = new Date(now)
  week.setDate(week.getDate() + 7)
  const later = new Date(now)
  later.setDate(later.getDate() + 21)

  return [
    {
      title: 'Backlog: content audit',
      status: 'todo',
      completed: false,
      priority: 'normal',
      dueDate: msc_ymd(past),
    },
    {
      title: 'QA: regression sweep',
      status: 'todo',
      completed: false,
      priority: 'high',
      dueDate: msc_ymd(soon),
    },
    {
      title: 'Feature: hero animation',
      status: 'in-progress',
      completed: false,
      priority: 'high',
      dueDate: msc_ymd(now),
    },
    {
      title: 'Integration: analytics pixel',
      status: 'in-progress',
      completed: false,
      priority: 'normal',
      dueDate: msc_ymd(week),
    },
    {
      title: 'Ship: launch checklist',
      status: 'done',
      completed: true,
      priority: 'normal',
      dueDate: msc_ymd(past),
    },
  ]
}

type MscSeedSnippetRow = {
  title: string
  content: string
  language: 'typescript' | 'shell'
  category: 'core-engine' | 'api-logic'
}

function msc_snippetBodies(seedName: string): [MscSeedSnippetRow, MscSeedSnippetRow] {
  return [
    {
      title: `${seedName} — env snippet`,
      content: `// ${seedName} demo env\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nFEATURE_TASK_PULSE=1\n`,
      language: 'typescript',
      category: 'core-engine',
    },
    {
      title: `${seedName} — curl smoke`,
      content: `curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/\n`,
      language: 'shell',
      category: 'api-logic',
    },
  ]
}

/**
 * Dev-only demo data for integration testing (CRM + vault tasks + Code Vault snippets).
 * Uses `payload.create` with `overrideAccess: true`. Safe to call only when gated by the caller.
 */
export async function msc_seedDatabase(): Promise<MscSeedDatabaseResult> {
  try {
    const payload = await getPayload({ config })

    const dup = await payload.find({
      collection: 'msc-clients',
      where: { name: { equals: MSC_SEED_MARKER_NAME } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (dup.docs.length > 0) {
      return {
        ok: true,
        skipped: true,
        message:
          'Demo data already present (client "Nebula Digital" exists). Delete seed records in Payload Admin to re-run.',
      }
    }

    const usersRes = await payload.find({
      collection: 'users',
      limit: 1,
      depth: 0,
      sort: 'id',
      overrideAccess: true,
    })
    const owner = usersRes.docs[0] as { id: string | number } | undefined
    if (!owner) {
      return { ok: false, error: 'No users in database. Sign up or create a user first.' }
    }
    const ownerId = owner.id

    const now = new Date()
    const taskRows = msc_taskSpecs(now)

    let clientsCreated = 0
    let projectsCreated = 0
    let tasksCreated = 0
    let snippetsCreated = 0

    for (let i = 0; i < MSC_SEED_CLIENTS.length; i++) {
      const row = MSC_SEED_CLIENTS[i]
      const clientDoc = await payload.create({
        collection: 'msc-clients',
        data: {
          name: row.name,
          status: row.status,
          primaryContact: {
            name: row.contactName,
            email: row.contactEmail,
            phone: row.contactPhone,
          },
          clientVault: msc_demoClientVault(i),
        },
        overrideAccess: true,
      })
      clientsCreated++
      const clientRowId = clientDoc.id as string | number

      const proj = await payload.create({
        collection: 'msc-vault-projects',
        data: {
          name: row.projectName,
          user: ownerId,
          manualRank: 900 + i,
          client: clientRowId,
          localPath: getSafePath(row.localPathSuffix),
          liveUrl: '',
          status: 'local',
          progress: Math.min(100, 20 + i * 15),
          referencesJson: '[]',
          credentials: [],
        },
        overrideAccess: true,
      })
      projectsCreated++
      const projectRowId = proj.id as string | number

      for (const t of taskRows) {
        await payload.create({
          collection: 'msc-vault-tasks',
          data: {
            title: `${row.projectName.split('—')[0]?.trim() ?? row.name}: ${t.title}`,
            description: `Seed task for Pulse (${t.status}).`,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            completed: t.completed,
            archived: false,
            project: projectRowId,
          },
          overrideAccess: true,
        })
        tasksCreated++
      }

      const snippets = msc_snippetBodies(row.name)
      for (const s of snippets) {
        await payload.create({
          collection: 'msc-vault-snippets',
          data: {
            project: projectRowId,
            author: ownerId,
            title: s.title,
            content: s.content,
            language: s.language,
            category: s.category,
            visibility: 'project',
            status: 'published',
          },
          overrideAccess: true,
        })
        snippetsCreated++
      }
    }

    revalidatePath('/clients')
    revalidatePath('/dashboard')
    revalidatePath('/')

    return {
      ok: true,
      skipped: false,
      message: 'Seed completed.',
      clientsCreated,
      projectsCreated,
      tasksCreated,
      snippetsCreated,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Seed failed.'
    return { ok: false, error: msg }
  }
}

/**
 * Dev-only: enrich existing demo clients (same names as seed) with phones + `clientVault`
 * onboarding without deleting rows. Call `GET /api/seed?backfill=1`.
 */
export async function msc_backfillDemoClientPresentation(): Promise<MscBackfillDemoResult> {
  try {
    const payload = await getPayload({ config })
    let clientsUpdated = 0

    for (let i = 0; i < MSC_SEED_CLIENTS.length; i++) {
      const row = MSC_SEED_CLIENTS[i]
      const found = await payload.find({
        collection: 'msc-clients',
        where: { name: { equals: row.name } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const doc = found.docs[0] as
        | {
            id: string | number
            clientVault?: unknown
            primaryContact?: { name?: string; email?: string; phone?: string | null; user?: unknown }
          }
        | undefined
      if (!doc) continue

      const prevVault =
        doc.clientVault && typeof doc.clientVault === 'object' && doc.clientVault !== null
          ? { ...(doc.clientVault as Record<string, unknown>) }
          : {}
      const pc = doc.primaryContact ?? {}

      await payload.update({
        collection: 'msc-clients',
        id: doc.id,
        data: {
          primaryContact: {
            ...pc,
            name: row.contactName,
            email: row.contactEmail,
            phone: row.contactPhone,
          },
          clientVault: {
            ...prevVault,
            ...msc_demoClientVault(i),
          },
        },
        overrideAccess: true,
      })
      clientsUpdated++
    }

    revalidatePath('/clients')
    revalidatePath('/dashboard')
    revalidatePath('/')

    return {
      ok: true,
      message:
        clientsUpdated === 0
          ? 'No matching demo clients found (expected Nebula Digital, Echo Audio, Solstice Agency).'
          : `Updated ${clientsUpdated} client(s) with demo onboarding + contact phone.`,
      clientsUpdated,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Backfill failed.'
    return { ok: false, error: msg }
  }
}
