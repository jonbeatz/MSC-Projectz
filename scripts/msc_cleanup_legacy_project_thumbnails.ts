import { mkdir, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { createClient } from '@libsql/client'

type Row = {
  id: number
  name: string | null
  thumbnail: string | null
  thumbnail_media_id: number | null
}

async function main() {
  const db = createClient({ url: process.env.DATABASE_URI || 'file:./payload.sqlite' })
  const rowsRes = await db.execute(
    'SELECT id, name, thumbnail, thumbnail_media_id FROM msc_vault_projects ORDER BY id ASC',
  )
  const rows = rowsRes.rows as unknown as Row[]

  let scanned = 0
  let eligible = 0
  let cleaned = 0
  let skipped = 0

  const details: Array<{
    projectId: string
    projectName: string
    action: 'cleaned' | 'skipped'
    reason: string
  }> = []

  for (const row of rows) {
    scanned += 1
    const hasLegacy = String(row.thumbnail || '').trim().length > 0
    const hasMedia = row.thumbnail_media_id != null
    const projectId = String(row.id)
    const projectName = String(row.name || '').trim() || `Project ${projectId}`

    if (hasLegacy && hasMedia) {
      eligible += 1
      await db.execute({
        sql: 'UPDATE msc_vault_projects SET thumbnail = NULL WHERE id = ?',
        args: [row.id],
      })
      cleaned += 1
      details.push({
        projectId,
        projectName,
        action: 'cleaned',
        reason: 'Removed legacy thumbnail text; thumbnailMedia is linked.',
      })
      continue
    }

    skipped += 1
    details.push({
      projectId,
      projectName,
      action: 'skipped',
      reason: hasMedia ? 'No legacy thumbnail text to clean.' : 'No thumbnailMedia link present.',
    })
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scanned,
    eligible,
    cleaned,
    skipped,
    details,
  }

  const outDir = resolve(process.cwd(), '.cursor', 'docs')
  await mkdir(outDir, { recursive: true })
  const outPath = resolve(outDir, 'MSC-Projectz-ThumbnailMedia-Cleanup-Report.json')
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8')

  console.log('[cleanup] done', {
    scanned,
    eligible,
    cleaned,
    skipped,
    reportPath: outPath,
  })
}

main().catch((error) => {
  console.error('[cleanup] failed')
  console.error(error)
  process.exit(1)
})
