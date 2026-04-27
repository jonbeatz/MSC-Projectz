import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const stageDir = path.join(repoRoot, '.deploy-package')
const mediaDir = path.join(repoRoot, 'media')
const zipPath = path.join(mediaDir, 'deploy-package.zip')

const entries = [
  { from: '.next', required: true, note: 'Production Next.js build output' },
  { from: 'public', required: false, note: 'Static public assets' },
  { from: 'app', required: true, note: 'Next/Payload app route source needed by Payload runtime imports' },
  { from: 'components', required: true, note: 'Runtime React components referenced by app/admin routes' },
  { from: 'collections', required: true, note: 'Payload collection definitions' },
  { from: 'lib', required: true, note: 'Server actions, mapping, SMTP, auth, and runtime helpers' },
  { from: 'hooks', required: false, note: 'Shared React hooks imported by components' },
  { from: 'types', required: false, note: 'Shared TypeScript type modules' },
  { from: 'content', required: false, note: 'Optional markdown/content vault assets' },
  { from: 'package.json', required: true, note: 'Server install/start scripts and production dependencies' },
  { from: 'package-lock.json', required: true, note: 'Pinned npm dependency graph' },
  { from: 'next.config.mjs', required: true, note: 'Next/Payload wrapper config' },
  { from: 'postcss.config.mjs', required: true, note: 'CSS build/runtime config' },
  { from: 'payload.config.ts', required: true, note: 'Payload runtime config' },
  { from: 'payload-types.ts', required: false, note: 'Generated Payload types when present' },
  { from: 'tsconfig.json', required: true, note: 'Path aliases used by Payload/Next tooling' },
  { from: '.env.example', required: true, note: 'Server environment variable template' },
  { from: 'scripts/msc_sqlite_repair_vault_schema.mjs', required: true, note: 'Live SQLite schema repair utility' },
]

const excludedPathParts = new Set([
  'node_modules',
  '.git',
  '.cursor',
  '.deploy-package',
  '_design_references',
  'agent-transcripts',
  'src-tauri',
])

function relativeToRepo(absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join('/')
}

function shouldCopy(src) {
  const rel = relativeToRepo(src)
  const parts = rel.split('/')
  if (parts.some((part) => excludedPathParts.has(part))) return false
  if (rel === 'deploy-package.zip') return false
  if (rel.startsWith('.next/cache/')) return false
  if (rel === 'payload.sqlite' || rel === 'payload.sqlite-journal' || rel.startsWith('payload.sqlite.bak.')) return false
  return true
}

async function copyEntry(entry) {
  const src = path.join(repoRoot, entry.from)
  const dest = path.join(stageDir, entry.from)

  if (!existsSync(src)) {
    if (entry.required) {
      throw new Error(`Missing required deploy artifact: ${entry.from}`)
    }
    return false
  }

  const info = await stat(src)
  await mkdir(path.dirname(dest), { recursive: true })
  if (info.isDirectory()) {
    await cp(src, dest, {
      recursive: true,
      force: true,
      filter: shouldCopy,
    })
  } else {
    await cp(src, dest, { force: true })
  }
  return true
}

function runZipCommand() {
  if (process.platform === 'win32') {
    const command = [
      '$ErrorActionPreference = "Stop";',
      `Compress-Archive -Path "${stageDir}\\*" -DestinationPath "${zipPath}" -Force`,
    ].join(' ')
    return spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
  }

  return spawnSync('zip', ['-qr', zipPath, '.'], {
    cwd: stageDir,
    stdio: 'inherit',
  })
}

async function main() {
  if (!existsSync(path.join(repoRoot, '.next', 'BUILD_ID'))) {
    throw new Error('Production build not found. Run `npm run build` before packaging.')
  }

  await rm(stageDir, { recursive: true, force: true })
  await rm(path.join(repoRoot, 'deploy-package.zip'), { force: true })
  await rm(zipPath, { force: true })
  await mkdir(stageDir, { recursive: true })
  await mkdir(mediaDir, { recursive: true })

  const included = []
  for (const entry of entries) {
    if (await copyEntry(entry)) {
      included.push(entry)
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    package: 'media/deploy-package.zip',
    install: 'npm install --production',
    start: 'npm run start',
    requiredServerEnv: [
      'PAYLOAD_SECRET',
      'DATABASE_URI',
      'NEXT_PUBLIC_SITE_URL',
      'MSC_STUDIO_OUTGOING_HOST',
      'MSC_STUDIO_OUTGOING_PORT',
      'MSC_STUDIO_OUTGOING_USER',
      'MSC_STUDIO_OUTGOING_PASS',
      'MSC_STUDIO_OUTGOING_SSL',
    ],
    included: included.map((entry) => ({
      path: entry.from,
      note: entry.note,
    })),
    excluded: [
      'node_modules',
      '.git',
      '.cursor',
      '.next/cache',
      '_design_references',
      'src-tauri',
      'payload.sqlite',
      'payload.sqlite-journal',
      'payload.sqlite.bak.*',
      'media/',
      'backups/',
    ],
  }

  await writeFile(path.join(stageDir, 'DEPLOY_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(
    path.join(stageDir, 'DEPLOY_README.txt'),
    [
      'MSC Projectz production package',
      '',
      'Server steps:',
      '1. Extract deploy-package.zip into the Node app directory.',
      '2. Copy .env.example to .env and set live values.',
      '3. Run: npm install --production',
      '4. If SQLite schema needs repair, run: npm run repair:sqlite',
      '5. Start/restart the Node app with: npm run start',
      '',
      'node_modules and local SQLite files are intentionally not included.',
      '',
    ].join('\n'),
  )

  const zipResult = runZipCommand()
  if (zipResult.error) throw zipResult.error
  if (zipResult.status !== 0) {
    throw new Error(`Zip command failed with exit code ${zipResult.status}.`)
  }

  console.log(`Created ${relativeToRepo(zipPath)} with ${included.length} deploy entries.`)
}

main().catch((error) => {
  console.error('[msc_package_for_production] Failed:', error)
  process.exit(1)
})
