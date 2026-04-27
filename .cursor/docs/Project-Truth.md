# Project-Truth.md

Single-file onboarding truth for any AI agent working in this repository.

Use this file first, then follow its linked source-of-truth order.

## Versioning

- **Version:** `v1.1.0`
- **Updated:** `2026-04-26`
- **Owner:** `Jon Beatz / MSC-Projectz`

---

## 1) Project Identity

- **Project:** MSC-Projectz (Code Manager Command Center)
- **Operator:** Jon Beatz
- **System name:** Vader
- **Primary stack:** Next.js + React + Payload CMS + SQLite
- **Optional shell:** Tauri
- **Current workflow branch (at last docs update):** `MSC-Projectz-Pro-Live-v1`

Primary goal:
- Ship and maintain a production-ready command center with stable local workflow, reliable deploy packaging, and strong continuity between sessions.

---

## 2) Known Fragilities (Read Before Running Commands)

These are recurring failure points where agents must be extra careful:

1. **Script drift vs docs**
   - Some legacy rules/docs may mention scripts that are not in `package.json`.
   - Always verify script existence before running anything.

2. **`payload.sqlite` lock contention**
   - SQLite can lock if multiple processes write at once.
   - Keep one clear writer process and avoid concurrent DB-touching actions.

3. **`sharp` Linux binary mismatch**
   - Windows-built `node_modules` can fail on Linux (`Failed to load external module sharp`).
   - Prefer host/WSL-native installs; rebuild on Linux when needed.

4. **`.next` state corruption during active dev**
   - Running clean/build steps that delete `.next` while dev is active can break localhost.
   - Stop dev or use a safe sequence before cache/build cleanup.

5. **Ownership vs permission confusion on cPanel**
   - `chmod` may not fix EACCES if file owner differs from Node app user.
   - Validate ownership when permission fixes do not resolve writes to `.next` or DB paths.

---

## 3) What This Project Is

Core product areas:
- Route-based Command Center UI under `app/(command-center)/`
- Dashboard, tasks, profile/settings/help, and vault/code manager paths
- Payload-backed data and media handling
- Local-first development and deploy packaging via zip artifact

Core quality expectations:
- Keep commands/docs aligned with `package.json`
- Keep upload/media assets under project-root `media/`
- Keep user-scope/ownership safety in runtime actions and browser storage

---

## 4) Canonical Source-of-Truth Order

Read in this exact order when onboarding:

1. `START-HERE.md` (workflow + current restart point)
2. `Session-Snapshots.md` (latest operational context)
3. `FlightPro.md` (primary deploy/recovery SOP)
4. `Agent-Runbook.md` (execution behavior + closeout rules)
5. `MasterSetUp.md` (portable schemas/checklists)
6. `Restore-Points.md` (rollback checkpoints)
7. `package.json` (script truth)
8. `msc_package_deploy.mjs` (deploy artifact truth)

Use only when needed:
- `FlightPro-Alt.md` for advanced failures (OOM, sharp/native modules, ownership/permissions edge cases)
- `ReCall.md` for historical deep context

---

## 5) Command Truth (Do Not Guess)

Before suggesting/running any command:
- Verify script exists in `package.json`
- Prefer exact scripts over legacy aliases mentioned in old docs/rules

Current key commands:
- `npm run dev` -> local dev server
- `npm run verify:next` -> build gate (`clean:next` + build)
- `npm run pushitlive` -> release package flow
- `npm run build:prod` -> runs `msc_package_deploy.mjs`
- `npm run test:local` -> production-style local smoke via `server.js`

---

## 6) Deploy Truth (High Level)

Primary deploy flow:
1. Local build/package using `npm run pushitlive`
2. Artifact output: `final_deploy.zip`
3. Upload zip to server
4. Unzip on host
5. Restart Node app in cPanel
6. Validate routes and logs

Deployment source files:
- `FlightPro.md` (canonical SOP)
- `msc_package_deploy.mjs` (actual packaging rules/COPY_PLAN)

Important:
- Do not assume `node_modules` is bundled by default
- On Linux host, install/rebuild dependencies as needed
- Use `FlightPro-Alt.md` for advanced module/ownership/OOM recovery

---

## 7) Local Recovery Truth

If localhost breaks (port 3000, white screen, stale chunks):
- Use the manual recover pattern in `FlightPro.md` / `Agent-Runbook.md`
- Reconfirm `http://127.0.0.1:3000/` and `/admin`
- For runtime edits, do not close out until build gate is green

Do not rely on undocumented scripts.
If a script is missing from `package.json`, use documented manual fallback.

---

## 8) Session Continuity Truth

This repo uses explicit session memory:
- `Session-Snapshots.md` must be updated at closeout
- Newest snapshot stays at top
- Snapshot includes: what changed, where, validation, and exact start-next steps

Startup pattern:
1. Read latest snapshot
2. Verify branch/status
3. Continue from listed next task/file

Closeout pattern:
1. Update snapshot
2. Record commands/outcomes
3. Capture blockers/risks

---

## 9) Rules and Conventions (Critical)

- Use `package.json` as command authority
- Keep Local vs Live command locality explicit
- Store uploaded/generated media under `media/`
- Avoid secret leakage in docs/commits
- Follow `msc_` naming convention where relevant
- Prefer concise, reversible changes; avoid broad speculative rewrites

Policy locations:
- `.cursorrules`
- `.cursor/rules/*.mdc`

---

## 10) What an AI Should Do First (Checklist)

1. Read this file completely.
2. Read canonical docs in the order from Section 3.
3. Run context commands:
   - `git branch --show-current`
   - `git status -sb`
4. Verify command names in `package.json`.
5. Confirm active objective from latest `Session-Snapshots.md`.
6. Only then propose or run implementation/deploy/recovery actions.

---

## 11) AI Handoff Prompt (Copy/Paste)

```text
You are onboarding to MSC-Projectz.
Read these files in order and treat them as truth:
1) .cursor/docs/Project-Truth.md
2) .cursor/docs/START-HERE.md
3) .cursor/docs/Session-Snapshots.md (latest entry first)
4) .cursor/docs/FlightPro.md
5) .cursor/docs/Agent-Runbook.md
6) .cursor/docs/MasterSetUp.md
7) .cursor/docs/Restore-Points.md
8) package.json
9) msc_package_deploy.mjs

Rules:
- package.json is command truth
- FlightPro is deploy truth
- START-HERE + Session-Snapshots are workflow/context truth
- Use FlightPro-Alt only for advanced failure cases
- If docs conflict, report conflict and follow the above priority order
```

---

## 12) Maintenance Rule for This File

Update `Project-Truth.md` when any of these change:
- Source-of-truth file order
- Core scripts or deploy mechanics
- Session continuity process
- Branching/release workflow model

When `Versioning` is changed in this file:
- Add a matching note in `Session-Snapshots.md` (what changed, why, and any new startup/closeout behavior).

Keep it short, current, and operational.
