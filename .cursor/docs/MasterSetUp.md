# MasterSetUp.md

Portable master setup, deploy, and context schema you can reuse across all projects.

Use this as your one-page operating system:
- Copy sections into new repos.
- Keep names/commands synced to each repo's `package.json`.
- Keep Local vs Live responsibilities explicit.

---

## 1) Core Operating Rules (Always Apply)

1. **Source of truth order**
   - `START-HERE.md`
   - `Agent-Runbook.md`
   - Host/deploy doc (for example `Spaceship.md`)
   - Command roadmap (for example `Jedi-List.md`)
   - Checkpoint logs (`ReCall.md`, `Restore-Points.md`)
2. **Command sync discipline**
   - Docs must match real script names in `package.json`.
   - Never document scripts that do not exist.
3. **Locality tags on every command**
   - `Local (Cursor / PC repo root)` for build, git, local dev.
   - `Live (cPanel -> Terminal)` for host-only actions.
4. **Media storage standard**
   - Store uploads/generated assets under project-root `./media`.
   - Avoid absolute host paths for media.
5. **Verification before done**
   - For runtime code changes, run project build gate (`verify:next` equivalent).
   - Restore local dev URL and smoke key routes.

---

## 2) Universal Project Context Schema (Copy/Paste)

Use this block at the top of each project doc:

```yaml
project_context:
  name: "<Project Name>"
  repository: "<git url>"
  branch_strategy:
    main: "<main or trunk>"
    working_branch: "<feature/...>"
  stack:
    frontend: "<Next.js/React/etc>"
    backend: "<Payload/Node/etc>"
    database: "<SQLite/Postgres/etc>"
  environments:
    local:
      label: "Local (Cursor / PC repo root)"
      base_url: "http://127.0.0.1:3000"
    live:
      label: "Live (cPanel -> Terminal)"
      base_url: "https://example.com"
  build_gate:
    command: "<npm run verify:next or equivalent>"
    smoke_urls:
      - "/"
      - "/admin"
  deploy_method:
    artifact: "<zip/.next/image>"
    local_command: "<npm run pushitlive or equivalent>"
    live_restart: "<host panel restart action>"
  critical_files:
    - ".env"
    - "package.json"
    - "server.js"
  recovery:
    primary: "<dev recover command>"
    fallback_manual:
      - "free dev port"
      - "clear stale build cache"
      - "restart dev"
      - "smoke test URLs"
```

---

## 3) New Project Setup Checklist

Use this checklist whenever bootstrapping a new repo:

- [ ] Create docs baseline:
  - [ ] `START-HERE.md`
  - [ ] `Agent-Runbook.md`
  - [ ] host/deploy doc (`Spaceship.md` or equivalent)
  - [ ] command doc (`Jedi-List.md` or equivalent)
  - [ ] `Restore-Points.md`
- [ ] Define script contracts in `package.json`:
  - [ ] `dev`
  - [ ] `build`
  - [ ] `start`
  - [ ] build gate (`verify:*`)
  - [ ] deploy command (`pushitlive` equivalent)
- [ ] Define env model:
  - [ ] `.env.example` with placeholders only
  - [ ] no real secrets committed
- [ ] Add media rule:
  - [ ] project-root `./media` storage
  - [ ] upload adapter uses `staticDir: 'media'` if applicable
- [ ] Add recovery playbook:
  - [ ] port conflict resolution
  - [ ] stale build cache reset
  - [ ] smoke URL checks
- [ ] Add checkpoint format in `Restore-Points.md`

---

## 4) Deploy Schema (Reusable)

### A. Preflight (Local)

`Local (Cursor / PC repo root)`

1. Pull latest branch and review `git status`.
2. Run build gate (`verify:*` command).
3. Build deploy artifact (`pushitlive` equivalent).
4. Confirm artifact contains required runtime files.

### B. Release transfer

`Local (Cursor / PC repo root)`

1. Upload full release artifact (not random partial chunks).
2. Retry failed uploads before restart.

### C. Server activation

`Live (cPanel -> Terminal)` and/or `Live (cPanel)`

1. Install deps if lock/dependencies changed.
2. Restart app via Node app manager.
3. Validate live routes in private/incognito session.

### D. Post-deploy report template

```md
Deploy Summary
- Artifact: <name + timestamp>
- Upload: <success/failures + retries>
- Restart: <done/not done>
- Smoke: <url -> status>
- Follow-up: <none or next action>
```

---

## 5) Recovery Schema (Local Runtime)

Use this when localhost is broken, white screen appears, or port is down.

`Local (Cursor / PC repo root)`

1. Check who owns the dev port (`3000` by default).
2. Stop stale process(es).
3. Clear stale build output (safe cache clean).
4. Start dev server once.
5. Smoke test:
   - `http://127.0.0.1:3000/`
   - `http://127.0.0.1:3000/admin`
6. If still failing:
   - run full repair script (if defined),
   - otherwise run clean build + dev + smoke.

Rule of thumb:
- Never only list these steps; execute and report statuses.
- Prefer `127.0.0.1` first when `localhost` is flaky.

---

## 6) Docs Governance Schema (Low Drift)

When docs are updated:

1. Sync script references to real `package.json`.
2. Keep one source for each process (no duplicate SOPs).
3. Update only the core docs unless a deep doc is required.
4. For incidents, record:
   - symptom,
   - root cause,
   - shortest verified recovery path.
5. Add/update one restore point after meaningful milestones.

---

## 7) Checkpoint + Branch Cut Schema

### Restore row template

```md
| RP-YYYY-MM-DD-short-name | YYYY-MM-DD | What worked. Branch/commit: <branch>@<sha>. Restore: <exact commands>. Caveats: <env/deps/host notes>. |
```

### Branch cut flow

1. Confirm working tree status.
2. Create branch from current HEAD.
3. Push with upstream tracking.
4. Record branch + SHA in docs checkpoint.

---

## 8) Skills Matrix (Use These On Purpose)

For Cursor skill-based workflows, this is the minimum practical set:

- **Workflow-Ops**
  - Trigger-driven operating routine (start, continue, deploy, finish).
  - Adds operator handshake and confirmation gates.
- **Deploy-FTP-Node**
  - Keeps local upload vs server restart roles separated.
  - Enforces safe deploy sequencing.
- **Checkpoint-Restore**
  - Standard rollback records and branch cut discipline.
- **Docs-Governance**
  - Prevents doc drift, enforces source order, keeps command docs honest.

Project-specific skill families (activate only when relevant):
- Nova / NovaMira Design for WordPress/Divi convention work.
- Payload-focused rules for blocks-first admin schema work.

---

## 9) Naming and Architecture Conventions (Default)

Adopt these defaults unless project rules override:

- Prefix custom project symbols with a stable namespace (for example `msc_`).
- Keep component and file naming predictable and searchable.
- Avoid hardcoded theme colors in component code; use tokens/variables.
- Prefer modular files over giant mixed-responsibility components.

---

## 10) Master Prompt Snippets (Fast Reuse)

### A) Setup intent

```text
Ready to begin. Use MasterSetUp schema:
1) verify scripts vs package.json
2) confirm local dev + smoke URLs
3) run build gate
4) prepare deploy artifact
5) summarize Local vs Live commands
```

### B) Deploy intent

```text
Lets Push It Live (Safe):
- run local preflight + build gate
- package artifact
- provide upload summary
- give exact Live restart step
- return smoke checklist
```

### C) Recovery intent

```text
Postflight local:
- restore localhost on 3000
- verify / and /admin
- report HTTP status codes
```

---

## 11) Project-Specific Notes (MSC-Projectz Defaults)

If using this in MSC-Projectz right now:

- Primary deploy command: `npm run pushitlive`.
- Packaging script: `msc_package_deploy.mjs`.
- Artifact: `final_deploy.zip`.
- Key docs: `FlightPro.md` + `FlightPro-Alt.md`.
- Media policy: project-root `media/`.
- Build gate: `npm run verify:next` (respect safe usage around active dev server).

---

## 12) Maintenance Cadence

Keep this file useful with a short cadence:

- After script changes: update Sections 3, 4, 11.
- After incident fix: update Sections 5 and 6, plus `Restore-Points.md`.
- After deploy flow change: update Section 4 first, then project-specific docs.

If this file and project docs conflict, project `START-HERE.md` wins.

---

## 13) Session Snapshot Protocol (Recommended)

To maintain continuity across chats and days:

1. Keep a dedicated `Session-Snapshots.md` in the docs folder.
2. Add one entry at session end with:
   - what changed,
   - key files touched,
   - branch + commit,
   - validation status,
   - exact first steps for next startup.
3. Put newest snapshot at the top.
4. At next start, read the latest snapshot before editing code.

---

## 14) Code Hints + Fix Patterns (Reusable)

Use these as default engineering hints during implementation:

### Code hints

- Prefer small focused edits over broad rewrites.
- For runtime features, keep data ownership and auth checks server-side.
- Keep local-storage/browser state scoped per user/project where applicable.
- Use naming prefixes consistently (for this repo, `msc_` conventions).
- For docs-backed commands, verify real script names in `package.json` first.

### Fix patterns (common)

1. **Localhost broken / port conflict**
   - free port -> clear stale build output -> restart dev -> smoke `/` + `/admin`.
2. **Build mismatch after long session**
   - run build gate (`verify:*` equivalent) and fix forward until green.
3. **Linux native module mismatch**
   - reinstall or rebuild modules on Linux host/WSL; do not trust Windows binaries.
4. **Deploy drift**
   - compare deploy doc commands to `package.json` and packaging script immediately.
5. **Doc drift**
   - update `START-HERE.md`, runbook, and snapshot in the same pass.

---

## 15) Golden Workflow (Start -> Build -> Save Point -> Close)

1. **Start**
   - run context commands (`git branch --show-current`, `git status -sb`)
   - read latest snapshot + top docs.
2. **Implement**
   - make scoped changes with clear intent.
3. **Validate**
   - run build gate for runtime edits; run smoke checks as needed.
4. **Save point**
   - update `Restore-Points.md` for meaningful milestones.
5. **Close**
   - append `Session-Snapshots.md` entry with exact start-next steps.
