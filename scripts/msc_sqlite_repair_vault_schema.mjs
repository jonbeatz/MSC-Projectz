/**
 * Non-interactive repair when Drizzle `push` would block on TTY (Windows / CI):
 * - `users.role` (select: user | admin) required by collections/MSC-Projectz-PayloadUsers.ts
 * - `msc_vault_projects.user_id` for the required relationship `user` (VaultProjects)
 * - `msc_vault_projects_rels` for optional project `members` collaborators
 * - `msc_vault_tasks.assigned_to_id` for optional task assignment
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

async function msc_createIndexIfMissing(client, indexName, sql) {
  const r = await client.execute({
    sql: 'SELECT name FROM sqlite_master WHERE type = ? AND name = ?',
    args: ['index', indexName],
  })
  if (r.rows.length > 0) {
    console.log(`[msc_sqlite_repair] ${indexName} already present, skip.`)
    return
  }
  await client.execute(sql)
  console.log(`[msc_sqlite_repair] Added ${indexName}.`)
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

    await client.execute(`
      CREATE TABLE IF NOT EXISTS msc_vault_projects_rels (
        id integer PRIMARY KEY NOT NULL,
        "order" integer,
        parent_id integer NOT NULL,
        path text NOT NULL,
        users_id integer,
        FOREIGN KEY (parent_id) REFERENCES msc_vault_projects(id) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (users_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      )
    `)
    console.log('[msc_sqlite_repair] Ensured msc_vault_projects_rels for project members.')
    await msc_createIndexIfMissing(
      client,
      'msc_vault_projects_rels_order_idx',
      'CREATE INDEX msc_vault_projects_rels_order_idx ON msc_vault_projects_rels ("order")',
    )
    await msc_createIndexIfMissing(
      client,
      'msc_vault_projects_rels_parent_idx',
      'CREATE INDEX msc_vault_projects_rels_parent_idx ON msc_vault_projects_rels (parent_id)',
    )
    await msc_createIndexIfMissing(
      client,
      'msc_vault_projects_rels_path_idx',
      'CREATE INDEX msc_vault_projects_rels_path_idx ON msc_vault_projects_rels (path)',
    )
    await msc_createIndexIfMissing(
      client,
      'msc_vault_projects_rels_users_id_idx',
      'CREATE INDEX msc_vault_projects_rels_users_id_idx ON msc_vault_projects_rels (users_id)',
    )

    const taskCols = await msc_tableColumnNames(client, 'msc_vault_tasks')
    if (!taskCols.includes('assigned_to_id')) {
      await client.execute('ALTER TABLE msc_vault_tasks ADD COLUMN assigned_to_id INTEGER')
      console.log('[msc_sqlite_repair] Added msc_vault_tasks.assigned_to_id.')
    } else {
      console.log('[msc_sqlite_repair] msc_vault_tasks.assigned_to_id already present, skip.')
    }
    await msc_createIndexIfMissing(
      client,
      'msc_vault_tasks_assigned_to_idx',
      'CREATE INDEX msc_vault_tasks_assigned_to_idx ON msc_vault_tasks (assigned_to_id)',
    )
  } finally {
    await client.close()
  }
  console.log('[msc_sqlite_repair] Done.')
}

msc_main().catch((err) => {
  console.error(err)
  process.exit(1)
})
