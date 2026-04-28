#!/usr/bin/env node
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = path.resolve(process.cwd(), 'Playwright-Tests')
const sessionFile = path.join(rootDir, 'session.json')

function usage() {
  console.log(`Usage:
  node scripts/msc_playwright_command.mjs navigate <url-or-path>
  node scripts/msc_playwright_command.mjs click <css-selector>
  node scripts/msc_playwright_command.mjs click-text <visible text>
  node scripts/msc_playwright_command.mjs read-text [css-selector]
  node scripts/msc_playwright_command.mjs read-users-settings
  node scripts/msc_playwright_command.mjs screenshot [filename]
`)
}

function normalizeUrl(input, baseUrl) {
  if (!input) return baseUrl
  if (/^https?:\/\//i.test(input)) return input
  return `${baseUrl.replace(/\/$/, '')}/${String(input).replace(/^\//, '')}`
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
  const [command, ...rest] = process.argv.slice(2)
  if (!command) {
    usage()
    process.exit(2)
  }

  const sessionRaw = await readFile(sessionFile, 'utf8')
  const session = JSON.parse(sessionRaw)
  const cdpUrl = `http://127.0.0.1:${session.cdpPort}`
  const browser = await chromium.connectOverCDP(cdpUrl)

  let context = browser.contexts()[0]
  if (!context) {
    throw new Error('No browser context found. Start session first with msc_playwright_open_session.mjs')
  }
  let page = context.pages()[0]
  if (!page) page = await context.newPage()

  await maybeEnableTrustBypass(page)

  if (command === 'navigate') {
    const url = normalizeUrl(rest[0], session.baseUrl || session.startUrl)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await maybeEnableTrustBypass(page)
    console.log(JSON.stringify({ ok: true, command, url: page.url(), title: await page.title() }, null, 2))
    await browser.close()
    return
  }

  if (command === 'click') {
    const selector = rest[0]
    if (!selector) throw new Error('Missing selector')
    await page.locator(selector).first().click()
    await maybeEnableTrustBypass(page)
    console.log(JSON.stringify({ ok: true, command, selector, url: page.url() }, null, 2))
    await browser.close()
    return
  }

  if (command === 'click-text') {
    const text = rest.join(' ').trim()
    if (!text) throw new Error('Missing text')
    await page.getByText(text, { exact: false }).first().click()
    await maybeEnableTrustBypass(page)
    console.log(JSON.stringify({ ok: true, command, text, url: page.url() }, null, 2))
    await browser.close()
    return
  }

  if (command === 'read-text') {
    const selector = rest[0] || 'body'
    const text = await page.locator(selector).first().innerText()
    console.log(JSON.stringify({ ok: true, command, selector, url: page.url(), text }, null, 2))
    await browser.close()
    return
  }

  if (command === 'read-users-settings') {
    const data = await page.evaluate(() => {
      const text = document.body.innerText
      const lines = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
      const deny = new Set([
        'Settings',
        'Dashboard',
        'Calendar',
        'Tasks',
        'Clients',
        'Engine',
        'Add Project',
        'Sign Out',
      ])
      const users = Array.from(
        new Set(
          lines.filter(
            (l) =>
              !deny.has(l) &&
              l.length >= 3 &&
              l.length <= 48 &&
              (/^([A-Za-z][A-Za-z0-9_-]+)$/.test(l) || l.includes('@')),
          ),
        ),
      )
      return { url: location.href, title: document.title, users, sample: lines.slice(0, 120) }
    })
    console.log(JSON.stringify({ ok: true, command, ...data }, null, 2))
    await browser.close()
    return
  }

  if (command === 'screenshot') {
    const filename = rest[0] || `playwright-command-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
    const shot = path.join(rootDir, filename)
    await page.screenshot({ path: shot, fullPage: true })
    console.log(JSON.stringify({ ok: true, command, screenshotPath: shot, url: page.url() }, null, 2))
    await browser.close()
    return
  }

  usage()
  await browser.close()
  process.exit(2)
}

main().catch((error) => {
  console.error('[playwright-command] failed')
  console.error(error)
  process.exit(1)
})
