/**
 * Non-interactive repair when Drizzle `push` would block on TTY (Windows / CI):
 * - `users.role` (select: user | admin) required by collections/MSC-Projectz-PayloadUsers.ts
 * - `msc_vault_projects.user_id` for the required relationship `user` (VaultProjects)
 *
 * Backs up the DB file before changes. No row deletions.
 */
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function msc_resolveSqliteFile() {
  const raw = process.env.DATABASE_URI || 'file:./payload.sqlite'
  let rest = raw.trim()
  if (rest.startsWith('file:')) rest = rest.slice('file:'.length)
  if (rest.startsWith('///')) rest = rest.slice(2)
  else if (rest.startsWith('//')) rest = rest.slice(1)
  rest = rest.replace(/^\/+/, '')
  if (/^[A-Za-z]:[\\/]/.test(rest)) return path.normalize(rest)
  return path.resolve(root, rest)
}

async function msc_tableColumnNames(client, table) {
  const r = await client.execute({ sql: `PRAGMA table_info(${JSON.stringify(table)})`, args: [] })
  return r.rows.map((row) => row.name)
}

async function msc_main() {
  const dbPath = msc_resolveSqliteFile()
  if (!fs.existsSync(dbPath)) {
    console.error(`[msc_sqlite_repair] Database file not found: ${dbPath}`)
    process.exit(1)
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = `${dbPath}.bak.${stamp}`
  fs.copyFileSync(dbPath, backup)
  console.log(`[msc_sqlite_repair] Backup: ${backup}`)

  const url = `file:${dbPath.replace(/\\/g, '/')}`
  const client = createClient({ url })

  try {
    const usersCols = await msc_tableColumnNames(client, 'users')
    if (!usersCols.includes('role')) {
      await client.execute(
        "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
      )
      console.log('[msc_sqlite_repair] Added users.role (default user).')
    } else {
      console.log('[msc_sqlite_repair] users.role already present, skip.')
    }

    const projectCols = await msc_tableColumnNames(client, 'msc_vault_projects')
    if (!projectCols.includes('user_id')) {
      await client.execute('ALTER TABLE msc_vault_projects ADD COLUMN user_id INTEGER')
      console.log('[msc_sqlite_repair] Added msc_vault_projects.user_id (nullable for backfill).')
      const uidR = await client.execute({
        sql: 'SELECT id FROM users ORDER BY id ASC LIMIT 1',
        args: [],
      })
      const firstId = uidR.rows[0]?.id
      if (firstId != null) {
        await client.execute({
          sql: 'UPDATE msc_vault_projects SET user_id = ? WHERE user_id IS NULL',
          args: [firstId],
        })
        console.log(
          `[msc_sqlite_repair] Backfilled user_id to first user id=${String(firstId)} for orphan rows.`,
        )
      } else {
        console.log(
          '[msc_sqlite_repair] No users yet; user_id left null — payload onInit will assign after first user.',
        )
      }
    } else {
      console.log('[msc_sqlite_repair] msc_vault_projects.user_id already present, skip.')
    }
  } finally {
    await client.close()
  }
  console.log('[msc_sqlite_repair] Done.')
}

msc_main().catch((err) => {
  console.error(err)
  process.exit(1)
})
