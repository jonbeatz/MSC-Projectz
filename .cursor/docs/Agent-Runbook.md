# Agent-Runbook: Standard Operating Procedures

## Operator handshake ("Ok Jon")

For recognized workflow trigger points (start, continue, deploy, verify, checkpoint, finish), begin the first status message with:

- `Ok Jon - <recognized command>. <one-line action plan>.`

Use it once at flow start, then continue with normal concise updates. This confirms context/doc-read state before execution.

Suggested triggers:
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

## Error recovery (local — port 3000)

This repository’s **`package.json`** may **not** define `dev:recover` / `dev:fresh` / `verify:next:safe`. If a one-liner is missing, use the **manual** sequence (Windows):

1. Find PID: `netstat -ano | findstr ":3000"` (note **LISTENING** PID on **3000**).  
2. Stop it: `taskkill /PID <pid> /F`  
3. `npm run clean:next`  
4. `npm run dev` — wait for **Local:** / **Ready** in the terminal.  
5. Open `http://127.0.0.1:3000/` and `http://127.0.0.1:3000/admin` (expect **200**).

**Build gate (after code edits):** `npm run verify:next` from repo root until it exits with code **0**. **Do not** run `verify:next` or `clean:next` while `next dev` is still running on 3000 — it will delete **`.next`** and break the dev server; stop dev first.

Longer playbooks in **`.cursor/rules/local-runtime-recovery.mdc`** may name scripts that are not wired in this repo; fall back to this section + **`FlightPro.md` §2. Use **`FlightPro-Alt.md`** only for advanced edge cases (`sharp`, ownership, WSL/OOM escalation).

## Session closeout checklist (one-command style)

At the end of every session, update `Session-Snapshots.md` (newest entry at top) with:

1. Session state: branch, commit (or uncommitted), tree clean/dirty, localhost up/down.
2. What was done: 3-7 bullets.
3. Where changed: high-value files touched.
4. Validation: build gate/smoke/deploy outcomes.
5. Start-next checklist: exact first commands and first file/task.
6. Open risks/blockers.

Closeout command phrase (operator shorthand):
- `Lets Finish` -> update `Session-Snapshots.md`, then summarize final next-start steps.

## Current local routes

- `/dashboard` — project dashboard.  
- `/profile` — authenticated user profile and security.  
- `/settings` — admin system settings and user management.  
- `/help` — help.  
- `/tasks` — global task view.  
- `/vault` — Code Manager / vault workspace.  

Shared shell: `app/(command-center)/layout.tsx`, `components/MSC-Projectz-CommandCenterShell.tsx`, `components/dashboard-layout.tsx`, `components/dashboard-sidebar.tsx`.

## Coding style

* Use **`msc_`** prefix for new project-specific logic.  
* Prefer clear locations under `components/` (existing conventions over deep one-off trees).  
* **Lucide** for icons.

## Theme logic

* Do not hardcode raw hex; use theme tokens (`--background`, `--surface`, `--text`, etc.).  
* Soft Studio light: `.light` and `[data-theme='light']` in `app/globals.css` — do not clobber default `:root` dark values when tuning light.  
* `components/dashboard-layout.tsx` should keep `class` + `data-theme` in sync on the root.

## Tenant isolation

* Vault server actions: assert Payload user context and ownership; follow patterns in `lib/msc_vault_server_actions.ts`.  
* Browser-only data: use **`msc_getScopedKey()`** from `lib/msc_scoped_storage.ts` — no global project/snippet/credential keys.  
* Legacy global project migration from `msc-projectz-storage` stays **disabled** for tenant safety.

## Profile avatars

* Upload to Payload `media` first; persist **`users.avatar`** as a media id from the server response — not a `blob:` URL.  
* After save, prefer Zustand (or client state) updates from the **server-returned** user object.
