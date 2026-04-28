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

### Startup docs refresh rule (required)

When operator says `Ready to begin`, run a fresh docs-read pass before coding:

1. Re-read `START-HERE.md` first.
2. Continue through the full docs sequence defined there (documentation map order).
3. Confirm completion in the startup checklist response before execution.

Apply this even if the assistant already read docs earlier that day, unless operator explicitly says to skip docs refresh.

## Error recovery (local — port 3000)

This repository’s **`package.json`** may **not** define `dev:recover` / `dev:fresh` / `verify:next:safe`. If a one-liner is missing, use the **manual** sequence (Windows):

1. Find PID: `netstat -ano | findstr ":3000"` (note **LISTENING** PID on **3000**).  
2. Stop it: `taskkill /PID <pid> /F`  
3. `npm run clean:next`  
4. `npm run dev` — wait for **Local:** / **Ready** in the terminal.  
5. Open `http://127.0.0.1:3000/` and `http://127.0.0.1:3000/admin` (expect **200**).

**Build gate (after code edits):** `npm run verify:next` from repo root until it exits with code **0**. **Do not** run `verify:next` or `clean:next` while `next dev` is still running on 3000 — it will delete **`.next`** and break the dev server; stop dev first.

Longer playbooks in **`.cursor/rules/local-runtime-recovery.mdc`** may name scripts that are not wired in this repo; fall back to this section + **`FlightPro.md` §2. Use **`FlightPro-Alt.md`** only for advanced edge cases (`sharp`, ownership, WSL/OOM escalation).

## Payload admin guardrail (`/admin` / `/admin/login`)

If local admin crashes with errors like `Cannot destructure property 'config' ... undefined` (often surfaced from `@payloadcms/ui` / `CodeEditor`), check route-group wiring **first**:

1. `app/(payload)/layout.tsx` must use `RootLayout` from `@payloadcms/next/layouts`.
2. Layout must pass `config` and `importMap` to `RootLayout`.
3. Layout must provide `serverFunction` via `handleServerFunctions({ ...args, config, importMap })`.
4. After admin config/component changes, run `npm run generate:importmap`.
5. Verify with `npm run verify:next`, then `npm run dev`, then smoke:
   - `http://127.0.0.1:3000/`
   - `http://127.0.0.1:3000/admin`
   - optional auth check: invalid `POST /api/users/login` should return `401`, not `500`.

Do not treat dependency pinning/import-map refresh alone as sufficient if the `(payload)` layout provider pattern is missing.

## Email verification: rate limits and funnel logs

- **Resend** (`app/actions/resend-verification.ts`): per-account cooldown unchanged; **per-IP** sliding window (default **20** sends / **60m**, env `MSC_IP_RESEND_MAX`, `MSC_IP_RESEND_WINDOW_MS`).
- **Register** (`lib/msc_auth_actions.ts`): per-IP cap on **each valid form submit** including duplicate-email paths (default **25** / **60m**, `MSC_IP_REGISTER_ATTEMPT_MAX`, `MSC_IP_REGISTER_ATTEMPT_WINDOW_MS`) so addresses cannot be probed endlessly.
- **Telemetry:** JSON lines prefixed `[msc:verification]` with `kind` (e.g. `resend_sent`, `register_ip_limited`, `verify_token_ok`) and **`ipHash`** (short SHA, not raw IP). For production log shipping, filter that prefix in your host or APM.
- **Local:** set `MSC_VERIFICATION_DISABLE_IP_RATE_LIMIT=true` to turn off IP windows (in-process only; not for multi-replica without a shared store).

## Local SQLite: `*gate-user*@msc.local` test users

- These are **optional local audit users** (e.g. verified vs unverified, cross-tenant checks). They are **not** the dev trust-bypass path — that is **`DEV_BYPASS_ENABLED` + the dev bypass cookie** (see `middleware.ts`, `app/actions/dev-trust-bypass.ts`).
- If `gate-user-*.@msc.local` rows appear in **Settings → Users** and you no longer need them, run **`npm run db:prune-gate-users`** from the repo root. The script **backs up** `payload.sqlite` once when it will delete at least one matching user, then removes dependent rows (vault, media, sessions, payload rels) and the user record.
- For schema repair only, use **`npm run repair:sqlite`** (see `FlightPro.md`). If **`payload.update`** fails with **`payload_locked_documents`** / **`no such column …_id`**, that table needs the new FK column—**`repair:sqlite`** covers the evolving list in **`msc_sqlite_repair_vault_schema.mjs`**.

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

Shared shell: `app/(main)/(command-center)/layout.tsx`, `components/MSC-Projectz-CommandCenterShell.tsx`, `components/dashboard-layout.tsx`, `components/dashboard-sidebar.tsx`. Do not wrap Payload `RootLayout` inside the `(main)` `<body>`; root `app/layout.tsx` must remain a pass-through between `(main)` and `(payload)` route groups.

## Playwright browser workflow (safe with normal Brave)

- Automation uses a dedicated persistent profile: `Playwright-Tests/brave-profile` (separate from your daily Brave profile).
- Default test behavior should **not** kill all Brave windows. Keep `MSC_KILL_BRAVE_MODE` unset (or `none`).
- Use global kill only when explicitly needed for recovery:
  - `MSC_KILL_BRAVE_MODE=all npm run playwright:test`
- If the Playwright profile is already open, `npm run playwright:test` should attach to the existing CDP session (`Playwright-Tests/session.json`) instead of relaunching/failing.
- You can stay logged in simultaneously in both profiles (Playwright + normal Brave); session cookies are isolated per profile.

## Plan file location rule

- Default project plan folder: `D:\Cursor_Projectz\MSC-Projectz\.cursor\plans`.
- Treat that folder as source of truth for this repo’s plans.
- If a plan is emitted to `C:\Users\JONBEATZ\.cursor\plans`, copy/move it into `D:\Cursor_Projectz\MSC-Projectz\.cursor\plans` before session closeout.

## Overlay / modal pattern (Command Center)

- Prefer **overlay-first workspace** on `/dashboard`: project-card click opens the Focus workspace drawer directly.
- Keep the project grid as the stable base layer; do not reintroduce inline split-pane workspace panels.
- For secondary actions inside Focus (for example Add Snippet, Client Info), use **centered dialogs** over the Focus drawer instead of drawer-on-drawer.
- Maintain a strict layer model:
  - Layer 1: Dashboard grid
  - Layer 2: Focus workspace drawer
  - Layer 3: Centered modal dialogs
- Keep close behavior predictable: dialog close returns to Focus; Focus close returns to dashboard.

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

## Profile avatars & member clusters

* Upload to Payload `media` first; persist **`users.avatar`** as a media id from the server response — not a `blob:` URL.  
* After save, prefer Zustand (or client state) updates from the **server-returned** user object.

### Avatar URL resolution (Sprint 8)

* Use **`msc_resolveAvatarUrl`** from **`lib/msc_avatar_url.ts`** anywhere you need a display URL from Payload-shaped data (`avatar` string URL, populated media **`{ url }`**, or **`avatarUrl`**). Do **not** assume **`member.avatarUrl || member.avatar`** in UI — raw **`avatar`** may be a media object.  
* **`msc_mapProjectMember`** (**`lib/msc_map_vault.ts`**) resolves once for vault projects/tasks; mapped **`MscProjectMember`** ships **`avatarUrl`** for photos and does **not** pass raw media blobs for `<img>`.  
* **No client-side fetch** for media by numeric id only — if no URL is available, the resolver returns **`null`** and components show the fallback.  
* Profile mapping reuses the same resolver via **`msc_avatarUrlFromDoc`** in **`lib/msc_profile_server_actions.ts`**.

### Member cluster UI (`MemberClusterTrigger`)

* **`fallbackType`**: **`'icon'`** (default, Soft Studio) shows Lucide **`User`** inside the same circular shell as initials would use; **`'initials'`** opt-in per instance. Do **not** mix fallback styles within one cluster.  
* **`strokeWidth`** matches dashboard icons (**1.5**); inner **`p-1`** keeps the glyph off the ring.
