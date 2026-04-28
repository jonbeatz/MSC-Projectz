import { createClient } from '@libsql/client'
import { mkdir, writeFile } from 'fs/promises'
import { resolve } from 'path'

type MscScope = 'owner' | 'global'
type MscMode = 'dry-run' | 'apply'

function msc_parseScope(): MscScope {
  const raw = String(process.env.MSC_MEDIA_SCOPE || 'owner').trim().toLowerCase()
  return raw === 'global' ? 'global' : 'owner'
}

function msc_parseMode(): MscMode {
  const raw = String(process.env.MSC_MEDIA_CLEANUP_MODE || 'dry-run').trim().toLowerCase()
  return raw === 'apply' ? 'apply' : 'dry-run'
}

function msc_parseOwnerId(): number | null {
  const raw = String(process.env.MSC_OWNER_ID || '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) ? n : null
}

async function main() {
  const scope = msc_parseScope()
  const mode = msc_parseMode()
  const ownerId = msc_parseOwnerId()
  if (scope === 'owner' && ownerId == null) {
    throw new Error('MSC_OWNER_ID is required when MSC_MEDIA_SCOPE=owner. No action taken.')
  }

  const db = createClient({ url: process.env.DATABASE_URI || 'file:./payload.sqlite' })

  const mediaRes = await db.execute(
    scope === 'owner'
      ? {
          sql: 'SELECT id, url, filename, owner_id FROM media WHERE owner_id = ? ORDER BY id ASC',
          args: [ownerId as number],
        }
      : 'SELECT id, url, filename, owner_id FROM media ORDER BY id ASC',
  )
  const projectRes = await db.execute(
    scope === 'owner'
      ? {
          sql: `
            SELECT DISTINCT thumbnail_media_id AS media_id
            FROM msc_vault_projects
            WHERE thumbnail_media_id IS NOT NULL
              AND user_id = ?
          `,
          args: [ownerId as number],
        }
      : 'SELECT DISTINCT thumbnail_media_id AS media_id FROM msc_vault_projects WHERE thumbnail_media_id IS NOT NULL',
  )
  const userCols = await db.execute('PRAGMA table_info(users)')
  const hasAvatarId = userCols.rows.some((r) => String((r as { name?: string }).name) === 'avatar_id')
  const avatarRes = hasAvatarId
    ? await db.execute(
        scope === 'owner'
          ? {
              sql: 'SELECT DISTINCT avatar_id AS media_id FROM users WHERE avatar_id IS NOT NULL AND id = ?',
              args: [ownerId as number],
            }
          : 'SELECT DISTINCT avatar_id AS media_id FROM users WHERE avatar_id IS NOT NULL',
      )
    : { rows: [] as Array<{ media_id: number }> }

  const usedIds = new Set<number>()
  for (const row of projectRes.rows) {
    const id = Number((row as { media_id?: number }).media_id)
    if (!Number.isNaN(id)) usedIds.add(id)
  }
  for (const row of avatarRes.rows) {
    const id = Number((row as { media_id?: number }).media_id)
    if (!Number.isNaN(id)) usedIds.add(id)
  }

  const protectedFilenames = new Set(['msc-icon.png'])
  const toDelete: Array<{ id: number; filename: string; url: string }> = []
  const mediaRows = mediaRes.rows as unknown as Array<{ id: number; filename?: string; url?: string }>
  for (const row of mediaRows) {
    const id = Number(row.id)
    const filename = String(row.filename || '')
    const url = String(row.url || '')
    if (usedIds.has(id)) continue
    if (protectedFilenames.has(filename)) continue
    toDelete.push({ id, filename, url })
  }

  if (mode === 'apply') {
    for (const row of toDelete) {
      await db.execute({
        sql: 'DELETE FROM media WHERE id = ?',
        args: [row.id],
      })
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scope,
    mode,
    ownerId: ownerId ?? null,
    mediaCount: mediaRes.rows.length,
    usedIds: Array.from(usedIds).sort((a, b) => a - b),
    candidateDeleteCount: toDelete.length,
    deletedCount: mode === 'apply' ? toDelete.length : 0,
    deleted: toDelete,
  }
  const outDir = resolve(process.cwd(), '.cursor', 'docs')
  await mkdir(outDir, { recursive: true })
  const outPath = resolve(outDir, 'MSC-Media-Usage-Cleanup-Report.json')
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
