'use server'

import { copyFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'

function msc_resolveSqliteFilePath(): string {
  const raw = process.env.DATABASE_URI || 'file:./payload.sqlite'

  if (!raw.startsWith('file:')) {
    throw new Error('Database backup only supports file-based SQLite DATABASE_URI values.')
  }

  const filePath = raw.slice('file:'.length)
  if (filePath.startsWith('//')) {
    return fileURLToPath(raw)
  }

  return path.resolve(process.cwd(), filePath)
}

export async function msc_backupDatabase(): Promise<{ success: boolean; fileName: string }> {
  const { user } = await msc_getVaultLocalApiContext()

  if ((user as { role?: string } | null)?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const sourcePath = msc_resolveSqliteFilePath()
  const backupDir = path.resolve(process.cwd(), 'backups')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `payload-${timestamp}.sqlite`
  const targetPath = path.join(backupDir, fileName)

  await mkdir(backupDir, { recursive: true })
  await copyFile(sourcePath, targetPath)

  return { success: true, fileName }
}
