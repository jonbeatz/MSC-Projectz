/**
 * One-time / local seed for admin user + Vader test project.
 * `package.json` runs this with `jiti` (not `tsx`) so `@next/env` interop used by
 * `payload/node` (pulled in via the SQLite adapter) does not throw under CJS/ESM.
 */
import { config as msc_loadEnv } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import type { Payload } from 'payload'
import config from '../payload.config'

const __dirname = dirname(fileURLToPath(import.meta.url))
msc_loadEnv({ path: resolve(__dirname, '../.env') })

/** Idempotent seed identity — email lookup prevents duplicate users on re-runs. */
const msc_SEED_EMAIL = 'jonf822@seed.msc'
const msc_SEED_PASSWORD = 'dracula22'
const msc_SEED_PROJECT_NAME = 'Vader - Test Integration'
const msc_SEED_PROJECT_NOTES = 'Verification project for Vader Vault multi-tenancy. Seeded by scripts/msc_seed_data.ts.'

function msc_coerceUserId(payload: Payload, id: string | number): string | number {
  const t = payload.collections['users']?.customIDType || payload.db?.defaultIDType || 'text'
  if (t === 'number' && /^\d+$/.test(String(id).trim())) {
    return Number(String(id).trim())
  }
  return id
}

async function msc_findUserByEmail(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: msc_SEED_EMAIL } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] as
    | {
        id: string | number
        email?: string
        role?: 'master-admin' | 'admin' | 'user'
      }
    | undefined
}

async function msc_ensureAdminUser(payload: Payload): Promise<string | number> {
  const existing = await msc_findUserByEmail(payload)
  if (existing) {
    if (existing.role !== 'master-admin') {
      await payload.update({
        collection: 'users',
        id: existing.id,
        data: { role: 'master-admin' },
        overrideAccess: true,
      })
      console.log('[db:seed] User exists; updated role to master-admin:', msc_SEED_EMAIL)
    } else {
      console.log('[db:seed] User already present (idempotent):', msc_SEED_EMAIL)
    }
    return msc_coerceUserId(payload, existing.id)
  }
  const created = await payload.create({
    collection: 'users',
    data: {
      email: msc_SEED_EMAIL,
      password: msc_SEED_PASSWORD,
      role: 'master-admin',
    },
    overrideAccess: true,
  })
  const id = msc_coerceUserId(payload, (created as { id: string | number }).id)
  console.log('[db:seed] Created admin user:', msc_SEED_EMAIL, 'id:', String(id))
  return id
}

async function msc_ensureTestProject(payload: Payload, ownerId: string | number) {
  const { docs } = await payload.find({
    collection: 'msc-vault-projects',
    where: {
      and: [{ name: { equals: msc_SEED_PROJECT_NAME } }, { user: { equals: ownerId } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (docs.length) {
    console.log('[db:seed] Test project already present (idempotent):', msc_SEED_PROJECT_NAME)
    return
  }
  await payload.create({
    collection: 'msc-vault-projects',
    data: {
      name: msc_SEED_PROJECT_NAME,
      user: ownerId,
      localNotes: msc_SEED_PROJECT_NOTES,
    },
    overrideAccess: true,
  })
  console.log('[db:seed] Created test project for user', String(ownerId), ':', msc_SEED_PROJECT_NAME)
}

async function msc_main() {
  if (!process.env.PAYLOAD_SECRET) {
    console.error('[db:seed] PAYLOAD_SECRET is required (add to .env in project root).')
    process.exit(1)
  }
  process.env.PAYLOAD_MIGRATING = 'true'
  process.env.PAYLOAD_SQLITE_PUSH = 'false'
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const payload = await getPayload({
    config,
    key: 'msc-seed',
    disableOnInit: true,
  })
  try {
    const userId = await msc_ensureAdminUser(payload)
    await msc_ensureTestProject(payload, userId)
    console.log('[db:seed] Complete.')
  } finally {
    await payload.destroy()
  }
}

msc_main().catch((err) => {
  console.error(err)
  process.exit(1)
})
