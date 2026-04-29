#!/usr/bin/env node
import { chromium } from 'playwright'
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

/**
 * Generic Playwright manual-assist test harness for local diagnostics.
 *
 * Defaults:
 * - Browser: Brave (fallback to Chromium)
 * - Base URL: http://localhost:3000
 * - Start path: /dashboard
 * - Persistent profile: Playwright-Tests/brave-profile
 * - Screenshots: Playwright-Tests/
 *
 * Env overrides:
 *   MSC_BASE_URL=http://localhost:3000
 *   MSC_START_PATH=/dashboard
 *   MSC_TARGET_PATH=/clients
 *   MSC_SELECTOR=main
 *   MSC_TIMEOUT_MS=300000
 *   MSC_KEEP_OPEN_MS=0
 *   MSC_INTERACTIVE=true|false (legacy; no-selector assist stays open unless MSC_PLAYWRIGHT_ONE_SHOT=1)
 *   MSC_PLAYWRIGHT_ONE_SHOT=1 — exit after snapshot (no infinite loop; use for CI / scripted runs)
 *   MSC_TAKE_SCREENSHOT=true|false
 *   MSC_BROWSER=brave|chromium
 *   MSC_BRAVE_PATH=C:\Users\<you>\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe
 *   MSC_PROFILE_DIR=Playwright-Tests/brave-profile
 *
 * Refreshes Playwright-Tests/assist-state.json while running: primary page header/URL plus
 * tabCount + tabs[] (every page in this browser context from Playwright).
 */
const baseUrl = process.env.MSC_BASE_URL || 'http://localhost:3000'
const startPath = process.env.MSC_START_PATH || '/dashboard'
const targetPath = process.env.MSC_TARGET_PATH || ''
const selector = process.env.MSC_SELECTOR || ''
const timeoutMs = Number(process.env.MSC_TIMEOUT_MS || 300000)
const keepOpenMs = Number(process.env.MSC_KEEP_OPEN_MS || 0)
const interactive = (process.env.MSC_INTERACTIVE || 'true').toLowerCase() !== 'false'
const playWrightOneShot = (process.env.MSC_PLAYWRIGHT_ONE_SHOT || '').toLowerCase() === '1'
/** No-selector headed assist: stay open for operator unless explicit one-shot (ignores inherited MSC_INTERACTIVE=false). */
const assistStayOpen = !selector && !playWrightOneShot
const takeScreenshot = (process.env.MSC_TAKE_SCREENSHOT || 'false').toLowerCase() === 'true'
const browserChoice = (process.env.MSC_BROWSER || 'brave').toLowerCase()
const braveKillMode = (process.env.MSC_KILL_BRAVE_MODE || 'none').toLowerCase()

const username = process.env.USERNAME || ''
const defaultBravePath =
  process.env.MSC_BRAVE_PATH ||
  `C:\\Users\\${username}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`

const screenshotDir = 'Playwright-Tests'
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const screenshotPath = `${screenshotDir}/playwright-test-${stamp}.png`
const sessionFile = path.resolve(process.cwd(), 'Playwright-Tests', 'session.json')
const profileDir =
  process.env.MSC_PROFILE_DIR ||
  path.resolve(process.cwd(), 'Playwright-Tests', 'brave-profile')
const assistStatePath = path.resolve(process.cwd(), screenshotDir, 'assist-state.json')

async function writeAssistState(context, page, patch = {}) {
  const pages = context.pages()
  const tabs = await Promise.all(
    pages.map(async (p, index) => ({
      index,
      url: p.url(),
      title: await p.title().catch(() => ''),
      /** Tab the harness attached to (not necessarily the user-focused tab). */
      isHarnessPage: p === page,
    })),
  )
  const snap = await page
    .evaluate(() => {
      const header = document.querySelector('header')
      let headerSessionLabel = null
      if (header) {
        for (const btn of header.querySelectorAll('button[type="button"]')) {
          if (btn.getAttribute('aria-label') === 'Open menu') continue
          const truncated = btn.querySelector('span.truncate')
          const t = truncated?.textContent?.trim()
          if (t && t !== 'Loading...') {
            headerSessionLabel = t
            break
          }
        }
      }
      return {
        href: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
        headerSessionLabel,
      }
    })
    .catch(() => ({
      href: '',
      pathname: '',
      title: '',
      headerSessionLabel: null,
    }))
  const href = snap.href || page.url()
  const payload = {
    ...snap,
    href,
    tabCount: tabs.length,
    tabs,
    updatedAt: new Date().toISOString(),
    profileDir,
    ...patch,
  }
  await writeFile(assistStatePath, JSON.stringify(payload, null, 2), 'utf8')
}

function joinUrl(base, p) {
  if (!p) return base
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${base.replace(/\/$/, '')}/${p.replace(/^\//, '')}`
}

async function main() {
  await mkdir(screenshotDir, { recursive: true })
  await mkdir(profileDir, { recursive: true })

  const useBrave = browserChoice === 'brave' && existsSync(defaultBravePath)
  if (browserChoice === 'brave' && !useBrave) {
    console.warn(
      `[playwright-test] Brave requested but not found at "${defaultBravePath}". Falling back to Chromium.`,
    )
  }

  if (useBrave && process.platform === 'win32' && braveKillMode === 'all') {
    try {
      execSync('taskkill /IM brave.exe /F', { stdio: 'ignore' })
      console.log('[playwright-test] Cleared lingering Brave processes (MSC_KILL_BRAVE_MODE=all).')
    } catch {
      // Ignore "process not found"
    }
  }

  let context
  let browser = null
  let ownsContext = true

  const launchFresh = () =>
    chromium.launchPersistentContext(profileDir, {
      headless: false,
      viewport: null,
      args: ['--start-maximized'],
      ...(useBrave ? { executablePath: defaultBravePath } : {}),
    })

  try {
    context = await launchFresh()
  } catch (error) {
    // If the persistent profile is already open (common during `playwright:open` runs),
    // attach to the existing CDP session instead of failing hard.
    if (!existsSync(sessionFile)) throw error
    const raw = await readFile(sessionFile, 'utf8')
    const session = JSON.parse(raw)
    if (!session.cdpPort) throw error
    try {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${session.cdpPort}`)
      context = browser.contexts()[0]
      if (!context) throw new Error('No browser context after CDP attach')
      ownsContext = false
      console.log(`[playwright-test] Attached to existing Playwright session on CDP ${session.cdpPort}.`)
    } catch (cdpError) {
      // Stale session.json (nothing listening on CDP) after Brave was closed — common ECONNREFUSED.
      console.warn(
        `[playwright-test] CDP attach failed (${cdpError?.message || cdpError}). Removing stale session.json and retrying fresh launch.`,
      )
      await unlink(sessionFile).catch(() => {})
      context = await launchFresh()
      browser = null
      ownsContext = true
    }
  }

  const page = context.pages()[0] || (await context.newPage())

  const startUrl = joinUrl(baseUrl, startPath)
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' })
  console.log(`[playwright-test] Browser ready at ${startUrl}`)
  console.log(`[playwright-test] Browser: ${useBrave ? 'Brave' : 'Chromium'}`)
  console.log(`[playwright-test] Persistent profile: ${profileDir}`)
  console.log(
    `[playwright-test] assistStayOpen=${assistStayOpen} oneShot=${playWrightOneShot} interactive(env)=${interactive} selector=${selector ? '(set)' : '(none)'} keepOpenMs=${keepOpenMs}`,
  )
  console.log(`[playwright-test] Assist state (for Cursor): ${assistStatePath}`)

  async function maybeEnableDevTrustBypass() {
    const bypassBtn = page.getByRole('button', {
      name: /Enable Local Dev Trust Bypass \(Admin\)/i,
    })
    const visible = await bypassBtn.isVisible().catch(() => false)
    if (!visible) return false
    await bypassBtn.click()
    await page.waitForTimeout(500)
    console.log('[playwright-test] Clicked Local Dev Trust Bypass button.')
    return true
  }

  if (targetPath) {
    const targetUrl = joinUrl(baseUrl, targetPath)
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    console.log(`[playwright-test] Navigated to target: ${targetUrl}`)
  } else {
    console.log('[playwright-test] No MSC_TARGET_PATH set; staying on start page.')
  }

  const deadline = Date.now() + timeoutMs
  if (selector) {
    console.log(`[playwright-test] Waiting for selector: ${selector}`)
    while (Date.now() < deadline) {
      await maybeEnableDevTrustBypass()
      await writeAssistState(context, page, { mode: 'selector-wait' })
      const visible = await page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false)
      if (visible) break
      await page.waitForTimeout(1000)
    }
  } else {
    // Without selector, still allow trust-gate auto-bypass and short stabilization.
    await maybeEnableDevTrustBypass()
    await page.waitForTimeout(1200)
    const href = page.url()
    if (/sign-?in|login|auth/i.test(href)) {
      console.log(
        '[playwright-test] Still on auth URL — log in once in this Playwright profile; dev trust bypass only runs when that button is visible after you reach the gated UI.',
      )
    }
  }

  await writeAssistState(context, page, { mode: selector ? 'selector' : 'snapshot' })

  const selectorFound = selector
    ? await page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false)
    : true

  const pageState = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    sample: document.body.innerText.slice(0, 220),
  }))

  let styles = null
  if (selector && selectorFound) {
    styles = await page.locator(selector).first().evaluate((el) => {
      const comp = window.getComputedStyle(el)
      return {
        backdropFilter: comp.backdropFilter,
        webkitBackdropFilter: comp.webkitBackdropFilter,
        backgroundColor: comp.backgroundColor,
        border: comp.border,
        boxShadow: comp.boxShadow,
        className: el.className,
      }
    })
  }

  if (takeScreenshot) {
    await page.screenshot({ path: screenshotPath, fullPage: true })
  }
  const result = {
    ok: selector ? selectorFound : true,
    browser: useBrave ? 'Brave' : 'Chromium',
    startUrl,
    targetPath: targetPath || null,
    selector: selector || null,
    screenshotPath: takeScreenshot ? screenshotPath : null,
    pageState,
    styles,
  }
  console.log(JSON.stringify(result, null, 2))

  if (assistStayOpen) {
    console.log('[playwright-test] Interactive mode active. Browser will stay open until stopped (Ctrl+C).')
    console.log('[playwright-test] Waiting for follow-up checks...')
    // Keep trust-bypass automation active while the browser remains open.
    while (true) {
      await maybeEnableDevTrustBypass()
      await writeAssistState(context, page, { mode: 'interactive', assistHarnessRunning: true })
      await page.waitForTimeout(1000)
    }
  } else if (keepOpenMs > 0) {
    console.log(`[playwright-test] Keeping browser open for ${keepOpenMs}ms.`)
    const keepUntil = Date.now() + keepOpenMs
    while (Date.now() < keepUntil) {
      await writeAssistState(context, page, { mode: 'keep-open', assistHarnessRunning: true })
      const remaining = keepUntil - Date.now()
      if (remaining <= 0) break
      await page.waitForTimeout(Math.min(2000, remaining))
    }
  } else {
    console.log(
      '[playwright-test] Closing browser (MSC_PLAYWRIGHT_ONE_SHOT=1, or MSC_SELECTOR set without keep-open, or finished keepOpenMs). For no-selector assist, omit MSC_PLAYWRIGHT_ONE_SHOT.',
    )
  }

  if (ownsContext) {
    await context.close()
  } else if (browser) {
    await browser.close()
  }
  if (!result.ok) process.exit(2)
}

main().catch((error) => {
  console.error('[playwright-test] Script failed')
  console.error(error)
  process.exit(1)
})
