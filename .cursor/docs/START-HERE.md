# Project Vision: MSC-Projectz (Code Manager Command Center)

## Current Objective

Transition the v0 "Vader Protocol" UI into a production-ready desktop application using Tauri 2.0 and Payload 3.0.

## Current Restart Point

* **Branch:** `MSC-Projectz-v4`
* **Remote:** `origin` -> `https://github.com/jonbeatz/MSC-Projectz.git`
* **Latest local commit:** `aa764ba` (`Refine project card bridge and auth diagnostics`). Branch is currently ahead of `origin/MSC-Projectz-v4` by one commit.
* **Status:** Current working tree contains uncommitted UI, multi-tenancy, avatar persistence, and docs updates. Local working tree also has one intentionally uncommitted SQLite backup: `payload.sqlite.bak.2026-04-25T18-38-26-162Z`.
* **Architecture note:** Command Center pages are route-based under `app/(command-center)/` so `/dashboard`, `/profile`, `/settings`, `/help`, `/tasks`, and `/vault` share the same persistent `DashboardLayout`.
* **Verification:** `npm run verify:next` passed after the avatar persistence update. Local dev is running on `http://localhost:3000`; smoke checks returned `200` for `/` and `/admin`.

## Core Features

* **Project Dashboard:** Bento Grid view of all studio projects.
* **Task Drawer:** Triple-state task management (To Do, In Progress, Done).
* **Code Manager:** `/vault` route now uses the shared Command Center shell and a localStorage-backed split-pane snippet manager.
* **Project Credentials:** Each project card has a compact key popover with dynamic credential rows, password masking, copy actions, deletion, and inline "New +" entry.
* **Native Actions:** Project card Explorer actions call the Tauri `open_folder` command and copy the project path as a fallback.
* **Persistence:** Local SQLite database for 100% offline functionality.
* **Soft Studio Light Mode:** Light theme is scoped through `.light` and `[data-theme='light']` variables using Soft Studio neutrals and Studio Green accent.
* **Tenant Isolation:** Runtime project/task server actions assert ownership against the current Payload user; Code Manager snippets and project-card credential popovers use user-scoped browser storage keys.
* **Profile Avatars:** Profile avatar uploads now create tenant-owned Payload `media` documents and save the resulting media ID on the current user record.

## Identity

* **Name:** Jon Beatz
* **System Name:** Vader
* **Theme:** Studio Dark / Soft Studio Light



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

