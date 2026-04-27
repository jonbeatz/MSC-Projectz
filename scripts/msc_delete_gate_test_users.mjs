/**
 * Deletes local audit users `*gate-user*@msc.local` and dependent rows (SQLite / libsql).
 * Does not load Payload so it works without TS path-alias resolution.
 *
 * Run: `node scripts/msc_delete_gate_test_users.mjs`
 */
import { createClient } from '@libsql/client'
import { config as loadEnv } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
loadEnv({ path: path.join(root, '.env') })

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

function msc_inClausePlaceholders(n) {
  return Array.from({ length: n }, () => '?').join(',')
}

async function msc_main() {
  const dbPath = msc_resolveSqliteFile()
  if (!fs.existsSync(dbPath)) {
    console.error(`[msc] Database file not found: ${dbPath}`)
    process.exit(1)
  }
  const url = `file:${dbPath.replace(/\\/g, '/')}`
  const c = createClient({ url })

  const gate = await c.execute({
    sql: "SELECT id, email FROM users WHERE email LIKE 'gate-user%@msc.local'",
    args: [],
  })
  if (gate.rows.length === 0) {
    console.log('[msc] No *gate-user*@msc.local users. Nothing to delete.')
    await c.close()
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = `${dbPath}.bak.gate-user-delete.${stamp}`
  fs.copyFileSync(dbPath, backup)
  console.log(`[msc] Backup: ${backup}`)

  const ids = gate.rows.map((r) => r.id)
  const idList = msc_inClausePlaceholders(ids.length)
  console.log(
    '[msc] Removing',
    gate.rows.map((r) => `${r.id}:${r.email}`).join(', '),
  )

  const projR = await c.execute({
    sql: `SELECT id FROM msc_vault_projects WHERE user_id IN (${idList})`,
    args: ids,
  })
  const pids = projR.rows.map((r) => r.id)
  const pidList = pids.length ? msc_inClausePlaceholders(pids.length) : ''

  if (pids.length > 0) {
    await c.execute({
      sql: `DELETE FROM msc_vault_tasks WHERE project_id IN (${pidList}) OR assigned_to_id IN (${idList})`,
      args: [...pids, ...ids],
    })
    await c.execute({
      sql: `DELETE FROM msc_vault_projects_rels WHERE parent_id IN (${pidList}) OR users_id IN (${idList})`,
      args: [...pids, ...ids],
    })
    await c.execute({
      sql: `DELETE FROM msc_vault_projects_credentials WHERE _parent_id IN (${pidList})`,
      args: pids,
    })
    await c.execute({ sql: `DELETE FROM msc_vault_projects WHERE id IN (${pidList})`, args: pids })
  } else {
    await c.execute({
      sql: `DELETE FROM msc_vault_tasks WHERE assigned_to_id IN (${idList})`,
      args: ids,
    })
    await c.execute({
      sql: `DELETE FROM msc_vault_projects_rels WHERE users_id IN (${idList})`,
      args: ids,
    })
  }

  await c.execute({ sql: `DELETE FROM media WHERE owner_id IN (${idList})`, args: ids })
  await c.execute({
    sql: `DELETE FROM payload_locked_documents_rels WHERE users_id IN (${idList})`,
    args: ids,
  })
  await c.execute({
    sql: `DELETE FROM payload_preferences_rels WHERE users_id IN (${idList})`,
    args: ids,
  })
  await c.execute({ sql: `DELETE FROM users_sessions WHERE _parent_id IN (${idList})`, args: ids })
  await c.execute({ sql: `DELETE FROM users WHERE id IN (${idList})`, args: ids })

  console.log(`[msc] Deleted ${ids.length} user(s) and related rows.`)
  await c.close()
}

msc_main().catch((err) => {
  console.error(err)
  process.exit(1)
})
