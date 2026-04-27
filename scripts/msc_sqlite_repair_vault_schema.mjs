/**
 * Non-interactive repair when Drizzle `push` would block on TTY (Windows / CI):
 * - `users.role` (select: user | admin) required by collections/MSC-Projectz-PayloadUsers.ts
 * - `msc_vault_projects.user_id` for the required relationship `user` (VaultProjects)
 * - `msc_vault_projects_rels` for optional project `members` collaborators
 * - `msc_vault_tasks.assigned_to_id` for optional task assignment
 * - `media.sizes_thumbnail_*` for Payload thumbnail image size metadata
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

async function msc_addColumnIfMissing(client, table, existingColumns, column, definition) {
  if (existingColumns.includes(column)) {
    console.log(`[msc_sqlite_repair] ${table}.${column} already present, skip.`)
    return
  }
  await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  existingColumns.push(column)
  console.log(`[msc_sqlite_repair] Added ${table}.${column}.`)
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

    const mediaCols = await msc_tableColumnNames(client, 'media')
    await msc_addColumnIfMissing(client, 'media', mediaCols, 'sizes_thumbnail_url', 'TEXT')
    await msc_addColumnIfMissing(client, 'media', mediaCols, 'sizes_thumbnail_width', 'INTEGER')
    await msc_addColumnIfMissing(client, 'media', mediaCols, 'sizes_thumbnail_height', 'INTEGER')
    await msc_addColumnIfMissing(client, 'media', mediaCols, 'sizes_thumbnail_mime_type', 'TEXT')
    await msc_addColumnIfMissing(client, 'media', mediaCols, 'sizes_thumbnail_filesize', 'INTEGER')
    await msc_addColumnIfMissing(client, 'media', mediaCols, 'sizes_thumbnail_filename', 'TEXT')

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

    async function msc_addProjectCol(name, defSql) {
      const cols = await msc_tableColumnNames(client, 'msc_vault_projects')
      if (cols.includes(name)) {
        console.log(`[msc_sqlite_repair] msc_vault_projects.${name} already present, skip.`)
        return
      }
      await client.execute(`ALTER TABLE msc_vault_projects ADD COLUMN ${name} ${defSql}`)
      console.log(`[msc_sqlite_repair] Added msc_vault_projects.${name}.`)
    }
    await msc_addProjectCol('email_settings_host', 'TEXT')
    await msc_addProjectCol('email_settings_port', 'INTEGER')
    await msc_addProjectCol('email_settings_username', 'TEXT')
    await msc_addProjectCol('email_settings_password', 'TEXT')
    await msc_addProjectCol('email_settings_encryption', 'TEXT')
    const colsAfter = await msc_tableColumnNames(client, 'msc_vault_projects')
    if (colsAfter.includes('email_settings_smtp_host') && colsAfter.includes('email_settings_host')) {
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_host = email_settings_smtp_host WHERE (email_settings_host IS NULL OR email_settings_host = '') AND email_settings_smtp_host IS NOT NULL AND email_settings_smtp_host != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_port = CAST(email_settings_smtp_port AS INTEGER) WHERE email_settings_port IS NULL AND email_settings_smtp_port IS NOT NULL AND TRIM(COALESCE(email_settings_smtp_port, '')) != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_username = email_settings_smtp_user WHERE (email_settings_username IS NULL OR email_settings_username = '') AND email_settings_smtp_user IS NOT NULL AND email_settings_smtp_user != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_password = email_settings_smtp_pass WHERE (email_settings_password IS NULL OR email_settings_password = '') AND email_settings_smtp_pass IS NOT NULL AND email_settings_smtp_pass != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_encryption = 'ssl' WHERE (email_settings_encryption IS NULL OR email_settings_encryption = '') AND (email_settings_smtp_host IS NOT NULL OR email_settings_smtp_port IS NOT NULL)",
      )
    }
    for (const c of [
      ['email_settings_incoming_host', 'TEXT'],
      ['email_settings_incoming_port', 'INTEGER'],
      ['email_settings_incoming_username', 'TEXT'],
      ['email_settings_incoming_password', 'TEXT'],
      ['email_settings_outgoing_host', 'TEXT'],
      ['email_settings_outgoing_port', 'INTEGER'],
      ['email_settings_outgoing_username', 'TEXT'],
      ['email_settings_outgoing_password', 'TEXT'],
      ['email_settings_outgoing_encryption', 'TEXT'],
    ]) {
      await msc_addProjectCol(c[0], c[1])
    }
    const allCols = await msc_tableColumnNames(client, 'msc_vault_projects')
    if (allCols.includes('email_settings_host') && allCols.includes('email_settings_outgoing_host')) {
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_outgoing_host = email_settings_host WHERE (email_settings_outgoing_host IS NULL OR email_settings_outgoing_host = '') AND email_settings_host IS NOT NULL AND email_settings_host != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_outgoing_port = email_settings_port WHERE email_settings_outgoing_port IS NULL AND email_settings_port IS NOT NULL",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_outgoing_username = email_settings_username WHERE (email_settings_outgoing_username IS NULL OR email_settings_outgoing_username = '') AND email_settings_username IS NOT NULL AND email_settings_username != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_outgoing_password = email_settings_password WHERE (email_settings_outgoing_password IS NULL OR email_settings_outgoing_password = '') AND email_settings_password IS NOT NULL AND email_settings_password != ''",
      )
      await client.execute(
        "UPDATE msc_vault_projects SET email_settings_outgoing_encryption = email_settings_encryption WHERE (email_settings_outgoing_encryption IS NULL OR email_settings_outgoing_encryption = '') AND email_settings_encryption IS NOT NULL AND email_settings_encryption != ''",
      )
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
