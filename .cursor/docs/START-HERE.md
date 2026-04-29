# Project Vision: MSC-Projectz (Code Manager Command Center)

## Start / Continue Here

Use this quick flow at the beginning of every session:

1. Confirm branch and working tree: `git branch --show-current` and `git status -sb`.
2. Re-read canonical docs in order (below), starting with this file.
4. Load deploy profile context from `.cursor/docs/Deploy-Profile.template.json` (+ local override if present).
5. Confirm script truth in `package.json` before using any command alias.
6. For runtime edits (`app/`, `components/`, `lib/`, `collections/`, config), run build gate before closeout:
   - `npm run verify:next`
7. Ensure local dev is healthy on port `3000`:
   - `npm run dev`
   - smoke test `/` and `/admin` on `http://127.0.0.1:3000`
8. Read latest handoff in `Session-Snapshots.md` and continue from its "Start-next checklist".
9. Final startup confirmation line (must be exact): **`Ready to start Jedi Master`**.

### Morning startup response contract (assistant)

When operator says `Ready to begin`, the startup response must include:

0. A fresh docs-read pass confirmation for this session trigger:
   - Start at `START-HERE.md`
   - Continue through the full Documentation map read order in this file (items 1-9)
   - Do this even if docs were read earlier the same day, unless operator explicitly says "skip docs read"
1. A short verified checklist (branch/status, docs-read order, immediate blocker state).
2. `3-4` prioritized next tasks for the session.
3. Final line exactly: **`Ready to start Jedi Master`**.

If localhost is broken, follow recovery in `FlightPro.md` and `Agent-Runbook.md`.

### Daily quick commands

- Context: `git branch --show-current && git status -sb`
- Deploy profile preflight: `npm run deploy:preflight`
- Build gate (runtime edits): `npm run verify:next` — or **`npm run verify:next:safe`** if `next dev` may be on **3000** (avoids corrupt `.next`)
- Broken localhost: **`npm run dev:recover`** (kill **3000** → clean **`.next`** → `next dev`); then **`npm run verify:local`**
- Dev server: `npm run dev`
- Smoke: `npm run verify:local` or `http://127.0.0.1:3000/` and `http://127.0.0.1:3000/admin`
- Media cleanup dry-run (owner-safe): `$env:MSC_OWNER_ID='<id>'; npm run media:cleanup:dry`
- Release package: `npm run pushitlive`
- Playwright (open dedicated browser session): `npm run playwright:open`
- Playwright (headed assist harness): **`npm run playwright:test`** (alias **`npm run playwright:assist`**) — see **Run Playwright Test** below and **`.cursor/docs/incidents/Playwright-Manual-Assist-Runbook.md`**
- Playwright DOM snapshot for the agent (`Playwright-Tests/dom-handoff-latest.json`): `npm run playwright:open` then `npm run playwright:dump-dom` (see `.cursor/docs/incidents/Playwright-DOM-Handoff.md`)
- Playwright CDP port stuck (open session only, does not kill all Brave): `MSC_KILL_BRAVE_MODE=port npm run playwright:open`
- Playwright hard reset mode (only if needed): `MSC_KILL_BRAVE_MODE=all npm run playwright:test`

### Run Playwright Test (`npm run playwright:test`)

**What it is:** Headed **Brave** (or Chromium fallback) using the **isolated** profile **`Playwright-Tests/brave-profile`** — not your everyday Brave — so automation does not log you out of personal browsing.

**What it should do (defaults):**

1. Open **`http://localhost:3000/dashboard`** (override with **`MSC_BASE_URL`**, **`MSC_START_PATH`**).
2. Click **Local Dev Trust Bypass** when that button is visible (dev gate only; not on a bare login screen).
3. With **no** **`MSC_SELECTOR`**, keep the window **open** for manual work (**`assistStayOpen`**) until you **Ctrl+C** the terminal job — even if the shell has **`MSC_INTERACTIVE=false`**. Set **`MSC_PLAYWRIGHT_ONE_SHOT=1`** only when you want a **quick exit** after the snapshot.
4. While running, refresh **`Playwright-Tests/assist-state.json`** (URL, header label, **tab list**) so the agent can read local context — not a live video feed.
5. Optional: **`MSC_TARGET_PATH`**, **`MSC_SELECTOR`**, **`MSC_TAKE_SCREENSHOT=true`**, **`MSC_KEEP_OPEN_MS`** — see the **Playwright Manual-Assist Runbook**.

**Operator phrase “Run Playwright Test”:** from repo root run **`npm run playwright:test`** in a **background** terminal so it keeps running; agent may read **`assist-state.json`** / logs you paste. **Full SOP:** **`.cursor/docs/incidents/Playwright-Manual-Assist-Runbook.md`**.

### Operator quick phrases (notes)

- `run playwright test` / `Run Playwright Test` → **`npm run playwright:test`** (background), then use Playwright Brave + **`assist-state.json`** as needed (see **Run Playwright Test** above).
- `run media cleanup` -> owner-scoped dry-run (`npm run media:cleanup`) + confirmation prompt before apply.
- `run media cleanup apply` -> owner-scoped apply (`npm run media:cleanup:run`) only after explicit yes/confirm.
- Keep media cleanup owner-scoped by default; use global scope only when explicitly requested.

### Plan artifact note

- **Canonical folder (repo):** **`.cursor/plans/`** — source of truth for plans you keep in Git. See **`.cursor/plans/README.md`** for why Cursor sometimes drafts under `%USERPROFILE%\.cursor\plans` first and how to consolidate into this repo folder.
- Default requirement: final planning artefacts live in **`.cursor/plans/`** (copy from profile drafts when needed).
- If **Save to workspace** or the agent writes into this repo’s **`.cursor/plans/`**, treat that copy as authoritative. If the only copy is still under **`%USERPROFILE%\.cursor\plans`**, copy it into **`.cursor/plans`** in the workspace before closeout when it should be tracked in Git.
- Agent operating rule: when authoring plan markdown directly, **`Write`** files under **`.cursor/plans/`**; if a draft exists only under the profile path, copy into **`.cursor/plans/`** in the same session before closeout.

### Known fixes (do this first)

- **Dashboard “Authentication required to fetch vault projects” while UI looks signed in:** client/store raced ahead of **Payload httpOnly** session on the first server action. **Do not** revert the mitigation — read **`.cursor/docs/incidents/Vault-Session-Hydration-Race.md`**. Use **one** local origin (`127.0.0.1` *or* `localhost`, not both) for cookies.
- **Payload admin crash (`/admin/login` 500, `CodeEditor` config undefined):** ensure `app/(payload)/layout.tsx` uses Payload `RootLayout` wiring with `config` + `importMap` + `handleServerFunctions` serverFunction.
- **After any admin layout/component wiring change:** run `npm run generate:importmap`, then `npm run verify:next`, then `npm run dev`, then smoke `/` + `/admin`.
- **Reference records:** see latest resolved incident in `Session-Snapshots.md` (`2026-04-27 08:11`) and permanent guardrail in `Agent-Runbook.md` (`Payload admin guardrail` section).
- **Local `gate-user-*.@msc.local` in Settings → Users:** optional audit test accounts, not the dev trust bypass. To remove them from SQLite, **`npm run db:prune-gate-users`** (see `Agent-Runbook.md` → *Local SQLite: gate-user*).
- **Paused retry streams (2026-04-28):** before resuming media thumbnail migration or Clients glassmorphism, read:
- **Media migration now completed (2026-04-28):** project thumbnails are linked via `thumbnailMedia`; legacy text thumbnail values were cleaned for migrated rows; media usage cleanup is now owner-safe and dry-run by default.
- **Paused retry stream (remaining):** Clients glassmorphism continues to use debug note history; read before revisiting:
  - `.cursor/docs/incidents/MSC-Media-Migration-Retrospective.md`
  - `.cursor/docs/incidents/Clients-Glassmorphism-Debug-Note.md`

### Operator handshake triggers ("Ok Jon")

At recognized workflow starts, first status line should be:

- `Ok Jon - <recognized command>. <one-line action plan>.`

For `Ready to begin`, this first `Ok Jon` line confirms docs context is loaded for the current startup pass.

Use once at flow start to confirm context/docs were read, then continue normally.

Recognized triggers:
- `Ready to start Jedi Master` (use after docs-read completion check)
- `Ready to begin`
- `Lets Start`
- `Lets Continue`
- `Lets Push It Live`
- `Lets Push It Live (Safe)`
- `Lets Verify Live`
- `Lets Checkpoint Docs + Commit`
- `Lets Checkpoint + Deploy`
- `Lets Finish`
- `Lets Finish + Deploy`

## Session Closeout (required)

Before ending a session, update `Session-Snapshots.md` with:

1. **What was done** (short bullets)
2. **Where** (key files and branch/commit)
3. **Validation** (build/smoke/deploy status)
4. **What to do first next time** (exact commands + first file/task)
5. **Open risks/blockers** (if any)

Use the template in `Session-Snapshots.md` and keep newest entry at the top.

## Current Objective

Ship a production-ready **Payload 3** + **Next.js 16** command center (with optional **Tauri 2**), including vault/collab features (e.g. per-project mail settings and admin configuration). **Primary integration branch:** `MSC-Projectz-FullDev-v10` (use `MSC-Projectz-FullDev-v9` / `v8` / `v7` as recent checkpoints).

## Current Restart Point

* **Branch:** `MSC-Projectz-FullDev-v10` (primary line; keep recent prior branches for checkpoint history)
* **Remote:** `origin` → `https://github.com/jonbeatz/MSC-Projectz.git`
* **Latest recorded commit (this doc refresh):** confirm SHA with `git log -1 --oneline` on `MSC-Projectz-FullDev-v10`.
* **Layout / admin shell baseline:** `d5422dd` — *fix(admin): split app shell from Payload and harden local dev*
* **Working-state note:** docs were expanded for start/continue workflow, snapshots, and closeout. Always trust `git status -sb` as the live state.
* **Architecture:** Command Center routes live under `app/(main)/(command-center)/` (group `(main)` owns the app `<html>`/`<body>`); login and auth live under `app/(main)/`. Payload admin/API use `app/(payload)/` with its own document via `RootLayout`. Root `app/layout.tsx` only returns `children` so those shells are siblings, not nested documents.
* **Verification (operators):** after code changes, run **`npm run verify:next`** from the repo root. For a quick local smoke, **`npm run dev`** on port **3000** and check **`/`** and **`/admin`** (expect **200**).

## Core Features

* **Project Dashboard:** Bento-style view of studio projects. **Sort** (app header on `/dashboard`): **manual** (persisted per-row **`manualRank`**) or **name** / **updated** / **status** via `msc_sortProjectsForDashboard`. **Move up / down** (grid + list) when **Sort: manual**: **admin / master-admin** see controls on every card and may swap with any neighbor; **standard users** only when you **own** the project, and the **adjacent** row must also be yours (shared projects in the way are skipped—server **`msc_moveProjectManual`**). If reorder fails with **`no such column`** on **`payload_locked_documents`**, run **`npm run repair:sqlite`**—that fixes **`payload_locked_documents_rels`** drift, not **`msc_vault_projects`** alone.  
* **Command Center (responsive):** &lt;1024px: **drawer** nav + backdrop (`components/dashboard-sidebar.tsx`, `dashboard-layout.tsx`); **lg+:** collapsible **rail**; **`useIsMobile`** in `lib/msc_hooks.ts` matches the same breakpoint; project **search** in the app header is **lg+** only.  
* **Task Drawer / pulse:** Task workflows and indicators (see `components/MSC-Projectz-TaskPulse.tsx`, `components/task-drawer.tsx`).  
* **Code Manager (`/vault`):** split-pane workspace with Markdown and vault utilities.  
* **Calendar (`/calendar`):** month/week grid of tasks by due date. **Layout (Phase 9.1):** **`grid-cols-1 md:grid-cols-7`**, **`gap-px`** zinc frame; **below `md`** days stack with a **weekday+date** line per row; **from `md`** a **Mon–Sun** header row uses **`hidden md:contents`**. Rows use **`min-h-[150px]`** and **`h-auto`** (no **`1fr`** row stretch). **Day detail:** **`Dialog`** (**`#121212`**) lists all tasks for the tapped day; **cell preview** shows up to **3** tasks plus **`+ N more`** (**`text-zinc-500`**). **Mobile agenda:** an **Agenda** control opens the existing **bottom sheet** (selecting a day no longer auto-opens the sheet). Use **`useIsMaxMd`** where needed. Day cells avoid nested **`<button>`** (see **`CalendarGrid`** / **`MSC-Projectz-Calendar.tsx`** re-export, **`CalendarTaskChip`**).  
* **Clients (`/clients`):** clients collection + route (see `MSC-Projectz-ClientsRouteView`, `MSC-Projectz-ClientDrawer`).  
* **Vault snippets (dashboard):** snippet drawer/viewer, **`MSC-Projectz-VaultSnippets`** Payload collection; snippet form uses **neutral zinc focus** on inputs (see `app/globals.css` + `components/ui/input.tsx` / `textarea.tsx`).
* **Audit Logs (embedded in Settings):** admin-only audit trail section with filterable history/details for sensitive user-management actions.  
* **Credentials & Explorer:** project cards with key popovers; native folder open via Tauri when available.  
* **Member avatars (dashboard):** project-card **`MemberClusterTrigger`** and related surfaces use **`msc_resolveAvatarUrl`** (**`lib/msc_avatar_url.ts`**) and default **`fallbackType="icon"`** (Lucide **`User`** when no photo). Mapper **`msc_mapProjectMember`** normalizes **`avatarUrl`** for vault payloads.  
* **Persistence:** Local **SQLite** via Payload; uploads under **`./media`**.  
* **Theming:** Soft Studio light mode scoped with `.light` / `[data-theme='light']` (see `app/globals.css`, `components/dashboard-layout.tsx`).  
* **Command Center dark canvas:** Gradient class **`msc-cc-route-canvas`** is applied on **`<main>`** in **`dashboard-layout.tsx`** (not on individual route wrappers). If **dark vertical/horizontal gutters** reappear beside the wash, check for **shell `px-*`** on the layout content wrapper or a **second** canvas only on the inner page — authoritative notes live in **`.cursor/docs/msc-cc-command-center-nav-preset.md`**. Command Center UI accent: **`--msc-ui-accent-hex`** / **`msc-ui-accent`** (default cool blue **`#599ede`**) in **`app/globals.css`**.  
* **Tenancy:** Server actions should assert current-user ownership; browser storage must stay user-scoped (see `Agent-Runbook.md`).
* **RBAC UI gate:** Use `RoleGate` (`components/shared/RoleGate.tsx`) for role-scoped rendering. `AdminGate` is deprecated/removed.

## Identity

* **Name:** Jon Beatz  
* **System Name:** Vader  
* **Theme:** Studio Dark / Soft Studio Light  

## Documentation map (read order)

Source of truth: `Docs-Architecture.md` owns this order.

1. **`START-HERE.md`** (this file) — startup contract and operating baseline  
2. **`Session-Snapshots.md`** — latest handoff + start-next checklist  
3. **`Development-Roadmap.md`** — current roadmap and shipped sprint history  
4. **`Agent-Runbook.md`** — runtime guardrails, recovery, coding rules  
5. **`FlightPro.md`** — deploy + packaging + local recovery SOP  
6. **`Spaceship.md`** — host/provider context  
7. **`Deploy-Profile.template.json`**, **`Deploy-Profile.local.example.json`** — non-secret deploy profile contract  
8. **`Deploy-Secrets-Workflow.md`** — encrypted secret handling workflow  
9. **`Restore-Points.md`** — rollback checkpoints  

```
MSC-Projectz
├── .cursor/
│   ├── docs/
│   │   ├── START-HERE.md
│   │   ├── Session-Snapshots.md
│   │   ├── Development-Roadmap.md
│   │   ├── FlightPro.md
│   │   ├── FlightPro-Alt.md
│   │   ├── Deploy-Profile.template.json
│   │   ├── Deploy-Profile.local.example.json
│   │   ├── Deploy-Secrets-Workflow.md
│   │   ├── Spaceship.md
│   │   ├── Agent-Runbook.md
│   │   ├── Restore-Points.md
│   │   ├── archive/
│   │   └── incidents/
│   └── rules/   (operational + Payload + media + deploy)
└── .cursorrules
```
