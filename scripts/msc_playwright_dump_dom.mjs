#!/usr/bin/env node
/**
 * MCP-style DOM handoff for Cursor: links, images, accessibility tree → JSON on disk.
 *
 * Best with an existing CDP session (same as playwright:cmd):
 *   npm run playwright:open
 *   npm run playwright:dump-dom
 *   npm run playwright:dump-dom -- /settings
 *
 * If Playwright-Tests/session.json is missing or stale, launches a temporary persistent
 * context (may fail if playwright:test already holds the profile lock).
 *
 * Output (gitignored Playwright-Tests/):
 *   - dom-handoff-latest.json  (overwrite each run — @-mention for the agent)
 *   - dom-handoff-<iso>.json   (timestamped copy)
 *
 * Env: MSC_BASE_URL, MSC_DUMP_PATH, MSC_BRAVE_PATH, MSC_PROFILE_DIR (same as other scripts)
 */
import { chromium } from 'playwright'
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const baseUrl = (process.env.MSC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const outDir = path.resolve(process.cwd(), 'Playwright-Tests')
const sessionFile = path.join(outDir, 'session.json')
const profileDir =
  process.env.MSC_PROFILE_DIR ||
  path.resolve(process.cwd(), 'Playwright-Tests', 'brave-profile')
const username = process.env.USERNAME || ''
const bravePath =
  process.env.MSC_BRAVE_PATH ||
  `C:\\Users\\${username}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`
const useBrave = existsSync(bravePath)

function toAbsUrl(p) {
  if (!p) return `${baseUrl}/`
  if (/^https?:\/\//i.test(p)) return p
  return `${baseUrl}/${String(p).replace(/^\//, '')}`
}

async function maybeEnableTrustBypass(page) {
  const btn = page.getByRole('button', { name: /Enable Local Dev Trust Bypass \(Admin\)/i })
  if (await btn.isVisible().catch(() => false)) {
    await btn.click()
    await page.waitForTimeout(300)
    return true
  }
  return false
}

async function main() {
  await mkdir(outDir, { recursive: true })
  await mkdir(profileDir, { recursive: true })

  const argvTarget = process.argv[2]
  const envTarget = process.env.MSC_DUMP_PATH
  const hasExplicitTarget = Boolean(argvTarget || envTarget)
  const targetPath = argvTarget || envTarget || ''

  let context
  let browser = null
  let ownsContext = true

  const launchFresh = () =>
    chromium.launchPersistentContext(profileDir, {
      headless: false,
      viewport: null,
      args: ['--start-maximized'],
      ...(useBrave ? { executablePath: bravePath } : {}),
    })

  if (existsSync(sessionFile)) {
    try {
      const raw = await readFile(sessionFile, 'utf8')
      const session = JSON.parse(raw)
      if (session.cdpPort) {
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${session.cdpPort}`)
        context = browser.contexts()[0]
        if (context) {
          ownsContext = false
          console.log(`[dump-dom] Attached to CDP port ${session.cdpPort}`)
        }
      }
    } catch (e) {
      console.warn(`[dump-dom] CDP attach failed (${e.message}); removing stale session.json`)
      await unlink(sessionFile).catch(() => {})
    }
  }

  if (!context) {
    context = await launchFresh()
    ownsContext = true
    console.log('[dump-dom] Launched fresh persistent context (no CDP session)')
  }

  const page = context.pages()[0] || (await context.newPage())
  const cur = page.url()
  if (hasExplicitTarget) {
    await page.goto(toAbsUrl(targetPath), { waitUntil: 'domcontentloaded' })
  } else if (!cur || cur === 'about:blank') {
    await page.goto(toAbsUrl('/dashboard'), { waitUntil: 'domcontentloaded' })
  }

  await maybeEnableTrustBypass(page)
  await page.waitForTimeout(400)

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .slice(0, 500)
      .map((a) => ({
        href: a.href,
        text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240),
      })),
  )

  const images = await page.evaluate(() =>
    [...document.querySelectorAll('img[src]')]
      .slice(0, 200)
      .map((img) => ({
        src: img.getAttribute('src') || '',
        alt: (img.getAttribute('alt') || '').slice(0, 120),
      })),
  )

  const accessibility = await page.accessibility.snapshot().catch(() => null)

  const payload = {
    dumpedAt: new Date().toISOString(),
    requestedTarget: hasExplicitTarget ? targetPath : null,
    url: page.url(),
    title: await page.title(),
    links,
    images,
    accessibility,
    note: 'Use dom-handoff-latest.json for @ context. Full console timelines need DevTools or Cursor Playwright MCP.',
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const stamped = path.join(outDir, `dom-handoff-${stamp}.json`)
  const latest = path.join(outDir, 'dom-handoff-latest.json')
  const body = JSON.stringify(payload, null, 2)
  await writeFile(stamped, body, 'utf8')
  await writeFile(latest, body, 'utf8')

  console.log(JSON.stringify({ ok: true, stamped, latest, url: payload.url, linkCount: links.length }, null, 2))

  if (ownsContext) await context.close()
  else await browser.close()
}

main().catch((error) => {
  console.error('[dump-dom] failed')
  console.error(error)
  process.exit(1)
})
