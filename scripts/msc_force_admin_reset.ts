import { config as msc_loadEnv } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '../payload.config'

const __dirname = dirname(fileURLToPath(import.meta.url))
msc_loadEnv({ path: resolve(__dirname, '../.env') })

const msc_TARGET_EMAIL = 'jonbeatz@gmail.com'
const msc_TARGET_PASSWORD = 'Dracula22!'

async function msc_main() {
  process.env.PAYLOAD_MIGRATING = 'true'
  process.env.PAYLOAD_SQLITE_PUSH = 'false'
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const payload = await getPayload({
    config,
    key: 'msc-fix-admin',
    disableOnInit: true,
  })

  try {
    const msc_existing = await payload.find({
      collection: 'users',
      where: { email: { equals: msc_TARGET_EMAIL } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const msc_user = msc_existing.docs[0]
    if (!msc_user) {
      throw new Error(`User not found: ${msc_TARGET_EMAIL}`)
    }

    await payload.update({
      collection: 'users',
      id: msc_user.id,
      data: {
        role: 'admin',
        password: msc_TARGET_PASSWORD,
        loginAttempts: 0,
        lockUntil: null,
      },
      overrideAccess: true,
    })

    console.log('[db:fix-admin] Admin restored for:', msc_TARGET_EMAIL)
  } finally {
    await payload.destroy()
  }
}

msc_main().catch((err) => {
  console.error('[db:fix-admin] Failed:', err)
  process.exit(1)
})

