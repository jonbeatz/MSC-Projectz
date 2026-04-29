import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import ftp from 'basic-ftp'

const ROOT = process.cwd()
const TEMPLATE = path.join(ROOT, '.cursor', 'docs', 'Deploy-Profile.template.json')
const LOCAL = path.join(ROOT, '.cursor', 'docs', 'Deploy-Profile.local.json')

function readJson(filePath) {
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function deepMerge(base, override) {
  if (!override) return base
  const out = { ...base }
  for (const [k, v] of Object.entries(override)) {
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === 'object' &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(out[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

function assert(value, message) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(message)
  }
}

async function main() {
  const template = readJson(TEMPLATE)
  if (!template) {
    throw new Error('Missing .cursor/docs/Deploy-Profile.template.json')
  }
  const local = readJson(LOCAL)
  const profile = deepMerge(template, local)

  const host = profile.host?.ftpHost
  const port = Number(profile.host?.ftpPort || 21)
  const user = profile.host?.ftpUsername
  const password = process.env.MSC_FTP_PASSWORD || profile.host?.ftpPassword
  const remoteRoot = profile.host?.remoteAppRoot
  const artifactRel = profile.deployment?.artifactFile || 'final_deploy.zip'
  const artifactLocal = path.resolve(ROOT, artifactRel)
  const artifactName = path.basename(artifactLocal)
  const artifactSizeBytes = statSync(artifactLocal).size

  assert(host, 'Missing profile host.ftpHost')
  assert(user, 'Missing profile host.ftpUsername')
  assert(password, 'Missing FTP password. Set MSC_FTP_PASSWORD or host.ftpPassword in Deploy-Profile.local.json')
  assert(remoteRoot, 'Missing profile host.remoteAppRoot')
  if (!existsSync(artifactLocal)) {
    throw new Error(`Artifact not found: ${artifactLocal}. Run npm run pushitlive first.`)
  }

  const dryRun = process.env.MSC_DEPLOY_DRY_RUN === '1'
  console.log('[deploy-upload] Artifact:', artifactLocal)
  console.log('[deploy-upload] Host:', host)
  console.log('[deploy-upload] Port:', port)
  console.log('[deploy-upload] User:', user)
  console.log('[deploy-upload] Remote root:', remoteRoot)

  if (dryRun) {
    console.log('[deploy-upload] Dry run enabled. No upload performed.')
    return
  }

  const client = new ftp.Client(30000)
  client.ftp.verbose = false

  try {
    await client.access({
      host,
      port,
      user,
      password,
      secure: true,
      secureOptions:
        process.env.MSC_FTPS_INSECURE === '1'
          ? { rejectUnauthorized: false }
          : undefined,
    })

    let lastLogAt = 0
    let lastBytes = 0
    let lastTime = Date.now()
    client.trackProgress((info) => {
      if (info.type !== 'upload') return
      const now = Date.now()
      if (now - lastLogAt < 800) return
      const elapsedSec = Math.max((now - lastTime) / 1000, 0.001)
      const deltaBytes = Math.max(info.bytesOverall - lastBytes, 0)
      const mbPerSec = (deltaBytes / 1024 / 1024) / elapsedSec
      const pct = Math.min((info.bytesOverall / artifactSizeBytes) * 100, 100)
      const sentMb = (info.bytesOverall / 1024 / 1024).toFixed(2)
      const totalMb = (artifactSizeBytes / 1024 / 1024).toFixed(2)
      console.log(
        `[deploy-upload] ${pct.toFixed(1)}% (${sentMb} MB / ${totalMb} MB) @ ${mbPerSec.toFixed(2)} MB/s`
      )
      lastLogAt = now
      lastBytes = info.bytesOverall
      lastTime = now
    })

    await client.ensureDir(remoteRoot)
    await client.cd(remoteRoot)
    await client.uploadFrom(artifactLocal, artifactName)
    client.trackProgress()
    console.log(`[deploy-upload] Uploaded ${artifactName} to ${remoteRoot}`)
  } finally {
    client.close()
  }
}

main().catch((err) => {
  console.error('[deploy-upload] ERROR:', err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})
