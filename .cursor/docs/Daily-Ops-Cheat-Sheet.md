# Daily Ops Cheat Sheet

Fast daily workflow for MSC-Projectz.

## 1) Start of day (2-3 min)

1. `git branch --show-current && git status -sb`
2. Read (in order):
   - `Project-Truth.md`
   - `Session-Snapshots.md` (latest first)
   - `START-HERE.md`
3. Run: `npm run deploy:preflight`
4. If coding runtime paths, start local dev: `npm run dev`
5. After finishing docs read/checks, type this exact confirmation in chat: `Ready to start Jedi Master`

Startup response format required from assistant:
- verified checklist (branch/status + doc-order confirmation + blockers)
- 3-4 recommended next tasks (ordered)
- final exact line: `Ready to start Jedi Master`

## 2) Local development (no live deploy)

1. Implement changes.
2. For runtime edits, run build gate:
   - If **`next dev` might be on port 3000**, use **`npm run verify:next:safe`** (frees **3000** first, then `clean:next` + `next build`). Raw **`npm run verify:next`** while dev is running **wipes `.next` under a live server** → **500** / missing `routes-manifest.json` / broken chunks.
   - If **3000 is free**, `npm run verify:next` is fine.
3. After a successful verify, start dev again: **`npm run dev`** (verify deletes **`.next`**).
4. Smoke (with dev up): **`npm run verify:local`** or open `http://127.0.0.1:3000/` and `/admin`.
5. Continue iterating.

**Schema pull (SQLite):** if after `git pull` the app errors with **no such column** (e.g. `manual_rank` on `msc_vault_projects`), run from repo root: **`npm run repair:sqlite`** (creates a timestamped `payload.sqlite` backup, idempotent). Then restart dev.

## 3) Prepare live deploy

1. `npm run deploy:preflight`
2. `npm run pushitlive`
3. Confirm artifact exists: `final_deploy.zip`
4. Upload zip to server app root.
5. Unzip on host, restart Node app in cPanel.
6. Validate live and check `stderr.log` if needed.

## 4) If localhost breaks (500, “Internal Server Error”, missing `.next/...`)

**One shot (recommended):** from repo root — **`npm run dev:recover`**  
(kills **3000**, deletes **`.next`**, starts a single **`next dev`**).  
Then: **`npm run verify:local`** (or hit `/`, `/admin`, `/settings` in the browser; hard-refresh if needed).

**Manual:** `node scripts/kill-dev-port.mjs` → `npm run clean:next` → `npm run dev` → re-test.

Use `FlightPro-Alt.md` only for advanced Linux/`sharp`/ownership failures.

## 5) End of session (required)

1. Update `Session-Snapshots.md` (newest entry at top):
   - what changed
   - files touched
   - validation status
   - next-start exact first step
   - blockers/risks
   - deploy-truth checks (profile/secrets/native guard)
2. If milestone reached, add row to `Restore-Points.md`.
3. Commit and push.

## 6) Give a new AI agent this pack

1. `.cursor/docs/Project-Truth.md`
2. `.cursor/docs/START-HERE.md`
3. `.cursor/docs/Session-Snapshots.md`
4. `.cursor/docs/FlightPro.md`
5. `.cursor/docs/Agent-Runbook.md`
6. `.cursor/docs/MasterSetUp.md`
7. `.cursor/docs/Restore-Points.md`
8. `package.json`
9. `msc_package_deploy.mjs`
