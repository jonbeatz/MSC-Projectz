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

All routes above share the Command Center shell in `app/(command-center)/layout.tsx`, so sidebar/header behavior should be debugged in `components/MSC-Projectz-CommandCenterShell.tsx`, `components/dashboard-layout.tsx`, and `components/dashboard-sidebar.tsx`.

## Coding Style
- Always use `msc_` prefix for new logic.
- Prefer modular components in the `/components/msc-projectz/` directory.
- Use Lucide-React for all icons.

## Theme Logic
- Never hardcode hex values. Use `--background`, `--surface`, and `--card` variables.