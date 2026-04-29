#!/usr/bin/env node
/**
 * Spawns Brave with a dedicated user-data-dir + remote-debugging-port for CDP command mode.
 *
 * MSC_KILL_BRAVE_MODE (Windows):
 * - `none` (default): do not kill Brave. If CDP port is still busy, close the old Playwright
 *   window manually or run once with `port` or `all`.
 * - `port` | `cdp`: kill only PID(s) that are LISTENING on MSC_CDP_PORT (stale CDP — backup
 *   used global taskkill for this; port mode is the safer equivalent).
 * - `all`: kill every brave.exe (same as legacy backup — logs you out of normal Brave).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'

const username = process.env.USERNAME || ''
const braveKillMode = (process.env.MSC_KILL_BRAVE_MODE || 'none').toLowerCase()
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

function killListenersOnPortWindows(port) {
  if (process.platform !== 'win32') return
  let out = ''
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
  } catch {
    return
  }
  const pids = new Set()
  for (const line of out.split(/\r?\n/)) {
    const m = line.trim().match(/LISTENING\s+(\d+)\s*$/)
    if (m) pids.add(m[1])
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      console.log(`[playwright-open-session] Killed stale listener PID ${pid} on port ${port}.`)
    } catch {
      // ignore
    }
  }
}

async function main() {
  if (!existsSync(bravePath)) {
    throw new Error(`Brave executable not found: ${bravePath}`)
  }

  await mkdir(rootDir, { recursive: true })
  await mkdir(profileDir, { recursive: true })

  if (process.platform === 'win32' && braveKillMode === 'all') {
    try {
      execSync('taskkill /IM brave.exe /F', { stdio: 'ignore' })
      console.log('[playwright-open-session] Cleared Brave (MSC_KILL_BRAVE_MODE=all).')
    } catch {
      // ignore when not running
    }
  } else if (process.platform === 'win32' && (braveKillMode === 'port' || braveKillMode === 'cdp')) {
    killListenersOnPortWindows(cdpPort)
  }

  let portBusy = false
  try {
    execSync(`netstat -ano | findstr :${cdpPort}`, { stdio: 'ignore' })
    portBusy = true
  } catch {
    portBusy = false
  }
  if (portBusy && braveKillMode === 'none') {
    console.warn(
      `[playwright-open-session] Port ${cdpPort} looks busy. If launch fails, close the old Playwright Brave or run: MSC_KILL_BRAVE_MODE=port npm run playwright:open`,
    )
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
