#!/usr/bin/env node
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

/**
 * Manual-assist browser verification for /clients glass card styles.
 *
 * Usage:
 *   node scripts/msc_playwright_manual_clients_glass_check.mjs
 *
 * Optional env overrides:
 *   MSC_BASE_URL=http://localhost:3000
 *   MSC_SELECTOR=.msc-clients-glass-card
 *   MSC_TIMEOUT_MS=300000
 *   MSC_BROWSER=brave|chromium
 *   MSC_BRAVE_PATH=<custom path to brave.exe>
 *   MSC_PROFILE_DIR=<persistent profile dir>
 */
const baseUrl = process.env.MSC_BASE_URL || 'http://localhost:3000'
const selector = process.env.MSC_SELECTOR || '.msc-clients-glass-card'
const timeoutMs = Number(process.env.MSC_TIMEOUT_MS || 300000)
const browserChoice = (process.env.MSC_BROWSER || 'brave').toLowerCase()

const username = process.env.USERNAME || ''
const defaultBravePath =
  process.env.MSC_BRAVE_PATH ||
  `C:\\Users\\${username}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`

const loginUrl = `${baseUrl}/dashboard`
const clientsUrl = `${baseUrl}/clients`
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const screenshotDir = 'Playwright-Tests'
const screenshotPath = `${screenshotDir}/clients-glass-manual-${stamp}.png`
const profileDir =
  process.env.MSC_PROFILE_DIR ||
  path.resolve(process.cwd(), 'Playwright-Tests', 'brave-profile')

async function main() {
  await mkdir(screenshotDir, { recursive: true })
  await mkdir(profileDir, { recursive: true })
  const useBrave = browserChoice === 'brave' && existsSync(defaultBravePath)
  if (browserChoice === 'brave' && !useBrave) {
    console.warn(
      `[manual-assist] Brave requested but not found at "${defaultBravePath}". Falling back to Playwright Chromium.`,
    )
  }
  // Windows-specific safety: clear lingering Brave processes that can lock profile launch.
  if (useBrave && process.platform === 'win32') {
    try {
      execSync('taskkill /IM brave.exe /F', { stdio: 'ignore' })
      console.log('[manual-assist] Cleared lingering Brave processes.')
    } catch {
      // Ignore when no Brave processes are running.
    }
  }
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1536, height: 960 },
    ...(useBrave ? { executablePath: defaultBravePath } : {}),
  })
  const page = context.pages()[0] || (await context.newPage())

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' })
  console.log(`[manual-assist] Browser ready at ${loginUrl}`)
  console.log(`[manual-assist] Browser: ${useBrave ? 'Brave' : 'Chromium'}`)
  console.log(`[manual-assist] Persistent profile: ${profileDir}`)
  console.log('[manual-assist] Login in the opened browser, then open /clients.')
  console.log(`[manual-assist] Waiting for selector: ${selector}`)

  async function maybeEnableDevTrustBypass() {
    const bypassBtn = page.getByRole('button', {
      name: /Enable Local Dev Trust Bypass \(Admin\)/i,
    })
    const visible = await bypassBtn.isVisible().catch(() => false)
    if (!visible) return false
    await bypassBtn.click()
    await page.waitForTimeout(500)
    console.log('[manual-assist] Clicked Local Dev Trust Bypass button.')
    return true
  }

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await maybeEnableDevTrustBypass()
    const visible = await page
      .locator(selector)
      .first()
      .isVisible()
      .catch(() => false)
    if (visible) break
    await page.waitForTimeout(1000)
  }

  const hasCard = await page
    .locator(selector)
    .first()
    .isVisible()
    .catch(() => false)

  if (!hasCard) {
    const info = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      sample: document.body.innerText.slice(0, 220),
    }))
    console.log('[manual-assist] Timeout waiting for glass card selector.')
    console.log(JSON.stringify({ ok: false, ...info }, null, 2))
    await context.close()
    process.exit(2)
  }

  const styles = await page.locator(selector).first().evaluate((el) => {
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

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log('[manual-assist] Success.')
  console.log(
    JSON.stringify(
      {
        ok: true,
        url: clientsUrl,
        selector,
        screenshotPath,
        styles,
      },
      null,
      2,
    ),
  )

  await context.close()
}

main().catch((error) => {
  console.error('[manual-assist] Script failed')
  console.error(error)
  process.exit(1)
})
