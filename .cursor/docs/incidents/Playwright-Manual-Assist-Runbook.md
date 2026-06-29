# Playwright Manual-Assist Runbook (General Diagnostics)

Date: 2026-04-28 (behavior updated 2026-04-29 — `assistStayOpen`, `assist-state` tabs, stale CDP retry)  
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
  3. When `MSC_SELECTOR` is set, script waits for that element, then can capture computed styles + optional screenshot.

## Reusable scripts

- Generic harness: `scripts/msc_playwright_test.mjs`
- NPM alias: `npm run playwright:test` (and `npm run playwright:assist`)
- Output screenshot path: `Playwright-Tests/playwright-test-<timestamp>.png`
- Defaults:
  - Base URL: `http://localhost:3000` (opens `/dashboard` first)
  - Browser: `Brave` (falls back to Playwright `Chromium` if Brave is unavailable)
  - Persistent profile: `Playwright-Tests/brave-profile` (session reused across runs)

Run from repo root:

```bash
npm run playwright:test
```

Optional environment overrides (example: targeted route + selector):

```bash
MSC_BASE_URL=http://localhost:3000
MSC_START_PATH=/dashboard
MSC_TARGET_PATH=/tasks
MSC_SELECTOR=main
MSC_TIMEOUT_MS=300000
MSC_KEEP_OPEN_MS=30000
MSC_INTERACTIVE=true
MSC_TAKE_SCREENSHOT=true
MSC_BROWSER=brave
MSC_BRAVE_PATH=C:\Users\<you>\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe
MSC_PROFILE_DIR=Playwright-Tests/brave-profile
npm run playwright:test
```

## Default behavior now (`npm run playwright:test`)

- Opens **Brave** (or Playwright Chromium if `brave.exe` missing), **`--start-maximized`**, persistent dir **`Playwright-Tests/brave-profile`**.
- Starts at **`http://localhost:3000/dashboard`** (unless **`MSC_BASE_URL`** / **`MSC_START_PATH`** override).
- **Stays open** for operator assist when **`MSC_SELECTOR`** is **unset** and **`MSC_PLAYWRIGHT_ONE_SHOT`** is **not** `1` (**`assistStayOpen`** — avoids immediate close if the shell inherited **`MSC_INTERACTIVE=false`**). Closing that browser window ends the process with **exit 0** (not an error); **Ctrl+C** in the terminal still stops the harness.
- **`MSC_PLAYWRIGHT_ONE_SHOT=1`** — print JSON once and **exit** (CI / scripted one-shot).
- Auto-clicks **Enable Local Dev Trust Bypass (Admin)** when visible (loop in long-running mode).
- Refreshes **`Playwright-Tests/assist-state.json`**: `href`, `headerSessionLabel`, **`tabCount`**, **`tabs`** (`url` / `title` per page in this browser context).
- If **`launchPersistentContext`** fails and **`session.json`** exists, tries **CDP attach**; on **`ECONNREFUSED`**, **deletes stale `session.json`** and retries a fresh launch (`scripts/msc_playwright_test.mjs`).
- Does **not** auto-screenshot unless **`MSC_TAKE_SCREENSHOT=true`**.
- **`MSC_TARGET_PATH`** — optional jump after the start page.

## Expected success output

- `ok: true`
- `styles.backdropFilter` value
- screenshot path under `Playwright-Tests/`

## Troubleshooting

- **Still on login screen**:
  - Confirm you logged in on `localhost`.
  - Navigate to the route you are testing in that same browser window.
- **Selector timeout**:
  - Verify `MSC_SELECTOR` matches an element in the DOM.
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

- Saying **"Run Playwright Test"** means: from repo root run **`npm run playwright:test`** in a **background** terminal (so the harness is not killed by tool timeouts), defaults above, then the operator uses the Playwright Brave window; the agent may read **`Playwright-Tests/assist-state.json`** or terminal JSON. If **`MSC_TAKE_SCREENSHOT=true`**, report the **`Playwright-Tests/playwright-test-*.png`** path too.

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
- `npm run playwright:open` does **not** kill all Brave windows by default. If CDP port **`9223`** is stuck: **`MSC_KILL_BRAVE_MODE=port npm run playwright:open`** kills only the listener PID(s) on that port (like the old backup’s clean slate, without closing personal Brave). **`MSC_KILL_BRAVE_MODE=all`** is last-resort (closes every Brave).
- While **`playwright:test`** runs, **`Playwright-Tests/assist-state.json`** updates with `href`, `headerSessionLabel`, **`tabCount`**, and **`tabs`** (URLs/titles for every page in the Playwright context; folder is gitignored).

## DOM / links handoff (MCP-style JSON)

For a **full page snapshot** (links, `img` srcs, accessibility tree) the agent can read in-repo — not only live `assist-state`:

1. `npm run playwright:open` (CDP Brave), navigate as needed.
2. `npm run playwright:dump-dom` or `npm run playwright:dump-dom -- /path`
3. Use **`Playwright-Tests/dom-handoff-latest.json`** (`@` in Cursor).

See **`Playwright-DOM-Handoff.md`** in this folder.

## Baseline result from this session

- Card selector found via manual-assist flow.
- Computed styles observed:
  - `backdropFilter`: `blur(18px)`
  - `backgroundColor`: `rgba(255, 255, 255, 0.1)`
  - `border`: `1px solid rgba(255, 255, 255, 0.2)`
  - `boxShadow`: `0 8px 32px rgba(0, 0, 0, 0.75)`

## Follow-up recommendation

- Choose one source of truth for blur (`inline` vs `globals.css`) to avoid drift during future checks.
