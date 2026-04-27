import { config as msc_loadEnv } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '../payload.config'

const __dirname = dirname(fileURLToPath(import.meta.url))
msc_loadEnv({ path: resolve(__dirname, '../.env') })

const msc_RESCUE_EMAIL = 'jonbeatz@gmail.com'
const msc_RESCUE_PASSWORD = 'Dracula22!'

async function msc_main() {
  process.env.PAYLOAD_MIGRATING = 'true'
  process.env.PAYLOAD_SQLITE_PUSH = 'false'
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const payload = await getPayload({
    config,
    key: 'msc-rescue-admin',
    disableOnInit: true,
  })

  try {
    const exact = await payload.find({
      collection: 'users',
      where: { email: { equals: msc_RESCUE_EMAIL } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const result = exact.docs[0]
      ? exact
      : await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const msc_admin = result.docs[0]
    if (!msc_admin) {
      throw new Error('No Admin user found in database. Check users collection.')
    }

    const msc_originalEmail =
      typeof (msc_admin as { email?: unknown }).email === 'string'
        ? (msc_admin as unknown as { email: string }).email
        : '(unknown email)'

    const updateData =
      msc_originalEmail === msc_RESCUE_EMAIL
        ? {
            password: msc_RESCUE_PASSWORD,
            loginAttempts: 0,
            lockUntil: null,
          }
        : {
            email: msc_RESCUE_EMAIL,
            password: msc_RESCUE_PASSWORD,
            loginAttempts: 0,
            lockUntil: null,
          }

    await payload.update({
      collection: 'users',
      id: msc_admin.id,
      data: updateData,
      overrideAccess: true,
    })

    console.log(`Admin found: ${msc_originalEmail} -> Updated to ${msc_RESCUE_EMAIL}`)
  } finally {
    await payload.destroy()
  }
}

msc_main().catch((err) => {
  console.error('[db:rescue-admin] Failed:', err)
  process.exit(1)
})

