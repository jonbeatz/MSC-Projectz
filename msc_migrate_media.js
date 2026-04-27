/**
 * MSC Projects site utility:
 * Reorganizes media assets into the project-root ./media directory.
 *
 * Leave DRY_RUN=true until you have reviewed the planned moves.
 */

const fs = require('fs')
const path = require('path')

const DRY_RUN = true

const PROJECT_ROOT = __dirname
const MEDIA_DIR = path.join(PROJECT_ROOT, 'media')

const TARGET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.zip', '.pdf', '.svg', '.webp'])
const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  '.next',
  '.git',
  '.vscode',
  'dist',
  'build',
  '.deploy-package',
  '_design_references',
  'src-tauri',
])

const stats = {
  found: 0,
  moved: 0,
  skipped: 0,
  failed: 0,
}

function msc_normalizePath(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join('/')
}

function msc_isInsideDirectory(targetPath, directoryPath) {
  const relative = path.relative(directoryPath, targetPath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function msc_shouldSkipDirectory(absDir) {
  if (msc_isInsideDirectory(absDir, MEDIA_DIR)) {
    return true
  }

  return EXCLUDED_DIR_NAMES.has(path.basename(absDir))
}

function msc_safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function msc_destinationForFile(sourcePath) {
  const parsed = path.parse(sourcePath)
  let destination = path.join(MEDIA_DIR, parsed.base)

  if (!fs.existsSync(destination)) {
    return destination
  }

  destination = path.join(MEDIA_DIR, `${parsed.name}-${msc_safeTimestamp()}${parsed.ext}`)
  let counter = 2
  while (fs.existsSync(destination)) {
    destination = path.join(MEDIA_DIR, `${parsed.name}-${msc_safeTimestamp()}-${counter}${parsed.ext}`)
    counter += 1
  }

  return destination
}

function msc_scanDirectory(absDir, mediaFiles) {
  let entries
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true })
  } catch (error) {
    stats.failed += 1
    console.log(`[warn] Unable to read ${msc_normalizePath(absDir)}: ${error.message}`)
    return
  }

  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name)

    if (entry.isDirectory()) {
      if (msc_shouldSkipDirectory(absPath)) {
        stats.skipped += 1
        continue
      }
      msc_scanDirectory(absPath, mediaFiles)
      continue
    }

    if (!entry.isFile()) {
      stats.skipped += 1
      continue
    }

    const ext = path.extname(entry.name).toLowerCase()
    if (!TARGET_EXTENSIONS.has(ext)) {
      continue
    }

    mediaFiles.push(absPath)
  }
}

function msc_moveFile(sourcePath) {
  const destination = msc_destinationForFile(sourcePath)
  const sourceLabel = msc_normalizePath(sourcePath)
  const destinationLabel = msc_normalizePath(destination)

  if (DRY_RUN) {
    console.log(`[dry-run] move ${sourceLabel} -> ${destinationLabel}`)
    return true
  }

  try {
    fs.renameSync(sourcePath, destination)
    console.log(`[moved] ${sourceLabel} -> ${destinationLabel}`)
    return true
  } catch (error) {
    stats.failed += 1
    console.log(`[error] Failed to move ${sourceLabel}: ${error.message}`)
    return false
  }
}

function msc_ensureMediaDirectory() {
  if (fs.existsSync(MEDIA_DIR)) {
    return
  }

  if (DRY_RUN) {
    console.log(`[dry-run] create media directory at ${msc_normalizePath(MEDIA_DIR)}`)
    return
  }

  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  console.log(`[created] ${msc_normalizePath(MEDIA_DIR)}`)
}

function msc_main() {
  console.log('MSC media migration utility')
  console.log(`Mode: ${DRY_RUN ? 'DRY_RUN - no files will be moved' : 'LIVE - files will be moved'}`)
  console.log(`Project root: ${PROJECT_ROOT}`)
  console.log(`Media directory: ${MEDIA_DIR}`)

  const mediaFiles = []
  msc_scanDirectory(PROJECT_ROOT, mediaFiles)
  stats.found = mediaFiles.length

  console.log(`Found ${stats.found} media file(s) outside ./media.`)

  if (mediaFiles.length === 0) {
    console.log('Nothing to migrate.')
    console.log(`Summary: found=${stats.found}, moved=${stats.moved}, skipped=${stats.skipped}, failed=${stats.failed}`)
    return
  }

  try {
    msc_ensureMediaDirectory()
  } catch (error) {
    console.log(`[error] Unable to create media directory: ${error.message}`)
    process.exitCode = 1
    return
  }

  for (const filePath of mediaFiles) {
    if (msc_moveFile(filePath)) {
      stats.moved += 1
    }
  }

  console.log(`Summary: found=${stats.found}, moved=${stats.moved}, skipped=${stats.skipped}, failed=${stats.failed}`)
  if (DRY_RUN) {
    console.log('Review the dry-run output, then set DRY_RUN=false to apply the migration.')
  }
}

msc_main()
