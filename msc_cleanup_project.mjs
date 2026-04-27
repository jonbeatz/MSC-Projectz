/**
 * MSC Projects cleanup utility.
 *
 * Deletes generated build/package artifacts only:
 * - .next
 * - .deploy-package
 * - dist
 * - build
 * - payload.sqlite.bak*
 * - media/deploy-package.zip
 *
 * This script intentionally never deletes source directories or node_modules.
 */

import { existsSync } from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const PROJECT_ROOT = path.dirname(__filename)

const SOURCE_SAFE_NAMES = new Set([
  'app',
  'collections',
  'components',
  'lib',
  'media',
  'node_modules',
  'public',
  'scripts',
  'styles',
  'types',
  '.cursorrules',
  '.env',
  'package.json',
  'package-lock.json',
  'payload.config.ts',
  'server.js',
  'tsconfig.json',
])

const DELETE_DIRECTORIES = ['.next', '.deploy-package', 'dist', 'build']
const DELETE_FILES = ['media/deploy-package.zip']

function msc_toRelative(absPath) {
  return path.relative(PROJECT_ROOT, absPath).split(path.sep).join('/') || '.'
}

function msc_assertSafeDelete(absPath) {
  const relative = msc_toRelative(absPath)
  const topLevel = relative.split('/')[0]

  if (relative === 'node_modules' || relative.startsWith('node_modules/')) {
    throw new Error(`Refusing to delete node_modules path: ${relative}`)
  }

  if (SOURCE_SAFE_NAMES.has(relative) || SOURCE_SAFE_NAMES.has(topLevel)) {
    if (relative !== 'media/deploy-package.zip') {
      throw new Error(`Refusing to delete protected source path: ${relative}`)
    }
  }
}

async function msc_deletePath(relativePath) {
  const absPath = path.resolve(PROJECT_ROOT, relativePath)
  msc_assertSafeDelete(absPath)

  if (!existsSync(absPath)) {
    console.log(`[skip] ${relativePath} not found`)
    return
  }

  console.log(`[delete] ${relativePath}`)
  await rm(absPath, { recursive: true, force: true })
}

async function msc_deletePayloadBackups() {
  const entries = await readdir(PROJECT_ROOT, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!entry.name.startsWith('payload.sqlite.bak')) continue
    await msc_deletePath(entry.name)
  }
}

async function msc_main() {
  console.log('MSC cleanup utility starting...')

  for (const dir of DELETE_DIRECTORIES) {
    await msc_deletePath(dir)
  }

  await msc_deletePayloadBackups()

  for (const file of DELETE_FILES) {
    await msc_deletePath(file)
  }

  console.log('MSC cleanup utility complete.')
}

msc_main().catch((error) => {
  console.error('[msc_cleanup_project] Failed:', error)
  process.exit(1)
})
