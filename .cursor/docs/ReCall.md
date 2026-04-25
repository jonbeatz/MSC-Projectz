# ReCall

## 2026-04-25 Session Resume Notes

Start on branch `MSC-Projectz-v2`. The GitHub remote is `https://github.com/jonbeatz/MSC-Projectz.git`, and the latest pushed checkpoint is `8602e72fb89b09523e87ad12b7c4179a9f262fec` (`Refactor Command Center routes`).

Current app shape:

- Command Center is route-based under `app/(command-center)/`.
- `/dashboard`, `/profile`, `/settings`, `/help`, and `/tasks` share `components/MSC-Projectz-CommandCenterShell.tsx`, which wraps `DashboardLayout`.
- `components/dashboard-sidebar.tsx` uses `usePathname()` for active navigation.
- `/settings` is admin-only and guarded server-side with `msc_getVaultLocalApiContext()` plus `msc_vaultIsPayloadAdmin()`.
- `/profile` is available to authenticated users and contains personal profile/security controls.
- The old monolithic `components/settings-view.tsx` and legacy `components/dashboard.tsx` wrapper were removed.

Verification from the checkpoint:

- `npm run verify:next` passed.
- Local dev was restarted on port `3000`.
- Smoke checks returned `200` for `/`, `/dashboard`, `/profile`, `/help`, and `/settings`.

Known local-only file:

- `payload.sqlite.bak.2026-04-25T18-38-26-162Z` is intentionally uncommitted.
