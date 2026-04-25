import fs from 'fs'
import path from 'path'

/**
 * Resolves whether Payload should run Drizzle dev schema push for SQLite.
 * Pushing against an existing DB can re-emit CREATE INDEX for timestamp columns
 * and fail with SQLITE_ERROR "index ... already exists" (e.g. duplicate dev servers).
 *
 * Override: `PAYLOAD_SQLITE_PUSH=true` | `PAYLOAD_SQLITE_PUSH=false`
 */
export function msc_resolveSqlitePush(): boolean {
  if (process.env.PAYLOAD_SQLITE_PUSH === 'true') return true
  if (process.env.PAYLOAD_SQLITE_PUSH === 'false') return false
  if (process.env.NODE_ENV === 'production') return false
  if (process.env.PAYLOAD_MIGRATING === 'true') return false

  try {
    const abs = msc_resolveSqliteDatabaseFilePath()
    return !fs.existsSync(abs)
  } catch {
    return false
  }
}

/** Resolves the on-disk path for `file:` SQLite URLs used by @libsql/client. */
export function msc_resolveSqliteDatabaseFilePath(): string {
  const raw = process.env.DATABASE_URI || 'file:./payload.sqlite'
  let rest = raw.trim()
  if (rest.startsWith('file:')) {
    rest = rest.slice('file:'.length)
  }
  // file:///C:/path or file://localhost/C:/...
  if (rest.startsWith('///')) {
    rest = rest.slice(2)
  } else if (rest.startsWith('//')) {
    rest = rest.slice(1)
  }
  rest = rest.replace(/^\/+/, '')
  if (/^[A-Za-z]:[\\/]/.test(rest)) {
    return path.normalize(rest)
  }
  return path.resolve(process.cwd(), rest)
}
