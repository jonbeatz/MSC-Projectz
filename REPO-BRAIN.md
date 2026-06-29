# MSC-Projectz — REPO-BRAIN.md

## How This Project Was Built

### Origin

MSC-Projectz started as a production Next.js + Payload CMS command center for MyStudioChannel. It replaced a fragmented set of Google Sheets, local notes, and ad-hoc tracking with a single unified vault.

### Key Milestones

1. **Initial scaffold** — Next.js App Router + Payload CMS + SQLite
2. **Vault system** — Projects, tasks, credentials, and email settings per project
3. **Calendar** — Aggregated task calendar with drag-and-drop scheduling
4. **Clients** — Client CRM with Payload collection
5. **Auth flow** — Payload `users` + email verification + SMTP (Spacemail)
6. **Tauri desktop** — Native wrapper via Tauri v2
7. **Deploy pipeline** — FTPS upload + custom Node server for cPanel

### Technical Decisions

- **SQLite over PostgreSQL** — Single-server deploy simplicity. No external DB service needed.
- **Zustand over Redux** — Lighter weight, built-in `persist` middleware for localStorage hydration.
- **Server Actions over API routes** — Modern Next.js pattern, direct Payload integration.
- **Route group split** — `(main)` vs `(payload)` — necessary because each needs its own `<html>` document.
- **shadcn/ui** — Consistent component primitives with Tailwind theming.

### Architecture Diagram

```
app/
├── (main)/          ← Command Center (dashboard, vault, calendar, clients)
├── (payload)/       ← Payload CMS (admin panel, API, GraphQL)
├── middleware.ts    ← Auth trust gate
├── globals.css      ← Theme system (dark/light + MSC tokens)
└── actions/         ← Server actions (verify email, etc.)

components/
├── ui/              ← shadcn/ui primitives (57 files)
├── auth/            ← Verification views
├── settings/        ← Admin user management
├── shared/          ← RoleGate, user-avatar
└── (root)           ← Shell, dashboard, calendar, task pulse, clients, profile

lib/                 ← Business logic (54 files)
├── msc_vault_*.ts   ← Vault CRUD server actions
├── msc_auth_*.ts    ← Auth flows
├── store.ts         ← Zustand state
└── msc_map_vault.ts ← Data mapping layer

collections/         ← Payload CMS collections (7 files)
```

### State Flow

```
Auth Screen → msc_login() → Payload sets httpOnly cookie → Zustand.isAuthenticated = true
  → hydrateVaultFromPayload() → msc_loadVaultProjects() → Payload query → Zustand.projects
  → Components render from Zustand → User actions → Server Actions → Payload → Zustand update
```

### Branch Strategy

- **Active development:** `MSC-Projectz-Jedi-Master-v2`
- **Full dev iterations:** `MSC-Projectz-FullDev-v{1..10}`
- **Master releases:** `MSC-Projectz-Master-v1.0`, `v2.0`, `v3.0`
- **Features:** `feature/*`
- **Deploy line:** `MSC-Projectz-Pro-Live-v1`

### Design Language

"Vader Dark FrostedUI" — dark glassmorphism with green accent (`#599ede` UI accent, `#DB9618` gold for highlights). Light mode available but dark is primary.

### Related

- See `TRUTH.md` for identity and core rules
- See `.cursor/docs/` for full documentation suite
