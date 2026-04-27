# Project Vision: MSC-Projectz (Code Manager Command Center)

## Current Objective

Ship a production-ready **Payload 3** + **Next.js 16** command center (with optional **Tauri 2**), including vault/collab features (e.g. per-project mail settings and admin configuration) on the `feature/collaborative-workspace` line of work.

## Current Restart Point

* **Branch:** `feature/collaborative-workspace` (ahead of `origin/feature/collaborative-workspace` by 1 local commit in a typical sync — verify with `git status`).
* **Remote:** `origin` → `https://github.com/jonbeatz/MSC-Projectz.git`
* **Latest recorded commit (this doc refresh):** `2f91ba5` — *feat(vault): per-project IMAP/SMTP, SMTP helpers, admin settings note*
* **Uncommitted / in-progress:** working tree may include deploy tooling (`msc_package_deploy.mjs`, `server.js`, `unzip.php`, `package:production` script), **Flight** / **FlightPro** docs, media layout rules, and vault UI updates — see `git status` for truth.
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

1. **`START-HERE.md`** (this file)  
2. **`FlightPro.md`** — deploy zip pipeline, `pushitlive`, local recovery, env principles  
3. **`Agent-Runbook.md`** — coding and isolation rules  
4. **`Spaceship.md`** — hosting context  
5. **`Jedi-List.md`** — roadmap checkboxes  
6. **`DeployUpdate.md`**, **`Flight.md`** — short deploy and env checklists  
7. **`ReCall.md`** — session notes  
8. **`Restore-Points.md`** — git restore one-liners  

```
MSC-Projectz
├── .cursor/
│   ├── docs/
│   │   ├── START-HERE.md
│   │   ├── FlightPro.md
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
