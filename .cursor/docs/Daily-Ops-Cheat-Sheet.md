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

## 2) Local development (no live deploy)

1. Implement changes.
2. For runtime edits, run build gate: `npm run verify:next`
3. Smoke test locally:
   - `http://127.0.0.1:3000/`
   - `http://127.0.0.1:3000/admin`
4. Continue iterating.

## 3) Prepare live deploy

1. `npm run deploy:preflight`
2. `npm run pushitlive`
3. Confirm artifact exists: `final_deploy.zip`
4. Upload zip to server app root.
5. Unzip on host, restart Node app in cPanel.
6. Validate live and check `stderr.log` if needed.

## 4) If localhost breaks

1. Find PID on 3000: `netstat -ano | findstr ":3000"`
2. Kill stale process: `taskkill /PID <pid> /F`
3. Clear stale build output: `npm run clean:next`
4. Restart: `npm run dev`
5. Re-test `/` and `/admin`

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
