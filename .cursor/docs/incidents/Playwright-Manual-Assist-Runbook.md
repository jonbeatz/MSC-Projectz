# Playwright Manual-Assist Runbook (General Diagnostics)

Date: 2026-04-28  
Scope: Local UI diagnostics with a reusable Playwright harness

## Why this runbook exists
- Automated checks repeatedly landed on auth UI even when app health was fine.
- `localhost` and `127.0.0.1` had split auth state, which made tests look flaky.
- Manual-assist mode gave deterministic verification for computed styles and screenshots.

## What we learned
- Use `http://localhost:3000` consistently for login and testing.
- Do not mix `localhost` and `127.0.0.1` in the same test flow.
- Persistent browser profile launch can fail due to profile locks or install permissions.
- The reliable path is a headed manual-assist run:
  1. Script opens browser.
  2. Operator logs in manually.
  3. Script waits for `.msc-clients-glass-card`, then captures styles + screenshot.

## Reusable scripts
- Generic harness: `scripts/msc_playwright_test.mjs`
- NPM alias: `npm run playwright:test`
- Legacy clients/glass script (archived): `scripts/archive/msc_playwright_manual_clients_glass_check.mjs`
- Output screenshot path: `Playwright-Tests/playwright-test-<timestamp>.png`
- Defaults:
  - Base URL: `http://localhost:3000` (opens `/dashboard` first)
  - Browser: `Brave` (falls back to Playwright `Chromium` if Brave is unavailable)
  - Persistent profile: `Playwright-Tests/brave-profile` (session reused across runs)

Run from repo root:

```bash
npm run playwright:test
```

Optional environment overrides (example: targeted `/clients` check):

```bash
MSC_BASE_URL=http://localhost:3000
MSC_START_PATH=/dashboard
MSC_TARGET_PATH=/clients
MSC_SELECTOR=.msc-clients-glass-card
MSC_TIMEOUT_MS=300000
MSC_KEEP_OPEN_MS=30000
MSC_INTERACTIVE=true
MSC_TAKE_SCREENSHOT=true
MSC_BROWSER=brave
MSC_BRAVE_PATH=C:\Users\<you>\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe
MSC_PROFILE_DIR=Playwright-Tests/brave-profile
npm run playwright:test
```

## Default behavior now
- `npm run playwright:test` is interactive by default:
  - opens Brave
  - starts at `http://localhost:3000/dashboard`
  - launches maximized/full-width
  - uses persistent profile
  - auto-clicks Local Dev Trust Bypass when visible
  - stays open until you stop it
  - does **not** auto-capture screenshots unless `MSC_TAKE_SCREENSHOT=true`
- Use `MSC_INTERACTIVE=false` for one-shot runs that should exit automatically.
- `MSC_TARGET_PATH` is optional and only used when you want to jump to a specific page.

## Expected success output
- `ok: true`
- `styles.backdropFilter` value
- screenshot path under `Playwright-Tests/`

## Troubleshooting
- **Still on login screen**:
  - Confirm you logged in on `localhost`.
  - Open `/clients` in that same browser window.
- **Selector timeout**:
  - Verify class exists in markup (`.msc-clients-glass-card`).
  - Increase `MSC_TIMEOUT_MS`.
- **Persistent profile crashes / browser closes immediately**:
  - This script uses a dedicated Playwright profile (`Playwright-Tests/brave-profile`) to avoid collisions with your daily Brave profile.
  - If needed, close stuck Playwright-launched browser windows and rerun.

## Stable operating mode (recommended)
1. Run the script.
2. On first run only, login in the opened browser.
3. Open the page you want to diagnose (or set `MSC_TARGET_PATH` ahead of time).
4. On later runs, session should be reused automatically from `Playwright-Tests/brave-profile`.
5. If the trust-gate page appears, the script now auto-clicks `Enable Local Dev Trust Bypass (Admin)` when visible.

## Operator shorthand
- Saying **"Run Playwright Test"** means: run `npm run playwright:test` with current defaults, then report screenshot path + key findings.

## Command mode (persistent and controllable)

Use this when you want the assistant to keep one open browser session and perform multiple commands (navigate/click/read) without restarting every time.

Start session:

```bash
npm run playwright:open
```

Run commands against that same open session:

```bash
npm run playwright:cmd -- navigate /settings
npm run playwright:cmd -- click-text "Settings"
npm run playwright:cmd -- read-users-settings
npm run playwright:cmd -- screenshot settings-check.png
```

Notes:
- Session metadata is stored in `Playwright-Tests/session.json`.
- Commands connect over CDP to the existing open browser.
- Trust bypass auto-click is applied when the button is visible.

## Baseline result from this session
- Card selector found via manual-assist flow.
- Computed styles observed:
  - `backdropFilter`: `blur(18px)`
  - `backgroundColor`: `rgba(255, 255, 255, 0.1)`
  - `border`: `1px solid rgba(255, 255, 255, 0.2)`
  - `boxShadow`: `0 8px 32px rgba(0, 0, 0, 0.75)`

## Follow-up recommendation
- Choose one source of truth for blur (`inline` vs `globals.css`) to avoid drift during future checks.
