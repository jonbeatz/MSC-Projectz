# Agent Instructions — MSC-Projectz (Vader Vault)

## First time here?

1. Read `TRUTH.md` — constitution, stack, architecture, core rules
2. Read `.cursor/docs/Docs-Architecture.md` — canonical docs map
3. Read `.cursor/docs/START-HERE.md` — startup contract and session entry point
4. Read `package.json` — all npm scripts authority

## What this project is

A **private Command Center** for MyStudioChannel operations. Dashboard for project vault, calendar, clients, tasks, settings, and profile management. Payload CMS backend with SQLite. No public registration — invite-only via admin panel.

## Key npm scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run verify:next` | Build verification |
| `npm run verify:next:safe` | Build verification (no port conflict) |
| `npm run dev:recover` | Reset dev server |
| `npm run seed` | Seed test data |
| `npm run rescue:admin` | Recover admin access |

## Documentation hierarchy

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | `TRUTH.md` | Constitution, stack, architecture |
| 2 | `.cursor/docs/Docs-Architecture.md` | Canonical docs map |
| 3 | `.cursor/docs/START-HERE.md` | Session startup contract |
| 4 | `.cursorrules` | Operating rules |
| 5 | `.cursor/docs/Session-Snapshots.md` | Handoff reference |
| 6 | `.cursor/rules/*.mdc` | Scoped workflow rules |

## Safety defaults

- **Windows PowerShell** — no bash heredocs. Use temp files for multi-line git messages.
- **cPanel deploy** — not Hostinger. Uses FTPS + `server.js`.
- **Build gate** — always run `npm run verify:next` after changes.
- **Secrets** — never commit `.env*` files. Templates in `.env.example`.
- **Payload admin** — at `/admin`. Never expose publicly.
- **Tenant isolation** — preserve Payload access control boundaries.

## Backup

Backups live at `G:\Cursor_Project_BackUpz\MSC-Projectz\`. Standard project backup pattern: `MSC-Projectz-Jedi-Master-v{N}`.

## Related

- `D:\Hermes\projects\_core-scripts` — shared infrastructure
- `D:\Hermes\projects\JonBeatz` — personal AI profile (different project)
