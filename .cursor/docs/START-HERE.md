# Project Vision: MSC-Projectz (The Vader Vault)

## Current Objective

Transition the v0 "Vader Protocol" UI into a production-ready desktop application using Tauri 2.0 and Payload 3.0.

## Current Restart Point

* **Branch:** `MSC-Projectz-v2`
* **Remote:** `origin` -> `https://github.com/jonbeatz/MSC-Projectz.git`
* **Latest pushed checkpoint:** `8602e72fb89b09523e87ad12b7c4179a9f262fec` (`Refactor Command Center routes`)
* **Status:** Code changes are committed and pushed. Local working tree has one intentionally uncommitted SQLite backup: `payload.sqlite.bak.2026-04-25T18-38-26-162Z`.
* **Architecture note:** Command Center pages are route-based under `app/(command-center)/` so `/dashboard`, `/profile`, `/settings`, `/help`, and `/tasks` share the same persistent `DashboardLayout`.
* **Verification:** `npm run verify:next` passed; localhost smoke checks returned `200` for `/`, `/dashboard`, `/profile`, `/help`, and `/settings`.

## Core Features

* **Project Dashboard:** Bento Grid view of all studio projects.
* **Task Drawer:** Triple-state task management (To Do, In Progress, Done).
* **Native Actions:** "Open in Explorer" and "Open in Cursor" via Rust shell commands.
* **Persistence:** Local SQLite database for 100% offline functionality.

## Identity

* **Name:** Jon Beatz
* **System Name:** Vader
* **Theme:** Studio Dark (#121212) / Studio Light (#FFFFFF)



/MSC-Projectz

&#x20; ├── .cursor/

&#x20; │   ├── docs/

&#x20; │   │   ├── START-HERE.md

&#x20; │   │   ├── Spaceship.md

&#x20; │   │   ├── Jedi-List.md

&#x20; │   │   └── Agent-Runbook.md

&#x20; │   └── rules/

&#x20; │       ├── deploy-safety-spaceship.mdc

&#x20; │       ├── docs-checkpoint-governance.mdc

&#x20; │       ├── jon-operator-cpanel.mdc

&#x20; │       ├── local-runtime-recovery.mdc

&#x20; │       ├── nova-divi-conventions.mdc

&#x20; │       └── payload-blocks-first.mdc

&#x20; └── .cursorrules

