/**
 * Sets `users.role` to `master-admin` for a given email (local SQLite only).
 * Does not load Payload / jiti (avoids `@/` resolution issues). Does not change password.
 *
 * Usage: `node scripts/msc_promote_user_to_master.mjs`
 * Or:   `set MSC_PROMOTE_EMAIL=user@x.com && node scripts/msc_promote_user_to_master.mjs`
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

async function msc_main() {
  const email = (process.env.MSC_PROMOTE_EMAIL || 'jonbeatz@gmail.com').trim().toLowerCase()
  const dbPath = msc_resolveSqliteFile()
  if (!fs.existsSync(dbPath)) {
    console.error(`[msc] Database not found: ${dbPath}`)
    process.exit(1)
  }
  const url = `file:${dbPath.replace(/\\/g, '/')}`
  const c = createClient({ url })

  const before = await c.execute({
    sql: 'SELECT id, email, role FROM users WHERE email = ?',
    args: [email],
  })
  if (before.rows.length === 0) {
    console.error(`[msc] No user with email: ${email}`)
    process.exit(1)
  }
  const row0 = before.rows[0]
  console.log(`[msc] Before: id=${row0.id} email=${row0.email} role=${row0.role}`)

  await c.execute({
    sql: "UPDATE users SET role = 'master-admin' WHERE email = ?",
    args: [email],
  })

  const after = await c.execute({
    sql: 'SELECT id, email, role FROM users WHERE email = ?',
    args: [email],
  })
  const r = after.rows[0]
  console.log(`[msc] After:  id=${r.id} email=${r.email} role=${r.role}`)
  console.log(`[msc] Log out and log in again (or hard-refresh) so the app picks up master-admin.`)
  await c.close()
}

msc_main().catch((err) => {
  console.error(err)
  process.exit(1)
})
