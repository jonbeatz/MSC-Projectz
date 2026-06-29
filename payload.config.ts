import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { MSC_Projectz_Media } from './collections/MSC-Projectz-Media.ts'
import { MSC_Projectz_AuditLogs } from './collections/MSC-Projectz-AuditLogs.ts'
import { MSC_Projectz_PayloadUsers } from './collections/MSC-Projectz-PayloadUsers.ts'
import { MSC_Projectz_Clients } from './collections/MSC-Projectz-Clients.ts'
import { MSC_Projectz_VaultProjects } from './collections/MSC-Projectz-VaultProjects.ts'
import { MSC_Projectz_VaultTasks } from './collections/MSC-Projectz-VaultTasks.ts'
import { MSC_Projectz_VaultSnippets } from './collections/MSC-Projectz-VaultSnippets.ts'
import { msc_resolveSqlitePush } from './lib/msc_payload_sqlite_push.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Forward slashes so import-map generation emits valid JS string literals on Windows. */
function msc_toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

export default buildConfig({
  /** Vault stores base64/data-URLs; keep above Payload default (40_000) for paths & misc text. */
  defaultMaxTextLength: 500_000,
  admin: {
    /** Stops false-positive React hydration errors when extensions inject attrs on <html> (e.g. web-rx, webcrx). */
    suppressHydrationWarning: true,
    user: MSC_Projectz_PayloadUsers.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterDashboard: [
        {
          path: msc_toPosixPath(path.resolve(dirname, 'app/payload-admin/MSC-Projectz-PayloadAfterDashboard.js')),
          exportName: 'MSC_Projectz_PayloadAfterDashboard',
        },
      ],
    },
  },
  collections: [
    MSC_Projectz_PayloadUsers,
    MSC_Projectz_Media,
    MSC_Projectz_Clients,
    MSC_Projectz_VaultProjects,
    MSC_Projectz_VaultTasks,
    MSC_Projectz_VaultSnippets,
    MSC_Projectz_AuditLogs,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // payload.config.ts
  // Ensure your db configuration looks like this:
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./payload.sqlite',
    },
    push: msc_resolveSqlitePush(),
  }),
  sharp,
  onInit: async (payload) => {
    const firstU = await payload.find({
      collection: 'users',
      limit: 1,
      sort: 'createdAt',
      overrideAccess: true,
      depth: 0,
    })
    if (!firstU.docs[0]) {
      return
    }
    const nUsers = await payload.find({ collection: 'users', limit: 2, overrideAccess: true, depth: 0 })
    const u = firstU.docs[0] as {
      id: string | number
      role?: 'master-admin' | 'admin' | 'user' | null
    }
    if (nUsers.docs.length === 1 && u.role !== 'master-admin') {
      await payload.update({
        collection: 'users',
        id: u.id,
        data: { role: 'master-admin' },
        overrideAccess: true,
      })
    }
    const orphans = await payload.find({
      collection: 'msc-vault-projects',
      where: { user: { exists: false } },
      limit: 5000,
      overrideAccess: true,
      depth: 0,
    })
    for (const p of orphans.docs) {
      await payload.update({
        collection: 'msc-vault-projects',
        id: p.id,
        data: { user: u.id },
        overrideAccess: true,
      })
    }
  },
  plugins: [],
})
