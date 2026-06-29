# Project-Truth.md

Single-file onboarding truth for any AI agent working in this repository.

Use this file first, then follow its linked source-of-truth order.

## Versioning

- **Version:** `v1.2.7`
- **Updated:** `2026-04-28` (media cutover completed: backfill + cleanup + owner-safe media policy)
- **Owner:** `Jon Beatz / MSC-Projectz`

---

## 1) Project Identity

- **Project:** MSC-Projectz (Code Manager Command Center)
- **Operator:** Jon Beatz
- **System name:** Vader
- **Primary stack:** Next.js + React + Payload CMS + SQLite
- **Optional shell:** Tauri
- **Current workflow branch (at last docs update):** `MSC-Projectz-FullDev-v7`

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
   - Running clean/build steps that delete `.next` while dev is active can break localhost (500s, missing `routes-manifest.json`, etc.).
   - **Prefer:** `npm run verify:next:safe` when port **3000** might be in use; **`npm run dev:recover`** to reset dev; **`npm run verify:local`** to smoke URLs after dev is up.
   - Stop dev or use a safe sequence before cache/build cleanup.

5. **Ownership vs permission confusion on cPanel**
   - `chmod` may not fix EACCES if file owner differs from Node app user.
   - Validate ownership when permission fixes do not resolve writes to `.next` or DB paths.

6. **Clients glassmorphism visual flatness (command-center shell context)**
   - CSS classes can exist in DOM and still appear flat if backdrop context/stacking does not provide enough visible contrast.
   - Treat this as a structural + layering debug task first, not only token tweaking.
   - See `.cursor/docs/Clients-Glassmorphism-Debug-Note.md` before retrying.

## 2.1) Immediate Security Rotation Required

If credentials were exposed outside encrypted storage, rotate provider-side values immediately:

1. FTP/FTPS password
2. `PAYLOAD_SECRET`
3. `RESEND_API_KEY`

After rotation:

- update local `.env` values
- update encrypted secret payload (see `Deploy-Secrets-Workflow.md`)
- do not commit plaintext secrets
- log rotation metadata (not values) in `Session-Snapshots.md`

---

## 3) What This Project Is

Core product areas:

- Route-based Command Center UI under `app/(main)/(command-center)/` (with `app/(main)/layout.tsx` as the app document shell; Payload admin stays in `app/(payload)/` with a separate document root)
- CRM Command Center on `/clients` now supports in-app **create** and **archive** flows plus inline profile edit; archived clients are hidden from active list by default (record retained in DB via status).
- Clients glassmorphism styling experiment attempted twice on 2026-04-28 and paused (not shipped to desired quality); resume from `.cursor/docs/Clients-Glassmorphism-Debug-Note.md`.
- Media model standardized: project thumbnails now use Payload `media` relationship (`thumbnailMedia`) with legacy text thumbnail cleaned for migrated rows; navbar/favicon icon remains protected at `/media/msc-icon.png`.
- Media cleanup policy hardened: default owner-scoped dry-run cleanup with explicit opt-in for apply/global scope to avoid cross-user asset deletion.
- Dashboard (project list **sort modes** in client app settings: **manual** / **name** / **updated** / **status**; **manual** uses stored **`manualRank`** on `msc-vault-projects`). **SQLite schema drift:** run **`npm run repair:sqlite`** when errors mention missing columns—common cases include **`manual_rank`** on **`msc_vault_projects`**, and polymorphic **`*_id`** columns on **`payload_locked_documents_rels`** (**e.g. `msc_clients_id`, `msc_vault_snippets_id`**) required after new collections or Payload upgrades; those affect **`payload.update`** (manual reorder, saves), not only reads.
- **Calendar** (`/calendar`): month/week task grid from vault **due** dates. **Phase 9:** responsive **`grid-cols-1 md:grid-cols-7`**, **`gap-px`**/`zinc-800` frame, **`min-h-[150px]`** cells (**`h-auto`**, no **`1fr`** row stretch); **below `md`** stacked days include **weekday+date**; **from `md`** **Mon–Sun** header row; inner matrix can use **`md:min-w-2xl`** + horizontal **`overflow-x-auto`** on narrow desktops. **Day detail** opens a **`Dialog`** (**surface `#121212`**) with all tasks; **cell preview** shows **3** tasks + **`+ N more`**. **`Agenda`** button on narrow viewports opens the bottom **sheet** (day tap does not auto-open it). **`useIsMaxMd`** where applicable. Day cells remain **`<div role="button">`** (no nested **`<button>`** with chips). **Studio focus:** **`app/globals.css`** uses **neutral zinc** focus on **`[data-slot='input']` / `textarea`** in **`.dark`**, not brand green **`--msc-accent`** (**`select`** / select triggers keep accent ring)
- Dashboard, tasks, profile/settings/help, and vault/code manager paths
- Payload-backed data and media handling; **user/member avatars** resolve through **`msc_resolveAvatarUrl`** (`lib/msc_avatar_url.ts`) — do not pass raw Payload **`avatar`** objects to `<img src>`; dashboard member clusters use **`MemberClusterTrigger`** with **`fallbackType`** (**`'icon'`** default = Lucide **`User`** when no URL)
- Local-first development and deploy packaging via zip artifact

Core quality expectations:

- Keep commands/docs aligned with `package.json`
- Keep upload/media assets under project-root `media/`
- Keep user-scope/ownership safety in runtime actions and browser storage

---

## 4) Canonical Source-of-Truth Order

Read in this exact order when onboarding:

1. `START-HERE.md` (workflow + current restart point)
2. `Daily-Ops-Cheat-Sheet.md` (fast daily rhythm: start, dev, deploy, closeout)
3. `Session-Snapshots.md` (latest operational context)
4. `FlightPro.md` (primary deploy/recovery SOP)
5. `Agent-Runbook.md` (execution behavior + closeout rules)
6. `MasterSetUp.md` (portable schemas/checklists)
7. `Restore-Points.md` (rollback checkpoints)
8. `.cursor/docs/Deploy-Profile.template.json` (non-secret deploy contract)
9. `package.json` (script truth)
10. `msc_package_deploy.mjs` (deploy artifact truth)

Use only when needed:

- `FlightPro-Alt.md` for advanced failures (OOM, sharp/native modules, ownership/permissions edge cases)
- `ReCall.md` for historical deep context
- `.cursor/docs/Deploy-Secrets-Workflow.md` for encrypted credential handling

## 4.1) Connection Profile Truth (Non-Secret)

Use `.cursor/docs/Deploy-Profile.template.json` as the canonical non-secret profile for:

- provider + protocol (`ftp/ftps`, host, port)
- remote app root and nodevenv activation path template
- deploy/build commands and artifact file name
- path + permission policy defaults (`755` dirs, `644` files)
- runtime guards (`sharp`, sqlite, Linux module expectations)

Local account overrides belong in:

- `.cursor/docs/Deploy-Profile.local.json` (gitignored)
- reference format: `.cursor/docs/Deploy-Profile.local.example.json`

Never hardcode account-specific host usernames or absolute paths in app runtime code.

## 4.2) Encrypted Secrets Workflow

Secrets are handled through `.cursor/docs/Deploy-Secrets-Workflow.md`.

Rules:

- no plaintext secrets in tracked docs
- no secrets in chat output
- local `.env` stays source of truth for runtime values
- encrypted payload + local key workflow for deploy credentials

---

## 5) Command Truth (Do Not Guess)

Before suggesting/running any command:

- Verify script exists in `package.json`
- Prefer exact scripts over legacy aliases mentioned in old docs/rules

Current key commands:

- `npm run dev` -> local dev server
- `npm run verify:next` -> build gate (`clean:next` + build)
- `npm run deploy:preflight` -> validate deploy profile + script/path guardrails
- `npm run pushitlive` -> release package flow
- `npm run build:prod` -> runs `msc_package_deploy.mjs`
- `npm run test:local` -> production-style local smoke via `server.js`
- `npm run repair:sqlite` -> local Payload SQLite schema assist / repair (`scripts/msc_sqlite_repair_vault_schema.mjs`; backs up **`payload.sqlite`**; extends **`payload_locked_documents_rels`** and other vault tables as the codebase evolves)
- `npm run db:prune-gate-users` -> local-only: remove `*gate-user*@msc.local` test users and related rows (see `Agent-Runbook.md`)
- `npm run media:cleanup:dry` -> owner-scoped dry-run media cleanup report (requires `MSC_OWNER_ID`)
- `npm run media:cleanup:apply` -> owner-scoped apply mode media cleanup (requires `MSC_OWNER_ID`)

---

## 6) Deploy Truth (High Level)

Primary deploy flow:

1. Local preflight using `npm run deploy:preflight`
2. Local build/package using `npm run pushitlive`
3. Artifact output: `final_deploy.zip`
4. Upload zip to server
5. Unzip on host
6. Restart Node app in cPanel
7. Validate routes and logs

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

Morning handshake rule:

- Operator trigger: `Ready to begin`
- On every `Ready to begin`, re-read `START-HERE.md` and then the full canonical source-of-truth order in Section 4 before implementation work. Treat this as required each startup trigger unless operator explicitly waives docs refresh.
- Assistant startup response must end with exact line: `Ready to start Jedi Master`
- Before that final line, assistant must provide:
  - a short checklist proving startup context checks
  - 3-4 prioritized next-work recommendations

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
- Use `RoleGate` for role-based UI visibility in React components (replace old `AdminGate` pattern)
- Prefer concise, reversible changes; avoid broad speculative rewrites
- Keep project plans in `D:\Cursor_Projectz\MSC-Projectz\.cursor\plans` as default/source-of-truth location; if generated in global Cursor plans, copy into the project folder in the same session.

Policy locations:

- `.cursorrules`
- `.cursor/rules/*.mdc`

---

## 10) What an AI Should Do First (Checklist)

1. Read this file completely.
2. Read canonical docs in the order from Section 4.
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
3) .cursor/docs/Daily-Ops-Cheat-Sheet.md
4) .cursor/docs/Session-Snapshots.md (latest entry first)
5) .cursor/docs/FlightPro.md
6) .cursor/docs/Agent-Runbook.md
7) .cursor/docs/MasterSetUp.md
8) .cursor/docs/Restore-Points.md
9) package.json
10) msc_package_deploy.mjs

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
