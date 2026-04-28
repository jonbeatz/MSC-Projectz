import { readdir, stat } from 'fs/promises'
import path from 'path'
import { createClient } from '@libsql/client'

type FileRow = { absPath: string; relPath: string; size: number }

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])
const EXCLUDED_DIRS = new Set(['Playwright-Tests'])

function msc_mimeFromExt(ext: string): string {
  const e = ext.toLowerCase()
  if (e === '.png') return 'image/png'
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg'
  if (e === '.webp') return 'image/webp'
  if (e === '.gif') return 'image/gif'
  if (e === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

async function msc_collectImageFiles(root: string, rel = ''): Promise<FileRow[]> {
  const dir = path.resolve(root, rel)
  const entries = await readdir(dir, { withFileTypes: true })
  const out: FileRow[] = []
  for (const entry of entries) {
    const nextRel = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      const nested = await msc_collectImageFiles(root, nextRel)
      out.push(...nested)
      continue
    }
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (!IMAGE_EXTENSIONS.has(ext)) continue
    const absPath = path.resolve(root, nextRel)
    const s = await stat(absPath)
    out.push({ absPath, relPath: nextRel.replaceAll('\\', '/'), size: s.size })
  }
  return out
}

async function main() {
  const db = createClient({ url: process.env.DATABASE_URI || 'file:./payload.sqlite' })
  const mediaRoot = path.resolve(process.cwd(), 'media')
  const files = await msc_collectImageFiles(mediaRoot)

  const ownerRes = await db.execute(`
    SELECT id
    FROM users
    ORDER BY
      CASE WHEN role = 'master-admin' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END,
      id ASC
    LIMIT 1
  `)
  const owner = ownerRes.rows[0] as { id?: number } | undefined
  if (!owner?.id) {
    throw new Error('No user found to assign as media owner.')
  }
  const ownerId = owner.id

  let scanned = 0
  let inserted = 0
  let alreadyPresent = 0

  for (const file of files) {
    scanned += 1
    const url = `/media/${file.relPath}`
    const baseFilename = path.basename(file.relPath)
    let filename = baseFilename
    const mime = msc_mimeFromExt(path.extname(filename))

    const existing = await db.execute({
      sql: 'SELECT id FROM media WHERE url = ? LIMIT 1',
      args: [url],
    })
    if (existing.rows.length > 0) {
      alreadyPresent += 1
      continue
    }

    const filenameExists = await db.execute({
      sql: 'SELECT id FROM media WHERE filename = ? LIMIT 1',
      args: [filename],
    })
    if (filenameExists.rows.length > 0) {
      const stamp = Date.now()
      filename = `${stamp}-${file.relPath.replaceAll('/', '__')}`
    }

    await db.execute({
      sql: `
        INSERT INTO media (owner_id, url, filename, mime_type, filesize)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [ownerId, url, filename, mime, file.size],
    })
    inserted += 1
  }

  console.log('[media-sync] done', { scanned, inserted, alreadyPresent, ownerId })
}

main().catch((error) => {
  console.error('[media-sync] failed')
  console.error(error)
  process.exit(1)
})
