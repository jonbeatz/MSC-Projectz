# Agent-Runbook: Standard Operating Procedures

## Error Recovery
If the local environment fails to boot:
1. Run `npm run dev:recover`.
2. Wait for the "Ready" signal in the terminal.
3. Smoke test `http://localhost:3000`.

## Current Local Routes
- `/dashboard` - project dashboard.
- `/profile` - authenticated user profile and security settings.
- `/settings` - admin-only system settings and user management.
- `/help` - help and documentation.
- `/tasks` - global task view.
- `/vault` - Code Manager snippet workspace.

All routes above share the Command Center shell in `app/(command-center)/layout.tsx`, so sidebar/header behavior should be debugged in `components/MSC-Projectz-CommandCenterShell.tsx`, `components/dashboard-layout.tsx`, and `components/dashboard-sidebar.tsx`.

## Coding Style
- Always use `msc_` prefix for new logic.
- Prefer modular components in the `/components/msc-projectz/` directory.
- Use Lucide-React for all icons.

## Theme Logic
- Never hardcode hex values in components. Use theme-aware utilities backed by `--background`, `--surface`, `--text`, `--card`, and related variables.
- Soft Studio light mode is scoped to `.light` and `[data-theme='light']` in `app/globals.css`. Do not modify `:root` or dark defaults when tuning light mode.
- The runtime theme switch in `components/dashboard-layout.tsx` sets both the `light` / `dark` class and `data-theme`.

## Tenant Isolation
- Runtime vault server actions must assert the current Payload user owns a project before project/task writes. Use the ownership helpers in `lib/msc_vault_server_actions.ts` as the pattern.
- Browser-only vault data must use `msc_getScopedKey()` from `lib/msc_scoped_storage.ts`; do not add global snippet, credential, or project-cache localStorage keys.
- Do not re-enable legacy global project migration from `msc-projectz-storage`; it is disabled to prevent one user's browser cache from being imported into another tenant.

## Profile Avatars
- Profile image selection uploads to Payload `media` first, then `Save Profile` writes the returned media ID to the current `users.avatar` relationship.
- Client save logging should show `avatar` as a media ID, not a `blob:` URL, local path, or raw data URL.
- After a successful profile save, update Zustand from the server-returned user object instead of assuming local form state is the source of truth.