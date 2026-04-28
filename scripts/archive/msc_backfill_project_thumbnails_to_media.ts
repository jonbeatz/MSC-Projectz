import { config as msc_loadEnv } from 'dotenv'
import { basename, dirname, extname, isAbsolute, resolve } from 'path'
import { fileURLToPath } from 'url'
import { copyFile, mkdir, readFile, writeFile } from 'fs/promises'
import { createClient } from '@libsql/client'

type MscProjectRow = { id: number; name: string | null; thumbnail: string | null; thumbnail_media_id: number | null; user_id: number | null }

type MscBackfillRow = {
  projectId: string
  projectName: string
  status: 'linked-existing' | 'created-and-linked' | 'skipped' | 'failed'
  reason: string
  thumbnailPreview: string
  mediaId?: string
  mediaUrl?: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))
msc_loadEnv({ path: resolve(__dirname, '../.env') })

function msc_preview(v: string): string {
  const t = v.trim()
  if (t.startsWith('data:image/')) return `${t.slice(0, 40)}...`
  return t.length > 140 ? `${t.slice(0, 140)}...` : t
}

function msc_extFromMime(mime: string): string {
  const m = mime.toLowerCase()
  if (m.includes('jpeg') || m.includes('jpg')) return '.jpg'
  if (m.includes('png')) return '.png'
  if (m.includes('webp')) return '.webp'
  if (m.includes('gif')) return '.gif'
  if (m.includes('svg')) return '.svg'
  return '.bin'
}

function msc_decodeDataUrl(dataUrl: string): { buffer: Buffer; mime: string; nameExt: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Unsupported data URL format.')
  const mime = match[1] || 'application/octet-stream'
  const b64 = match[2] || ''
  const buffer = Buffer.from(b64, 'base64')
  return { buffer, mime, nameExt: msc_extFromMime(mime) }
}

async function msc_blobFromLegacy(legacy: string): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  const t = legacy.trim()
  if (t.startsWith('data:image/')) {
    const out = msc_decodeDataUrl(t)
    return { buffer: out.buffer, mime: out.mime, ext: out.nameExt }
  }

  if (/^https?:\/\//i.test(t)) {
    const res = await fetch(t)
    if (!res.ok) throw new Error(`Remote fetch failed (${res.status}).`)
    const arr = await res.arrayBuffer()
    const mime = res.headers.get('content-type') || 'application/octet-stream'
    return { buffer: Buffer.from(arr), mime, ext: msc_extFromMime(mime) }
  }

  let localPath = t
  if (t.startsWith('/media/')) {
    localPath = resolve(process.cwd(), t.replace(/^\/+/, ''))
  } else if (t.startsWith('media/')) {
    localPath = resolve(process.cwd(), t)
  } else if (!isAbsolute(t)) {
    throw new Error('Unsupported legacy thumbnail path format.')
  }

  const buffer = await readFile(localPath)
  const ext = extname(localPath) || '.bin'
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
  return { buffer, mime, ext }
}

function msc_uniqueFilename(projectId: number, ext: string): string {
  const safeExt = ext && ext.startsWith('.') ? ext : '.bin'
  return `msc_project_thumb_${projectId}_${Date.now()}${safeExt}`
}

async function main() {
  const db = createClient({ url: process.env.DATABASE_URI || 'file:./payload.sqlite' })
  const projectRows = await db.execute(
    'SELECT id, name, thumbnail, thumbnail_media_id, user_id FROM msc_vault_projects ORDER BY id ASC',
  )
  const projects = projectRows.rows as unknown as MscProjectRow[]
  const mediaDir = resolve(process.cwd(), 'media')
  await mkdir(mediaDir, { recursive: true })

  const reportRows: MscBackfillRow[] = []
  let scanned = 0
  let eligible = 0
  let linkedExisting = 0
  let createdAndLinked = 0
  let skipped = 0
  let failed = 0

  for (const p of projects) {
    scanned += 1
    const pid = String(p.id)
    const pname = String(p.name || '').trim() || `Project ${pid}`
    const legacy = String(p.thumbnail || '').trim()
    const hasMedia = p.thumbnail_media_id != null
    if (!legacy || hasMedia) {
      skipped += 1
      reportRows.push({
        projectId: pid,
        projectName: pname,
        status: 'skipped',
        reason: hasMedia ? 'Already linked to thumbnailMedia.' : 'No legacy thumbnail value.',
        thumbnailPreview: msc_preview(legacy || '(empty)'),
      })
      continue
    }

    eligible += 1
    try {
      const existingRes = await db.execute({
        sql: 'SELECT id, url FROM media WHERE url = ? LIMIT 1',
        args: [legacy],
      })
      const existing = existingRes.rows[0] as { id?: number; url?: string } | undefined
      if (existing?.id != null) {
        await db.execute({
          sql: 'UPDATE msc_vault_projects SET thumbnail_media_id = ? WHERE id = ?',
          args: [existing.id, p.id],
        })
        linkedExisting += 1
        reportRows.push({
          projectId: pid,
          projectName: pname,
          status: 'linked-existing',
          reason: 'Linked existing media row by matching url.',
          thumbnailPreview: msc_preview(legacy),
          mediaId: String(existing.id),
          mediaUrl: existing.url || undefined,
        })
        continue
      }

      if (p.user_id == null) throw new Error('Missing owner user on project.')

      let filename = ''
      let mime = 'application/octet-stream'
      let bytes = 0
      if (legacy.startsWith('/media/') || legacy.startsWith('media/')) {
        const localLegacy = legacy.startsWith('/media/') ? resolve(process.cwd(), legacy.replace(/^\/+/, '')) : resolve(process.cwd(), legacy)
        await readFile(localLegacy)
        filename = basename(localLegacy)
        bytes = (await readFile(localLegacy)).byteLength
        const ext = extname(filename).toLowerCase()
        mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
      } else if (isAbsolute(legacy)) {
        const ext = extname(legacy) || '.bin'
        filename = msc_uniqueFilename(p.id, ext)
        const dest = resolve(mediaDir, filename)
        await copyFile(legacy, dest)
        bytes = (await readFile(dest)).byteLength
        mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
      } else {
        const blob = await msc_blobFromLegacy(legacy)
        filename = msc_uniqueFilename(p.id, blob.ext)
        const dest = resolve(mediaDir, filename)
        await writeFile(dest, blob.buffer)
        bytes = blob.buffer.byteLength
        mime = blob.mime
      }

      const mediaUrl = `/media/${filename}`
      const inserted = await db.execute({
        sql: `
          INSERT INTO media (owner_id, url, filename, mime_type, filesize)
          VALUES (?, ?, ?, ?, ?)
          RETURNING id, url
        `,
        args: [p.user_id, mediaUrl, filename, mime, bytes],
      })
      const media = inserted.rows[0] as { id?: number; url?: string } | undefined
      if (!media?.id) throw new Error('Media insert did not return an id.')

      await db.execute({
        sql: 'UPDATE msc_vault_projects SET thumbnail_media_id = ? WHERE id = ?',
        args: [media.id, p.id],
      })
      createdAndLinked += 1
      reportRows.push({
        projectId: pid,
        projectName: pname,
        status: 'created-and-linked',
        reason: 'Created media from legacy thumbnail and linked thumbnailMedia.',
        thumbnailPreview: msc_preview(legacy),
        mediaId: String(media.id),
        mediaUrl: media.url || undefined,
      })
    } catch (error) {
      failed += 1
      reportRows.push({
        projectId: pid,
        projectName: pname,
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
        thumbnailPreview: msc_preview(legacy),
      })
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scanned,
    eligible,
    linkedExisting,
    createdAndLinked,
    skipped,
    failed,
    rows: reportRows,
  }

  const reportDir = resolve(process.cwd(), '.cursor', 'docs')
  await mkdir(reportDir, { recursive: true })
  const reportPath = resolve(reportDir, 'MSC-Projectz-ThumbnailMedia-Backfill-Report.json')
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')

  console.log('[backfill] done', {
    scanned,
    eligible,
    linkedExisting,
    createdAndLinked,
    skipped,
    failed,
    reportPath,
  })
}

main().catch((error) => {
  console.error('[backfill] failed')
  console.error(error)
  process.exit(1)
})
