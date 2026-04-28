# Session-Snapshots

Use this file for continuous operator snapshots and end-of-session handoff notes.

Purpose:
- What was done
- Where it was done (files, branch, commit)
- What to check first when starting again

Keep newest snapshot at the top.

**Historical entries:** keep the **branch and SHA as recorded** for that session. Rows that show `MSC-Projectz-FullDev-v2` or **`FullDev-v3`** describe work **on that day**; **current primary branch** is **`MSC-Projectz-FullDev-v7`** (see `START-HERE.md` → *Current Restart Point*).

---

## 2026-04-28 — Layered workspace complete (overlay-first + modal pattern)

### Session state

- **Branch:** `MSC-Projectz-FullDev-v9`
- **Outcome:** Overlay-first command center workflow is fully dialed in; nested drawer conflicts removed.

### What was done

- Switched dashboard interaction to overlay-first: project card click opens Focus workspace directly.
- Removed legacy inline split pane so the project grid remains full-width and static.
- Fixed Focus drawer width/shell constraints to prevent squished layout.
- Replaced nested snippet creation drawer with centered modal over Focus workspace.
- Removed Environment & References block from Focus workspace for cleaner composition and to eliminate behind-layer edit behavior.
- Converted Client Info from nested drawer to centered modal over Focus workspace.
- Added shared modal shell component to standardize layered modal styling/behavior.
- Updated Focus header controls: Return button hover/readability and tab controls styled as distinct standalone buttons.
- Restored strict auth behavior for project loading to prevent false-empty vault appearance when session context is stale.

### Validation

- `npm run verify:next:safe` passed after runtime passes.
- Dev server restarted successfully and reached Ready on port 3000.
- Smoke checks returned `200` for `/` and `/dashboard`.

### Start-next checklist

1. `git switch MSC-Projectz-FullDev-v9 && git pull`
2. `npm run dev` if not already running.
3. Verify layered flow quickly:
   - click project card -> Focus opens
   - Add snippet -> centered modal
   - Client Info -> centered modal
   - Return to Dashboard closes Focus cleanly.

### Open risks / blockers

- None blocking local workflow; remaining improvements are optional visual polish only.

---

## 2026-04-28 — Workflow hardening: Playwright isolation + media cleanup operator flow

### Session state

- **Branch:** `MSC-Projectz-FullDev-v9`
- **Commit:** `02cf15e` (`chore(workflow): harden local operator and browser automation flows`)
- **Outcome:** Local operator workflow is cleaner and safer for browser automation, media cleanup, and dashboard/admin path handling.

### What was done

- Added startup/docs-refresh and `Ok Jon` handshake reinforcement across core docs (`START-HERE`, `Project-Truth`, `Daily-Ops-Cheat-Sheet`, `Agent-Runbook`).
- Added Playwright workflow guardrails: no global Brave kill by default, attach to existing CDP session when profile is already open, explicit recovery mode via `MSC_KILL_BRAVE_MODE=all`.
- Added media cleanup convenience scripts in `package.json`:
  - `media:cleanup` (owner-safe dry-run alias)
  - `media:cleanup:run` (owner-scoped apply alias)
- Added operator phrase notes for `run media cleanup` and confirmation-before-apply behavior.
- Fixed unauthenticated vault read noise by returning empty list from `msc_loadVaultProjects` when session is missing (avoids red overlay on local dashboard reads).
- Added `/dashboard/admin` route redirect to `/admin` to avoid invalid-path runtime overlay and keep operator navigation forgiving.
- Duplicated `Vader - Test Integration` into `Jedi Master` for local testing; confirmed it appears as a separate project.

### Validation

- `npm run verify:next:safe` passed after each runtime/script pass.
- Dev server restarted and healthy on `http://localhost:3000`.
- Smoke checks returned `200` for `/`, `/admin`, and `/dashboard/admin`.
- Playwright test confirmed attach mode works and no longer force-closes normal Brave session during standard runs.

### Start-next checklist

1. `git switch MSC-Projectz-FullDev-v9 && git pull`
2. Start dev if needed: `npm run dev` (expect `Ready` on `:3000`).
3. For media hygiene command flow:
   - `run media cleanup` (or `$env:MSC_OWNER_ID='<id>'; npm run media:cleanup`)
   - review report, then confirm before `media:cleanup:run`.
4. Continue roadmap from open items:
   - Tauri local image upload path work, or
   - broader Light/Dark component audit pass.

### Open risks / blockers

- None blocking local workflow. Keep `MSC_KILL_BRAVE_MODE=all` as recovery-only mode.

---

## 2026-04-28 — Media relationship cutover complete + owner-safe cleanup policy

### Session state

- **Branch:** `MSC-Projectz-FullDev-v8`
- **Outcome:** Project thumbnail media migration completed and stabilized for current dataset.
- **What shipped:**
  - Added project `thumbnailMedia` relationship path with safe runtime fallback.
  - Backfilled legacy project thumbnail strings/data URLs into media rows and linked `thumbnailMedia`.
  - Cleaned legacy `thumbnail` text values for migrated projects.
  - Synced disk media assets (including `msc-icon.png`) into admin media inventory.
  - Removed unreferenced media clutter and introduced owner-safe cleanup guardrails (`dry-run` default, owner scope required).

### Validation

- `npm run verify:next:safe` passed.
- Dev server healthy on `:3000`; `/` and `/admin` returned `200`.
- Backfill report: `.cursor/docs/MSC-Projectz-ThumbnailMedia-Backfill-Report.json`
- Cleanup report: `.cursor/docs/MSC-Projectz-ThumbnailMedia-Cleanup-Report.json`
- Usage cleanup report: `.cursor/docs/MSC-Media-Usage-Cleanup-Report.json`

### Start-next checklist

1. For media hygiene, always run owner-scoped dry-run first:
   - `$env:MSC_OWNER_ID='<id>'; npm run media:cleanup:dry`
2. Only run apply mode after reviewing report output.
3. Keep `msc-icon.png` protected in media inventory and do not remove it during cleanup passes.

---

## 2026-04-28 — Clients glassmorphism baseline restored (visible)

### Session state

- **Branch:** `MSC-Projectz-FullDev-v8`
- **Outcome:** Glass effect became visible on `/clients` after restoring scoped class definitions + class usage alignment, then adding a direct on-element glass baseline for reliability.
- **Key fix summary:**
  - Restored in `styles/globals.css`: `.msc-clients-route-bg`, `.msc-clients-glass-card`, `.msc-clients-glass-card::before`
  - Re-applied in `components/MSC-Projectz-ClientsRouteView.tsx`: wrapper + card classes
  - Added inline card glass style and glare overlay for guaranteed render while tuning

### Validation

- `npm run verify:next:safe` passed
- Dev restarted and healthy
- `/clients` and `/admin` both returned `200`

### Start-next checklist

1. Keep current visible baseline as source of truth.
2. Tune one parameter at a time (opacity/border/glare), then validate visually.
3. Avoid broad CSS rewrites unless baseline breaks again.

---

## 2026-04-28 — Failed attempts log (media + clients glass) / retry deferred

### Session state

- **Branch:** `MSC-Projectz-FullDev-v7`
- **Outcome:** Two attempts were intentionally paused as **not shipped**:
  1. Media/vault thumbnail migration follow-up (schema + runtime stability concerns).
  2. Clients glassmorphism visual passes (V1, V2, diagnostic, V3) did not reach desired premium result despite class application and healthy build/runtime.
- **Docs added/updated for continuity:**
  - `.cursor/docs/MSC-Media-Migration-Retrospective.md`
  - `.cursor/docs/Clients-Glassmorphism-Debug-Note.md`
  - `Project-Truth.md` + `Development-Roadmap.md` updated to mark both as paused attempts.

### Validation

- Build gates remained green during styling iterations (`verify:next:safe`).
- Runtime checks remained healthy (`/clients`, `/admin` returning `200`).
- Visual acceptance failed; work paused by operator decision.

### Start-next checklist

1. Do not resume either stream from memory. Read both retrospective/debug notes first.
2. For media retry: move schema + DB checks in lockstep and start from backup-first flow in the media retrospective.
3. For glass retry: run structural stacking-context diagnostics first, then one controlled visual baseline.

---

## 2026-04-28 — Primary line: `MSC-Projectz-FullDev-v7` (cut from `v6` tip)

### Session state

- **Branch:** `MSC-Projectz-FullDev-v7` — same commit tip as **`origin/MSC-Projectz-FullDev-v6`** at creation; **`git switch MSC-Projectz-FullDev-v7 && git pull`** for day-to-day work.
- **Why:** Operator requested a new clean integration line name (**`v7`**) while preserving current tree.

### Start-next checklist

1. `git fetch origin && git switch MSC-Projectz-FullDev-v7 && git pull`
2. Update any personal bookmarks / CI that still pointed only at **`v6`** if **`v7`** is now canonical.

---

## 2026-04-28 — Phase 9 calendar ergonomics (`FullDev-v6` line) + docs sync

### Session state

- **Branch:** `MSC-Projectz-FullDev-v6` (historical cut; **current primary:** **`MSC-Projectz-FullDev-v7`**) — confirm **`git branch --show-current`** after pull.
- **What shipped (calendar):** **`CalendarGrid`** — responsive **`grid-cols-1` / `md:grid-cols-7`**, zinc **`gap-px`** calendar frame, **`min-h-[150px]`** + **`h-auto`** (removed **`gridTemplateRows`** **`1fr`** stretch). **`hidden md:contents`** weekday header row; mobile shows **`EEE, MMM d`** per cell. **Day detail `Dialog`** (`#121212`) for all tasks when a day is activated; preview **three** chips + **`+ N more`** (**`text-zinc-500`**). **`Agenda`** button on **`max-md`** opens bottom sheet (day tap no longer opens sheet-only flow). **`components/MSC-Projectz-Calendar.tsx`** re-exports **`CalendarGrid`**. Related **`/calendar`** page wiring.
- **Also on the line:** clients route/snippets/vault-snippet Payload + neutral focus (see **`011b3aa`** history on branch) — **Project-Truth** / **START-HERE** bullets refreshed.

### Validation

- **`npm run verify:next:safe`** expected green before pushing calendar changes.

### Files

- `components/CalendarGrid.tsx`, `components/MSC-Projectz-Calendar.tsx`, `app/(main)/(command-center)/calendar/page.tsx`; `.cursor/docs/` — **`START-HERE.md`**, **`Project-Truth.md`**, **`Session-Snapshots.md`**, **`Development-Roadmap.md`**

### Start-next checklist

1. `git pull` on **`MSC-Projectz-FullDev-v7`** (or **`v6`** only when reading this historical snapshot)
2. Smoke **`/calendar`** (narrow + **`md`**): stacked vs 7-column, day dialog, **Agenda** sheet on mobile.
3. After runtime edits: **`npm run verify:next`** (or **`verify:next:safe`** if dev may hold port **3000**).

---

## 2026-04-28 — SQLite `payload_locked_documents_rels` repair + manual reorder docs

### Session state

- **What shipped:** Extended **`scripts/msc_sqlite_repair_vault_schema.mjs`** so **`payload_locked_documents_rels`** gets polymorphic FK columns Payload expects (**`msc_audit_logs_id`**, **`msc_clients_id`**, **`msc_vault_snippets_id`**, each with an index). Fixes **`SQLITE_ERROR: no such column …`** during **`payload.update`** (e.g. dashboard **Move up/down**). Docs updated for schema drift vs **`msc_vault_projects`**.
- **Behavior (already in code):** **admin / master-admin** see manual reorder controls for all projects; server **`msc_moveProjectManual`** allows admins to swap adjacent rows; standard users still swap only own-owned neighbors.
- **Operator:** After **`git pull`** or new collections relating to document locks, run **`npm run repair:sqlite`** (idempotent; backs up **`payload.sqlite`**). If drift is extreme: delete **`payload.sqlite`** (and **`-journal`**), then **`PAYLOAD_SQLITE_PUSH=true npm run dev`** once, then **`/api/seed`** if needed.

### Files

- `scripts/msc_sqlite_repair_vault_schema.mjs`; `.cursor/docs/` — `Development-Roadmap.md`, `START-HERE.md`, `Project-Truth.md`, `Daily-Ops-Cheat-Sheet.md`, `Session-Snapshots.md`, `FlightPro.md`, `Agent-Runbook.md`

### Start-next checklist

1. **`npm run repair:sqlite`** on any machine whose console shows missing **`payload_locked_documents_rels.*_id`** columns.
2. Restart **`npm run dev`** and retry **Sort: Manual** reorder on **`/dashboard`**.

---

## 2026-04-27 — Sprint 8: Avatar resolution & standardized fallbacks

### Session state

- **What shipped:** **`lib/msc_avatar_url.ts`** (`msc_resolveAvatarUrl`); **`msc_mapProjectMember`** resolves **`avatarUrl`** for client; **`msc_avatarUrlFromDoc`** → resolver (**DRY**); **`MemberClusterTrigger`** **`fallbackType`** (**`'icon'`** default = Lucide **`User`**, **`strokeWidth` 1.5**, padded circle); **`MSC-Projectz-ProjectCard`**, **`CalendarTaskChip`**, **`MSC-Projectz-TaskAssignee`** badge updated.
- **Why:** Payload **`users.avatar`** can be string, id, or populated **`{ url }`** — UI must not treat **`avatar`** as a raw **`src`** without resolution.

### Validation

- **`npm run verify:next:safe`** expected green before commit; local **`/`** + **`/admin`** smoke on **3000** when dev is up.

### Start-next checklist

1. Confirm branch (**`MSC-Projectz-FullDev-v5`** or current primary per **`START-HERE`**).
2. See **`Agent-Runbook.md`** → *Profile avatars & member clusters* for resolver rules.

---

## 2026-04-27 — Local dev recovery scripts (`verify:next:safe`, `dev:recover`, `verify:local`)

- **Shipped:** `package.json` scripts — **`verify:next:safe`** (free **3000** then build), **`dev:fresh` / `dev:recover`** (kill + `rimraf .next` + `next dev`), **`verify:local` / `smoke:local`** (HTTP checks on **`127.0.0.1:3000`**). **`scripts/local-http-smoke.mjs`**. Docs: **`Daily-Ops-Cheat-Sheet`**, **`Project-Truth`** (fragility #4), **`START-HERE`** (daily commands).
- **Why:** Running **`verify:next`** / **`clean:next`** while **`next dev`** still uses **`.next`** causes **500** / missing **`routes-manifest.json`**; one-command recovery reduces repeat pain.

---

## 2026-04-27 — `MSC-Projectz-FullDev-v5` cut (calendar + vault task alignment)

### Session state
- **Branch:** `MSC-Projectz-FullDev-v5` (cut from the same tip as **`MSC-Projectz-FullDev-v4`** at calendar closeout; confirm with `git branch --show-current` and `git log -1 --oneline`)
- **What shipped:** Primary integration line moves to **v5**; includes Command Center **`/calendar`**, related vault/task wiring, docs pass, and operator restore rows. Use **`git fetch origin && git switch MSC-Projectz-FullDev-v5 && git pull`** for day-to-day work.

### Start-next checklist
1. `git switch MSC-Projectz-FullDev-v5` && `git pull`
2. `npm run verify:next` after runtime edits; `npm run dev` + smoke `/`, `/admin`, `/calendar`, `/tasks`

### Open risks / blockers
- **None** for branch cut. Do not delete **`.next`** under a live **`next dev`** (see `Agent-Runbook` / `local-runtime-recovery`).

---

## 2026-04-27 — Calendar `/calendar` (mobile, sheet agenda, a11y, border fix)

### Session state
- **Branch:** `MSC-Projectz-FullDev-v4` → **`MSC-Projectz-FullDev-v5`** (see snapshot above for current line)
- **Commit:** confirm with `git log -1 --oneline` after the calendar work is **committed and pushed**
- **What shipped:** Command Center **Calendar** at **`/calendar`**: horizontal-scroll 7-col matrix on narrow viewports, **`useIsMaxMd`** (`(max-width: 767px)`) for Sheet + `handleDayPick` behavior, shared **`CalendarAgendaPanel`** in sidebar (`md+`) and bottom **`Sheet`**, **`CalendarTaskChip`** long-press + pencil on narrow, double-click on desktop. Day cells use **`div role="button"`** + keyboard (Enter/Space) so task chips are not inside a native **`<button>`** (hydration). Selected/today styling uses **borders** only (removed Tailwind **`ring`**) to fix rounded-corner stroke artifacts. **`Development-Roadmap.md`**, **`Restore-Points.md`**, **`START-HERE`**, **`Project-Truth`**, this file updated.

### Files to remember
- `components/CalendarGrid.tsx`, `components/CalendarTaskChip.tsx`, `components/CalendarAgendaPanel.tsx`, `components/CalendarSidebar.tsx`, `app/(main)/(command-center)/calendar/page.tsx`, `lib/msc_hooks.ts` (`useIsMaxMd`)

### Start-next checklist
1. `git pull` on `MSC-Projectz-FullDev-v5`
2. After app edits: `npm run verify:next` (or avoid deleting `.next` while dev is on **3000**—see `Agent-Runbook` / `local-runtime-recovery`)
3. `npm run dev` — smoke **`/calendar`**, `/`, `/admin` on `http://127.0.0.1:3000`

### Open risks / blockers
- **None** for the calendar feature set. If **`verify:next`** removed `.next`, restart **`npm run dev`**. If two devs run **`rimraf .next`** concurrently, you can see **ENOENT** under **`.next/dev/`**; recover with a single **kill 3000 → clean → one `next dev`**.

---

## 2026-04-27 — Project sort + manual order (`manualRank`)

### Session state
- **Branch:** `MSC-Projectz-FullDev-v5` (confirm with `git branch --show-current`)
- **Commit:** set after this commit with `git log -1 --oneline`
- **What shipped:** Persisted **`manualRank`** on vault projects; client **`projectSortMode`**; **`msc_sortProjectsForDashboard`**; server **`msc_moveProjectManual`** (owner-only neighbor swap); dashboard **Sort** control; **Move up/down** on grid + list (manual + owner); UI component **`components/msc_ManualProjectMoveControls.tsx`**. SQLite repair script adds **`manual_rank`** for existing DBs. Sprint 4 “drag and drop” backlog item superseded in **`Development-Roadmap.md`**.

### Files to remember
- `collections/MSC-Projectz-VaultProjects.ts`, `lib/types.ts`, `lib/msc_map_vault.ts`, `lib/msc_project_sort.ts`, `lib/msc_vault_project_owner.ts`, `lib/msc_vault_server_actions.ts`, `lib/store.ts`, `components/dashboard-layout.tsx`, `components/MSC-Projectz-DashboardRouteView.tsx`, `components/project-grid.tsx`, `components/MSC-Projectz-ProjectCard.tsx`, `components/msc_ManualProjectMoveControls.tsx`, `scripts/msc_sqlite_repair_vault_schema.mjs`
- Docs: `Development-Roadmap.md`, `START-HERE.md`, `Project-Truth.md`, `Daily-Ops-Cheat-Sheet.md`, this file

### Start-next checklist
1. `git pull` on `MSC-Projectz-FullDev-v5`
2. Existing local DB: if you skipped repair, run **`npm run repair:sqlite`** once if needed
3. Runtime gate: `npm run verify:next` after further app changes; `npm run dev` + smoke `/` and `/admin`

### Open risks / blockers
- None for this feature set. If live host uses file SQLite and a column is missing, add the same column on host or run Payload-appropriate migration. For **`payload_locked_documents_rels`** drift, align host with **`npm run repair:sqlite`** logic or migrate.

---

## 2026-04-27 — Favicon rewrite + `MSC-Projectz-FullDev-v4` branch

### Session state
- **Branch:** `MSC-Projectz-FullDev-v4` (cut from `FullDev-v3` at the same tip; `v3` updated on `origin` first)
- **Commit:** confirm with `git log -1 --oneline` on `MSC-Projectz-FullDev-v4`
- **What shipped:** `next.config.mjs` rewrites `GET /favicon.ico` → `/media/msc-icon.png` (avoids 404; single asset in `./media`)
- **Docs:** `START-HERE`, `ReCall`, `Project-Truth`, `Session-Snapshots` intro, `Development-Roadmap` changelog, `Restore-Points` (new row)

### Start-next checklist
1. `git pull` on `MSC-Projectz-FullDev-v4`
2. Runtime edits: `npm run verify:next`, then `npm run dev`, smoke `/` and `/admin`

---

## 2026-04-27 — Full docs pass: `(main)` routing + branch truth

### Session state
- **Branch:** `MSC-Projectz-FullDev-v3`
- **Commit:** doc-only on `MSC-Projectz-FullDev-v3` — subject *docs: align operator docs with FullDev-v3 and app/(main) layout*; parent history includes layout baseline `d5422dd`. Confirm tip with `git log -1 --oneline`.
- **Working tree:** clean after the doc commit lands
- **Local dev URL:** `http://127.0.0.1:3000`

### What was done
- Aligned **`ReCall.md`**, **`START-HERE.md`**, **`Project-Truth.md`**, **`Restore-Points.md`**, **`Development-Roadmap.md`**, and this file with **dual document roots**: `app/(main)/` (app shell), `app/(payload)/` (Payload `RootLayout`), root `app/layout.tsx` pass-through.
- Corrected stale **branch** pointers (`Pro-Live-v1`, `collaborative-workspace`-only objective) and added **RP-2026-04-27** restore row for `FullDev-v3`.
- Clarified that **older snapshots** that list `FullDev-v2` remain valid **historical** records.

### Files touched (high value)
- `.cursor/docs/ReCall.md`, `START-HERE.md`, `Project-Truth.md`, `Restore-Points.md`, `Development-Roadmap.md`, `Session-Snapshots.md`

### Start-next checklist
1. `git pull && git status -sb`
2. After runtime edits: `npm run verify:next`, then `npm run dev`, smoke `/` and `/admin`

### Open risks / blockers
- None for documentation alignment.

---

## 2026-04-27 (local) — gate-user test accounts removed + docs aligned

### Session state
- **Branch:** (trust `git branch --show-current`)
- **Working tree:** expect doc-only + `package.json` script + `scripts/msc_delete_gate_test_users.mjs` when committed
- **Local dev URL:** `http://127.0.0.1:3000` — no app runtime change for this work item

### What was done
- Removed local SQLite users `gate-user-a@msc.local` and `gate-user-b@msc.local` (audit/trust-gate test fixtures, **not** the dev trust-bypass system). Deletion is ordered (vault tasks/projects rels, media, sessions, `users` row) and creates a **timestamped** `payload.sqlite.bak.gate-user-delete.*` first.
- Added **`npm run db:prune-gate-users`** → `node scripts/msc_delete_gate_test_users.mjs` (idempotent: no backup if nothing matches).
- Updated operator docs: `Agent-Runbook.md`, `FlightPro.md`, `START-HERE.md`, `Development-Roadmap.md` (changelog), `MSC-Users.md` (role clarity + test-user note).

### Files touched (high value)
- `package.json` — `db:prune-gate-users` script
- `scripts/msc_delete_gate_test_users.mjs` — libsql delete helper (avoids Payload `jiti` `@/` import issues)
- `.cursor/docs/Agent-Runbook.md`, `FlightPro.md`, `START-HERE.md`, `Session-Snapshots.md`, `Development-Roadmap.md`, `MSC-Users.md`

### Start-next checklist
1. `git status -sb` — commit if you want the script + docs on the branch
2. Settings → Users should no longer list `gate-user-*.@msc.local` (re-run `npm run db:prune-gate-users` if you recreate fixtures)

### Open risks / blockers
- None for this item. Old backups `payload.sqlite.bak.gate-user-delete.*` can be deleted manually when no longer needed.

---

## 2026-04-27 08:55 (local) - v1.03 finalized + config warning cleanup

### Session state
- Branch: `MSC-Projectz-FullDev-v2`
- Commit at snapshot: `4ca04ac` (tag `v1.03` already created)
- Working tree: `dirty` (post-tag cleanup change in `next.config.mjs`)
- Local dev URL: `http://127.0.0.1:3000` status `up`

### What was done
- Completed release-gate sequence end-to-end and created release commit/tag:
  - commit: `4ca04ac`
  - tag: `v1.03`
- Applied final config polish: removed unsupported `devBundleServerPackages` key from `next.config.mjs` to eliminate invalid-config warning noise.
- Re-ran build gate and smoke checks after cleanup.

### Files touched (high value)
- `next.config.mjs`
- `.cursor/docs/Session-Snapshots.md`
- `.cursor/docs/Development-Roadmap.md`

### Commands run (important)
- `npm run verify:next`
- `npm run dev`
- `curl -L http://127.0.0.1:3000/`
- `curl -L http://127.0.0.1:3000/admin`

### Validation / outcomes
- Build gate: `pass` (`verify:next` exits `0`).
- Invalid `next.config` key warning: `resolved` (removed unsupported key).
- Smoke checks: `/ 200`, `/admin 200`.
- Release tag status: `v1.03` present and points to `4ca04ac`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Commit the final config/docs cleanup so HEAD includes warning-free config.
3. Re-run `npm run verify:next` only if additional runtime edits are made.
4. Keep dev healthy on `3000` with `npm run dev` and smoke `/` + `/admin`.

### Open risks / blockers
- No active runtime blocker identified; remaining work is housekeeping (final cleanup commit/push if desired).

### Deploy truth checks (required on closeout)
- Profile changed? `no`
- Secrets rotated/updated? `not-needed`
- Windows/Linux native-module guard passed? `yes` (lock cleared during release gate)

---

## 2026-04-27 08:43 (local) - v1.03 release gate paused on Windows file lock

### Session state
- Branch: `MSC-Projectz-FullDev-v2`
- Commit at snapshot: `e216dfb` (working tree has uncommitted runtime/doc updates)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `stopped for clean-room reinstall`

### What was done
- Executed final release-gate audit and runtime security proofs.
- Proof A (verified): login `200`, `/admin` resolved `200` (no trust-gate redirect).
- Proof A (unverified): login `200`, `/admin` redirected `307` -> `/auth/verify-reminder`.
- Proof B (cross-tenant): User A requesting User B project by id returned `404 Not Found` (no data leak, no `500`).
- Added `devBundleServerPackages: true` to `next.config.mjs` per requested gate; build still passes but Next.js warns key is unrecognized in current version.
- Began conditional finalize sequence, but blocked by persistent Windows lock on Tailwind native binary under `node_modules`.

### Files touched (high value)
- `next.config.mjs`
- `.cursor/docs/Session-Snapshots.md`
- `.cursor/docs/Development-Roadmap.md`
- `.cursor/docs/Agent-Runbook.md`
- `.cursor/docs/START-HERE.md`
- `app/(payload)/layout.tsx`
- `payload.config.ts`
- `app/(payload)/admin/importMap.js`

### Commands run (important)
- `npm run verify:next` (pass)
- runtime auth/access proof requests for `/admin`, `/api/users/login`, and `/api/msc-vault-projects/:id`
- `taskkill /IM node.exe /F`
- `npx rimraf .next node_modules` (blocked by lock)
- `npm ci` (blocked by lock)

### Validation / outcomes
- Build gate: `pass` (`verify:next` exits `0`).
- Runtime gate proofs: `pass` for requested auth and cross-tenant denial checks.
- Finalize sequence: `blocked` by OS-level file lock:
  - `EPERM unlink D:\Cursor_Projectz\MSC-Projectz\node_modules\@tailwindcss\oxide-win32-x64-msvc\tailwindcss-oxide.win32-x64-msvc.node`
- Deploy/tag status: `not started` (intentionally halted until clean-room install succeeds).

### Start-next checklist
1. Reboot Windows (to clear external file handle lock).
2. Open **Administrator PowerShell** and run:
   - `cd D:\Cursor_Projectz\MSC-Projectz`
   - `taskkill /IM node.exe /F`
   - `cmd /c "rmdir /s /q node_modules"`
   - `npx rimraf .next`
   - `npm ci`
3. In Cursor chat, type: **`Ready to begin`** and include whether `npm ci` passed.
4. Resume immediately with:
   - `npm run generate:importmap`
   - check `generate:types` script existence; run only if present
   - `npm run verify:next`
   - `npm run dev` + smoke (`/`, `/admin`)
   - `git add -A`
   - `git commit -m "chore(release): finalize Vader Protocol v1.03 gate"`
   - `git tag -a v1.03 -m "Vader Protocol v1.03"`

### Open risks / blockers
- Single active blocker is OS lock/permission on Tailwind native binary in `node_modules`; release/tagging halted until clean-room install succeeds.

### Deploy truth checks (required on closeout)
- Profile changed? `no`
- Secrets rotated/updated? `not-needed`
- Windows/Linux native-module guard passed? `no` (currently blocked by Windows lock)

---

## 2026-04-27 08:11 (local) - Admin login crash resolved + auth flow verified

### Session state
- Branch: `MSC-Projectz-FullDev-v2`
- Commit at snapshot: `e216dfb` (working tree has uncommitted runtime + docs updates)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `up`

### What was done
- Fixed local Payload admin crash (`/admin/login` 500, `CodeEditor` config undefined) by restoring required Payload context wiring in route-group layout.
- Updated `app/(payload)/layout.tsx` to use `RootLayout` + `handleServerFunctions` from `@payloadcms/next/layouts`, passing `config` and `importMap`.
- Kept custom admin dashboard footer customization intact (`afterDashboard` in `payload.config.ts`) and regenerated Payload import map.
- Removed `transpilePackages` overrides from `next.config.mjs` to reduce risk of duplicated Payload UI/context module loading.
- Verified invalid login path returns proper auth error (`401`) instead of runtime crash.
- Verified valid login path creates session and redirects to `/auth/verify-reminder` (expected trust gate), confirming clean end-to-end auth behavior.

### Files touched (high value)
- `app/(payload)/layout.tsx`
- `next.config.mjs`
- `payload.config.ts`
- `app/(payload)/admin/importMap.js`
- `app/(payload)/admin/[[...segments]]/page.tsx` (temporary type test, reverted)
- `.cursor/docs/Session-Snapshots.md`
- `.cursor/docs/Development-Roadmap.md`
- `.cursor/docs/Agent-Runbook.md`

### Commands run (important)
- `npm run generate:importmap`
- `npm run verify:next`
- `npm run dev`
- `curl -L http://127.0.0.1:3000/`
- `curl -L http://127.0.0.1:3000/admin`
- `Invoke-RestMethod POST http://127.0.0.1:3000/api/users/login` (invalid + valid checks)

### Validation / outcomes
- Build gate: `pass` (`npm run verify:next`).
- Smoke checks: `/ 200`, `/admin 200`, `/admin/login 200`.
- Auth checks:
  - invalid credentials -> `401` with expected message.
  - valid credentials -> login success (`200`) + `/admin` redirect to `/auth/verify-reminder` (`307`), reminder page `200`.
- Deploy status: `not started`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Confirm local server: `npm run dev`, then smoke `/` + `/admin`.
3. If touching Payload admin layout/routes, keep `app/(payload)/layout.tsx` on `RootLayout` pattern (`config` + `importMap` + `serverFunction`).
4. Re-run `npm run generate:importmap` after admin component map/config changes.
5. Before closeout on runtime edits: `npm run verify:next`, then restart `npm run dev`.

### Open risks / blockers
- Admin crash blocker is resolved locally; primary remaining auth behavior is the expected verify-reminder redirect for unverified accounts.

### Deploy truth checks (required on closeout)
- Profile changed? `no`
- Secrets rotated/updated? `not-needed`
- Windows/Linux native-module guard passed? `not-run this pass`

---

## 2026-04-27 04:03 (local) - Final nightly pass (admin 500 persists)

### Session state
- Branch: `MSC-Projectz-FullDev-v2`
- Commit at snapshot: `e216dfb` (working tree has uncommitted admin-runtime diagnostics)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `up`

### What was done
- Ran final dependency-isolation attempt: removed direct top-level `@payloadcms/ui` dependency while keeping Payload family pinned/overridden to `3.84.1`.
- Re-installed dependencies, regenerated Payload import map, and re-ran build verification.
- Re-tested `/admin/login`; failure remains unchanged (`CodeEditor` config undefined).
- Confirmed the issue is not resolved by version pinning + direct UI dependency removal.

### Files touched (high value)
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `app/(payload)/admin/importMap.js`
- `.cursor/docs/Session-Snapshots.md`
- `.cursor/docs/Development-Roadmap.md`

### Commands run (important)
- `npm install`
- `npm run generate:importmap`
- `npm run verify:next`
- `npm run dev`
- `Invoke-WebRequest http://127.0.0.1:3000/admin/login`

### Validation / outcomes
- Build gate: `pass`.
- Smoke checks: `/ 200`, `/admin/login 500` (still failing).
- Deploy status: `not started`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Trigger startup protocol and read-order handshake (`Ready to begin` -> final line `Ready to start Jedi Master`).
3. Reconfirm current failure quickly: `npm run dev` then `http://127.0.0.1:3000/admin/login`.
4. Begin focused admin-shell bisect (minimal Payload admin setup branch or temporary stripped admin config) to isolate where `ConfigContext` is lost.
5. Keep dependency pins/overrides in place during bisect so package drift does not re-enter the signal.

### Open risks / blockers
- Primary blocker remains unresolved: Payload admin route fails despite clean builds and unified Payload versions.
- Windows native file locking can still interfere with deep-clean attempts; use lock-safe sequence when required.

### Deploy truth checks (required on closeout)
- Profile changed? `no`
- Secrets rotated/updated? `not-needed`
- Windows/Linux native-module guard passed? `not-run this pass`

---

## 2026-04-27 03:48 (local) - Admin 500 deep isolation + dependency unification pass

### Session state
- Branch: `MSC-Projectz-FullDev-v2`
- Commit at snapshot: `e216dfb` (working tree has additional uncommitted dependency/config diagnostics)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `up`

### What was done
- Reproduced `/admin/login` 500 consistently and captured stack (`@payloadcms/ui` -> `CodeEditor` config undefined).
- Ran deep dependency reset flow: fresh install, Payload-family upgrade, import-map regenerate, full verify builds.
- Audited route/layout and collection context safety; ruled out `VaultProjects`/`VaultTasks` custom field component/context issues.
- Ran targeted isolation on `payload.config.ts` admin component injection; confirmed it is **not** the trigger and restored config.
- Added strict Payload package pinning and npm overrides to force one Payload-family version (`3.84.1`) across tree.

### Files touched (high value)
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `app/(payload)/admin/importMap.js`

### Commands run (important)
- `npm install`
- `npm install payload@latest @payloadcms/next@latest @payloadcms/ui@latest @payloadcms/db-sqlite@latest @payloadcms/richtext-lexical@latest --legacy-peer-deps`
- `npm run generate:importmap`
- `npx next build`
- `npm run verify:next`
- `npm run dev`
- `Invoke-WebRequest http://127.0.0.1:3000/`
- `Invoke-WebRequest http://127.0.0.1:3000/admin/login`

### Validation / outcomes
- Build gate: `pass` (both `next build` and `verify:next` passed after dependency/config updates).
- Smoke checks: `/ 200`, `/admin/login 500` (issue persists).
- Deploy status: `not started`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. Re-test current state quickly: `npm run dev` then `/` and `/admin/login`.
3. Continue with Payload admin shell isolation (module/context path), starting from `app/(payload)/admin/[[...segments]]/page.tsx`, `app/(payload)/layout.tsx`, and current `next.config.mjs`.
4. If needed, create temporary minimal Payload config branch to bisect admin runtime behavior without the `(main)` dashboard shell wrappers.

### Open risks / blockers
- Primary blocker remains: local Payload admin login route (`/admin/login`) returns `500` with `CodeEditor` context error despite aligned versions/import map and clean builds.
- Windows file-locking (`EPERM` on Tailwind native binary) can interrupt full `node_modules` wipes; use lock-safe cleanup sequence.

### Deploy truth checks (required on closeout)
- Profile changed? `no`
- Secrets rotated/updated? `not-needed`
- Windows/Linux native-module guard passed? `not-run this pass`

---

## 2026-04-27 02:52 (local) - Tasks UI declutter + roadmap sync

### Session state
- Branch: `MSC-Projectz-FullDev-v1`
- Commit at snapshot: `4ef2bd2` (working tree has additional uncommitted UI/docs updates)
- Working tree: `dirty`
- Local dev URL: `http://127.0.0.1:3000` status `up`

### What was done
- Completed focused Tasks/UI polish pass: neutralized in-progress row backgrounds, default-collapsed Project Info, and thinner progress bars.
- Removed top Progress strip from dashboard project cards to reduce visual clutter.
- Synced roadmap status to reflect shipped verification flow + latest declutter updates.
- Re-ran build gate and local smoke checks as part of runtime-edit closeout.

### Files touched (high value)
- `components/global-tasks-view.tsx`
- `components/task-drawer.tsx`
- `components/task-pulse.tsx`
- `components/ui/progress.tsx`
- `components/MSC-Projectz-ProjectCard.tsx`
- `.cursor/docs/Development-Roadmap.md`

### Commands run (important)
- `npm run verify:next`
- `npm run dev`
- `Invoke-WebRequest http://127.0.0.1:3000/`
- `Invoke-WebRequest http://127.0.0.1:3000/admin`

### Validation / outcomes
- Build gate: `pass` (`verify:next` succeeded after follow-up type fix).
- Smoke checks: `/ 200`, `/admin 500` (known existing Payload admin runtime issue; not introduced by this UI pass).
- Deploy status: `not started`.

### Start-next checklist
1. Run: `git branch --show-current && git status -sb`
2. If continuing UI polish, start in `components/MSC-Projectz-ProjectCard.tsx` and `components/global-tasks-view.tsx`.
3. If targeting stability next, run local admin recovery/debug flow first for `/admin` 500.
4. Before next closeout on runtime changes, run `npm run verify:next`, then restart `npm run dev` on port `3000`.

### Open risks / blockers
- Local `/admin` route currently returns `500` due to existing Payload admin runtime error (`CodeEditor.tsx` config destructure path).

### Deploy truth checks (required on closeout)
- Profile changed? `no`
- Secrets rotated/updated? `not-needed`
- Windows/Linux native-module guard passed? `not-run this pass`

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
