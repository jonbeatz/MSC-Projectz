# ReCall

## 2026-04-25 Session Resume Notes

Start on branch `MSC-Projectz-v4`. The GitHub remote is `https://github.com/jonbeatz/MSC-Projectz.git`. The latest local commit is `aa764ba` (`Refine project card bridge and auth diagnostics`), and the branch is currently ahead of `origin/MSC-Projectz-v4` by one commit.

Current app shape:

- Command Center is route-based under `app/(command-center)/`.
- `/dashboard`, `/profile`, `/settings`, `/help`, `/tasks`, and `/vault` share `components/MSC-Projectz-CommandCenterShell.tsx`, which wraps `DashboardLayout`.
- `components/dashboard-sidebar.tsx` uses `usePathname()` for active navigation.
- `/settings` is admin-only and guarded server-side with `msc_getVaultLocalApiContext()` plus `msc_vaultIsPayloadAdmin()`.
- `/profile` is available to authenticated users and contains personal profile/security controls.
- The old monolithic `components/settings-view.tsx` and legacy `components/dashboard.tsx` wrapper were removed.
- `/vault` is now branded as Code Manager and uses a localStorage-backed split-pane snippet workflow.
- Project cards own Explorer behavior: the Explorer action opens the project `localPath` through the Tauri `open_folder` command and copies the path as a fallback.
- Project cards also own credential management through compact Key popovers with dynamic credentials, password masking, copy buttons, deletion, and inline creation.
- Auth diagnostics were added around project load/create flows. Authentication-required failures now purge stale client session state instead of silently wiping project state.
- Soft Studio light mode is scoped to `.light` and `[data-theme='light']` variables. The app sets `document.documentElement.dataset.theme` alongside the existing `light` / `dark` classes.
- Multi-tenancy hardening: runtime project reads are scoped to the current Payload user, project/task mutations assert current-user ownership before writes, and legacy global project-cache migration is disabled.
- Browser storage hardening: Code Manager snippets use `msc-projectz-vault-snippets_<payloadUserId>` and project-card credential popovers use `msc-projectz-credentials-<projectId>_<payloadUserId>`.
- Profile avatar persistence: `users` now has `username` and `avatar` fields; `media` has an `owner` relationship; profile uploads create Payload media and `Save Profile` stores `avatar: mediaId` on the current user.
- Profile save diagnostics: client logs `PROFILE_SAVE: sending payload`; server logs upload result and received profile update payload.

Verification from the checkpoint:

- `npm run verify:next` passed after the avatar persistence update.
- Local dev was restarted on port `3000`.
- Smoke checks returned `200` for `/` and `/admin`.

Known local-only file:

- `payload.sqlite.bak.2026-04-25T18-38-26-162Z` is intentionally uncommitted.
