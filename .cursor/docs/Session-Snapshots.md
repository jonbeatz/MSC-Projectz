# Session-Snapshots

Use this file for continuous operator snapshots and end-of-session handoff notes.

Purpose:
- What was done
- Where it was done (files, branch, commit)
- What to check first when starting again

Keep newest snapshot at the top.

---

## 2026-04-26 19:52 (local) - Daily Ops cheat sheet + doc map link

### Session state
- Branch: `feature/deploy-truth-hardening` (or current working branch — verify with `git status`)
- Commit at snapshot: uncommitted
- Working tree: `dirty`
- Local dev URL: n/a (docs-only)

### What was done
- Linked `Daily-Ops-Cheat-Sheet.md` into `START-HERE.md` (read order, tree, start flow).
- Updated `Project-Truth.md` to v1.2.1: canonical order + handoff prompt include Daily Ops.

### Files touched (high value)
- `.cursor/docs/START-HERE.md`
- `.cursor/docs/Project-Truth.md`

### Validation / outcomes
- Build gate: not run
- Deploy: not run

### Open risks / blockers
- None

---

## Snapshot Template (copy/paste)

```md
## YYYY-MM-DD HH:MM (local) - <session title>

### Session state
- Branch: `<branch-name>`
- Commit at snapshot: `<sha>` (or `uncommitted`)
- Working tree: `<clean | dirty>`
- Local dev URL: `<http://127.0.0.1:3000>` status `<up/down>`

### What was done
- <change 1>
- <change 2>
- <change 3>

### Files touched (high value)
- `<path/to/file1>`
- `<path/to/file2>`
- `<path/to/file3>`

### Commands run (important)
- `npm run ...`
- `git ...`
- `curl ...`

### Validation / outcomes
- Build gate: `<pass/fail/not-run>`
- Smoke checks: `/<status>`, `/admin<status>`
- Deploy status: `<not started/in progress/done>`

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Read: `START-HERE.md` -> `MasterSetUp.md` -> `Session-Snapshots.md` (latest) -> `FlightPro.md`
3. Verify script names in `package.json` before using aliases.
4. Continue from: `<exact next file/task>`

### Open risks / blockers
- <none or list>

### Deploy truth checks (required on closeout)
- Profile changed? `<yes/no>`
- Secrets rotated/updated? `<yes/no/not-needed>`
- Windows/Linux native-module guard passed? `<yes/no/not-run>`
```

---

## 2026-04-26 19:36 (local) - Deployment truth hardening rollout

### Session state
- Branch: `MSC-Projectz-Pro-Live-v1`
- Commit at snapshot: `e6e7522` (working tree currently has new hardening changes)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `not re-tested in this docs/scripts pass`

### What was done
- Added machine-readable deploy profile template and local example override.
- Added encrypted secrets workflow doc and gitignore protection for local encrypted artifacts/keys.
- Added deploy preflight script (`deploy_profile_check.mjs`) and wired it into `build:prod`/`pushitlive`.
- Hardened `Project-Truth.md`, `FlightPro.md`, and `START-HERE.md` with profile-first and Linux/ownership guards.
- Updated snapshot template with required deploy-truth checks.
- Bumped `Project-Truth.md` version to `v1.2.0`.

### Files touched (high value)
- `.cursor/docs/Deploy-Profile.template.json`
- `.cursor/docs/Deploy-Profile.local.example.json`
- `.cursor/docs/Deploy-Secrets-Workflow.md`
- `.cursor/docs/Project-Truth.md`
- `.cursor/docs/FlightPro.md`
- `.cursor/docs/START-HERE.md`
- `.cursor/docs/Session-Snapshots.md`
- `scripts/deploy_profile_check.mjs`
- `package.json`
- `.gitignore`

### Commands run (important)
- `git branch --show-current && git log -1 --oneline && git status -sb`
- read-only path audits and docs inspection

### Validation / outcomes
- Build gate: `not run` (docs/script hardening pass).
- Smoke checks: `not run` in this pass.
- Deploy status: `not started`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Run deploy profile check: `npm run deploy:preflight`
3. If runtime changes are made, run `npm run verify:next` before closeout.
4. If release packaging is needed, run `npm run pushitlive` after preflight is green.

### Open risks / blockers
- Secrets discussed in chat context must still be rotated at provider level (`FTP`, `PAYLOAD_SECRET`, `RESEND_API_KEY`).

### Deploy truth checks (required on closeout)
- Profile changed? `yes`
- Secrets rotated/updated? `not-needed for docs, but provider-side rotation still pending`
- Windows/Linux native-module guard passed? `not-run this pass`

---

## 2026-04-26 18:56 (local) - Workflow coherence refinement pass

### Session state
- Branch: `MSC-Projectz-Pro-Live-v1`
- Commit at snapshot: `f17b08f` (docs updates currently uncommitted)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `not re-tested in this doc-only pass`

### What was done
- Updated `START-HERE.md` with a daily command pack and corrected restart-point branch/commit.
- Re-scoped `FlightPro-Alt.md` into an advanced troubleshooting appendix; removed duplicated standard-flow guidance.
- Expanded `MasterSetUp.md` with reusable code hints, fix patterns, and a clear golden workflow.
- Preserved start/continue, save-point, and closeout cadence across docs.

### Files touched (high value)
- `.cursor/docs/START-HERE.md`
- `.cursor/docs/FlightPro-Alt.md`
- `.cursor/docs/MasterSetUp.md`
- `.cursor/docs/Session-Snapshots.md`

### Commands run (important)
- `git branch --show-current && git log -1 --oneline && git status -sb`
- docs edits only (no build/deploy command in this pass)

### Validation / outcomes
- Build gate: `not run` (docs-only updates).
- Smoke checks: `not run` in this pass.
- Deploy status: `not started`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Read in order:
   - `START-HERE.md`
   - `Session-Snapshots.md` (latest section)
   - `MasterSetUp.md`
   - `FlightPro.md` (and `FlightPro-Alt.md` only if standard flow fails)
3. If moving to runtime code changes, run `npm run verify:next` before closeout.
4. If preparing live release, run `npm run pushitlive` and follow `FlightPro.md`.

### Open risks / blockers
- `START-HERE.md` restart point can go stale again unless refreshed at each meaningful branch/commit shift.

---

## 2026-04-26 18:50 (local) - Docs foundation and master setup

### Session state
- Branch: `MSC-Projectz-Pro-Live-v1`
- Commit at snapshot: `f17b08f`
- Working tree: `dirty` (additional docs updates after commit)
- Local dev URL: `http://127.0.0.1:3000` status `up` (last verified earlier in session)

### What was done
- Added and refined deploy docs: `FlightPro.md`, `FlightPro-Alt.md`, `DeployUpdate.md`, `Flight.md`.
- Added reusable cross-project master doc: `MasterSetUp.md`.
- Updated `START-HERE.md` read order and start flow.
- Added `FlightPro-Alt.md` hardening for EACCES ownership and `sharp` Linux binary rebuild notes.
- Created branch and pushed: `MSC-Projectz-Pro-Live-v1`.

### Files touched (high value)
- `.cursor/docs/START-HERE.md`
- `.cursor/docs/MasterSetUp.md`
- `.cursor/docs/FlightPro.md`
- `.cursor/docs/FlightPro-Alt.md`
- `.cursor/docs/Agent-Runbook.md`
- `.cursor/docs/Restore-Points.md`

### Commands run (important)
- `git commit ...`
- `git switch -c MSC-Projectz-Pro-Live-v1`
- `git push -u origin MSC-Projectz-Pro-Live-v1`
- local recovery/smoke commands for port `3000`

### Validation / outcomes
- Build gate: `not run` for latest docs-only edits.
- Smoke checks: `/ 200`, `/admin 200` were confirmed during local recovery step earlier.
- Deploy status: `not started` (docs and branch prep complete).

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Read in order:
   - `START-HERE.md`
   - `MasterSetUp.md`
   - `Session-Snapshots.md` (this latest section)
   - `FlightPro.md` / `FlightPro-Alt.md`
3. If doing runtime code (not docs-only), run `npm run verify:next` before closing the task.
4. If preparing release, run `npm run pushitlive` and follow `FlightPro.md` deploy flow.

### Open risks / blockers
- Some rules reference scripts like `dev:recover`/`verify:next:safe` that may not exist in `package.json`; always verify script availability first.
