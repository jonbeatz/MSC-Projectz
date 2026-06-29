# MSC-Projectz — TRUTH.md

**Identity:** MSC-Projectz (Vader Vault) — Command Center for MyStudioChannel operations
**Repository:** [jonbeatz/MSC-Projectz](https://github.com/jonbeatz/MSC-Projectz)
**Live:** [https://jon-beatz.com](https://jon-beatz.com)
**Version:** `0.1.1`

## Core Stack

| Layer         | Technology                             | Version                     |
| ------------- | -------------------------------------- | --------------------------- |
| **Framework** | Next.js (App Router)                   | 16.2.3                      |
| **CMS**       | Payload                                | 3.84.1                      |
| **Database**  | SQLite (`payload.sqlite`)              | via `@payloadcms/db-sqlite` |
| **Language**  | TypeScript (strict)                    | 5.7.3                       |
| **UI**        | shadcn/ui (New York) + Tailwind CSS v4 | —                           |
| **State**     | Zustand + persist (localStorage)       | 5.x                         |
| **Desktop**   | Tauri                                  | v2                          |

## Architecture

Two route groups in `app/`:

- `(main)` — Command Center app (dashboard, vault, calendar, clients, tasks, settings, profile)
- `(payload)` — Payload CMS admin panel + API + GraphQL

**Data flow:** Server Actions → Zustand store → React components. Auth via Payload httpOnly cookies.

## Key conventions

- **Naming:** `MSC_Projectz_*` for components (PascalCase), `msc_*` for internal functions/variables (snake_case)
- **Access control:** Multi-tenant — users see only their own projects. Admin roles see all.
- **Styling:** Dark-first with light mode support. CSS variables in `globals.css` for all colors.
- **Auth:** Payload `users` collection + httpOnly cookie + trust gate middleware. Email verification required for new accounts.

## Source of truth order

1. `.cursorrules` — operating rules for agents
2. `.cursor/docs/Docs-Architecture.md` — canonical docs map
3. `.cursor/docs/START-HERE.md` — startup contract and session entry point
4. `.cursor/docs/Session-Snapshots.md` — session handoff reference
5. `TRUTH.md` (this file) — project identity and core rules

## Related projects

| Project                 | Path                                 | Dependency                                 |
| ----------------------- | ------------------------------------ | ------------------------------------------ |
| **MyStudioChannel**     | `D:\Cursor_Projectz\MyStudioChannel` | Website, Payload CMS, Hostinger deploy     |
| **Hermes Core Scripts** | `D:\Hermes\projects\_core-scripts`   | Shared infrastructure (deploy, voice, MCP) |
| **JonBeatz Profile**    | `D:\Hermes\projects\JonBeatz`        | Personal AI command center                 |

## Core rules

1. **No secrets in git** — `.env*` files are gitignored. Use `.env.example` for templates.
2. **Tenant isolation** — never broaden Payload access control boundaries casually.
3. **cPanel deploy** — uses FTPS + custom Node.js server (`server.js`). Not Hostinger MCP.
4. **Build gate required** — run `npm run verify:next` (or `:safe`) after runtime-impacting changes.
5. **Local first** — all development on `MSC-Projectz-Jedi-Master-v2` branch. `master` is deploy-line only.
