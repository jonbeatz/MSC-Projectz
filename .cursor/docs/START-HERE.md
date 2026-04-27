# Project Vision: MSC-Projectz (Code Manager Command Center)

## Start / Continue Here

Use this quick flow at the beginning of every session:

1. Confirm branch and working tree: `git branch --show-current` and `git status -sb`.
2. Re-read docs in order (below), starting with this file and `MasterSetUp.md`.
3. Confirm script truth in `package.json` before using any command alias.
4. For runtime edits (`app/`, `components/`, `lib/`, `collections/`, config), run build gate before closeout:
   - `npm run verify:next`
5. Ensure local dev is healthy on port `3000`:
   - `npm run dev`
   - smoke test `/` and `/admin` on `http://127.0.0.1:3000`
6. Read latest handoff in `Session-Snapshots.md` and continue from its "Start-next checklist".

If localhost is broken, follow recovery in `FlightPro.md` and `Agent-Runbook.md`.

### Daily quick commands

- Context: `git branch --show-current && git status -sb`
- Build gate (runtime edits): `npm run verify:next`
- Dev server: `npm run dev`
- Smoke: `http://127.0.0.1:3000/` and `http://127.0.0.1:3000/admin`
- Release package: `npm run pushitlive`

### Operator handshake triggers ("Ok Jon")

At recognized workflow starts, first status line should be:

- `Ok Jon - <recognized command>. <one-line action plan>.`

Use once at flow start to confirm context/docs were read, then continue normally.

Recognized triggers:
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

Ship a production-ready **Payload 3** + **Next.js 16** command center (with optional **Tauri 2**), including vault/collab features (e.g. per-project mail settings and admin configuration) on the `feature/collaborative-workspace` line of work.

## Current Restart Point

* **Branch:** `MSC-Projectz-Pro-Live-v1`
* **Remote:** `origin` → `https://github.com/jonbeatz/MSC-Projectz.git`
* **Latest recorded commit (this doc refresh):** `f17b08f` — *docs(deploy): FlightPro/Alt, deploy pipeline, recovery; feat: vault mail, server.js, msc_package_deploy*
* **Working-state note:** docs were expanded for start/continue workflow, snapshots, and closeout. Always trust `git status -sb` as the live state.
* **Architecture:** Command Center routes live under `app/(command-center)/` so `/dashboard`, `/profile`, `/settings`, `/help`, `/tasks`, and `/vault` share a persistent dashboard shell.
* **Verification (operators):** after code changes, run **`npm run verify:next`** from the repo root. For a quick local smoke, **`npm run dev`** on port **3000** and check **`/`** and **`/admin`** (expect **200**).

## Core Features

* **Project Dashboard:** Bento-style view of studio projects.  
* **Task Drawer / pulse:** Task workflows and indicators (see `components/MSC-Projectz-TaskPulse.tsx`, `components/task-drawer.tsx`).  
* **Code Manager (`/vault`):** split-pane workspace with Markdown and vault utilities.  
* **Credentials & Explorer:** project cards with key popovers; native folder open via Tauri when available.  
* **Persistence:** Local **SQLite** via Payload; uploads under **`./media`**.  
* **Theming:** Soft Studio light mode scoped with `.light` / `[data-theme='light']` (see `app/globals.css`, `components/dashboard-layout.tsx`).  
* **Tenancy:** Server actions should assert current-user ownership; browser storage must stay user-scoped (see `Agent-Runbook.md`).

## Identity

* **Name:** Jon Beatz  
* **System Name:** Vader  
* **Theme:** Studio Dark / Soft Studio Light  

## Documentation map (read order)

1. **`Project-Truth.md`** — one-file AI onboarding truth (mission, stack, workflow, command/deploy context)  
2. **`START-HERE.md`** (this file)  
3. **`MasterSetUp.md`** — master setup/deploy/context schema for any project  
4. **`Session-Snapshots.md`** — latest handoff snapshot and start-next checklist  
5. **`FlightPro.md`** — deploy zip pipeline, `pushitlive`, local recovery, env principles  
6. **`Agent-Runbook.md`** — coding and isolation rules  
7. **`Spaceship.md`** — hosting context  
8. **`Jedi-List.md`** — roadmap checkboxes  
9. **`DeployUpdate.md`**, **`Flight.md`** — short deploy/env checklists  
10. **`FlightPro-Alt.md`** — advanced troubleshooting appendix (use when standard `FlightPro` flow fails)  
11. **`ReCall.md`** — session notes  
12. **`Restore-Points.md`** — git restore one-liners  

```
MSC-Projectz
├── .cursor/
│   ├── docs/
│   │   ├── Project-Truth.md
│   │   ├── START-HERE.md
│   │   ├── MasterSetUp.md
│   │   ├── Session-Snapshots.md
│   │   ├── FlightPro.md
│   │   ├── FlightPro-Alt.md
│   │   ├── Flight.md
│   │   ├── DeployUpdate.md
│   │   ├── Spaceship.md
│   │   ├── Jedi-List.md
│   │   ├── Agent-Runbook.md
│   │   ├── Restore-Points.md
│   │   └── ReCall.md
│   └── rules/   (operational + Payload + media + deploy)
└── .cursorrules
```
