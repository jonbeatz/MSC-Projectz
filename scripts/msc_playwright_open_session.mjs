#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'

const username = process.env.USERNAME || ''
const bravePath =
  process.env.MSC_BRAVE_PATH ||
  `C:\\Users\\${username}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`
const baseUrl = process.env.MSC_BASE_URL || 'http://localhost:3000'
const startPath = process.env.MSC_START_PATH || '/dashboard'
const startUrl = `${baseUrl.replace(/\/$/, '')}/${startPath.replace(/^\//, '')}`
const rootDir = path.resolve(process.cwd(), 'Playwright-Tests')
const profileDir = process.env.MSC_PROFILE_DIR || path.join(rootDir, 'brave-profile')
const cdpPort = Number(process.env.MSC_CDP_PORT || 9223)
const sessionFile = path.join(rootDir, 'session.json')

async function main() {
  if (!existsSync(bravePath)) {
    throw new Error(`Brave executable not found: ${bravePath}`)
  }

  await mkdir(rootDir, { recursive: true })
  await mkdir(profileDir, { recursive: true })

  if (process.platform === 'win32') {
    try {
      execSync('taskkill /IM brave.exe /F', { stdio: 'ignore' })
    } catch {
      // ignore when not running
    }
  }

  // Free the port if a stale devtools process is holding it.
  try {
    execSync(`netstat -ano | findstr :${cdpPort}`, { stdio: 'ignore' })
    // If command succeeds, some process is using the port; leave it alone.
  } catch {
    // Nothing bound; continue.
  }

  const args = [
    `--user-data-dir=${profileDir}`,
    '--profile-directory=Default',
    `--remote-debugging-port=${cdpPort}`,
    '--start-maximized',
    startUrl,
  ]

  const child = spawn(bravePath, args, {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()

  const session = {
    startedAt: new Date().toISOString(),
    bravePath,
    profileDir,
    cdpPort,
    baseUrl,
    startUrl,
    pid: child.pid,
  }
  await writeFile(sessionFile, JSON.stringify(session, null, 2), 'utf8')

  console.log(JSON.stringify({ ok: true, sessionFile, session }, null, 2))
}

main().catch((error) => {
  console.error('[playwright-open-session] failed')
  console.error(error)
  process.exit(1)
})
