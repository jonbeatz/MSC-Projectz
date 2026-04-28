# Tech — stack and learning guide

Single inventory of **what MSC-Projectz is built with**, **what to learn first**, and **optional** technologies to explore. Command names and workflows stay in **`package.json`** and [FlightPro.md](./FlightPro.md); this file does not duplicate deploy SOPs.

## Executive summary

**MSC-Projectz** is a **Next.js** App Router frontend with **Payload CMS 3** for data, auth, and admin, backed by **SQLite** on disk (`payload.sqlite`). The UI uses **React**, **TypeScript**, **Tailwind CSS v4**, and **Radix UI**-style primitives (plus helpers like **Vaul** for drawers). An optional **Tauri 2** desktop shell wraps the same web app. Production builds are packaged by a repo script (`pushitlive` / `msc_package_deploy.mjs`) and deployed to **Linux + cPanel** (Spaceship) as documented elsewhere.

---

## Version snapshot (bump when upgrading majors)

Captured from **`package.json`** at doc time:

| Piece | Version / note |
| --- | --- |
| Next.js | 16.2.3 |
| React / React DOM | 19.2.4 |
| TypeScript | 5.7.3 |
| Payload CMS | 3.84.1 (with `@payloadcms/*` aligned via `overrides`) |
| Tailwind CSS | ^4.2.0 (`@tailwindcss/postcss` ^4.2.0) |
| Tauri (API / CLI) | `@tauri-apps/api` ^2.10.1, `@tauri-apps/cli` ^2.10.1 |
| Playwright | ^1.59.1 (dev) |

Dev server uses **webpack** explicitly: `next dev --webpack` (see `npm run dev`).

---

## Core runtime (what ships with the product)

| Technology | Role in this repo |
| --- | --- |
| **Node.js** | Runs local dev, scripts, Payload CLI, Playwright harness, and packaging (`msc_package_deploy.mjs`). Production can use `node server.js` after `npm run build` (see `npm run test:local`). |
| **TypeScript** | App code under `app/`, `components/`, `lib/`, `collections/`, etc. |
| **Next.js 16** | App Router, layouts, routes; integrated with Payload via `@payloadcms/next` (`withPayload` in `next.config.mjs`). **Server Actions** used for vault features; body size limits in `next.config.mjs`. |
| **React 19** | UI components and client boundaries. |
| **Payload CMS 3** | Collections, admin UI, users, uploads, Lexical rich text (`payload.config.ts`, `collections/*`). |
| **SQLite** | Database file `payload.sqlite` via `@payloadcms/db-sqlite` (Drizzle used inside Payload; you mostly think in collections + schema repair, not raw ORM app code). |
| **Tailwind CSS v4** | Utility styling; PostCSS pipeline; global styles in `app/globals.css`. |
| **Radix UI** | Headless, accessible primitives (`@radix-ui/react-*` packages). |
| **Vaul** | Drawer/sheet-style overlays where used. |
| **class-variance-authority / clsx / tailwind-merge** | Component variants and className composition. |
| **Lucide React** | Icons. |
| **Sharp** | Image processing (Payload/media pipeline). |
| **GraphQL** | Available through Payload (`graphql` dependency); deep GraphQL knowledge is optional unless you integrate via that API. |
| **@libsql/client** | Present as a dependency; oriented toward LibSQL-compatible usage if extended (not the main learning path unless you wire it). |
| **Nodemailer** | Outgoing mail when studio/vault mail features are enabled. |
| **Zustand** | Client app state. |
| **react-hook-form** | Form handling where used. |
| **next-themes** | Theme switching (e.g. light/dark). |
| **date-fns**, **react-day-picker** | Dates and calendar UI. |
| **recharts** | Charts where used. |
| **react-markdown** + **rehype-highlight** | Markdown rendering in app. |
| **@vercel/analytics** | Analytics package in dependencies (usage follows app wiring). |

---

## Data, media, and Payload admin

- **Uploads / generated files:** project-root **`./media`** (see workspace rules and Payload upload collections).
- **Rich text in admin:** **Lexical** via `@payloadcms/richtext-lexical`.
- **Import map:** `npm run generate:importmap` after admin component path changes (see [START-HERE.md](./START-HERE.md) known fixes).

---

## Optional desktop: Tauri 2

- Config: `src-tauri/tauri.conf.json` — dev URL `http://localhost:3000`, build ties to Next `out` / standard Tauri flow.
- **Rust** underpins Tauri, but daily work is mostly **web stack + Tauri config**. Go deeper into Rust only if you add native plugins or custom commands.

Scripts: `npm run tauri`, `npm run tauri:dev`, `npm run tauri:build` (see `package.json`).

---

## Quality and automation

| Tool | Role |
| --- | --- |
| **ESLint** | `npm run lint` |
| **Playwright** | `npm run playwright:test`, `playwright:open`, `playwright:cmd` — browser automation / smoke (see `scripts/msc_playwright_*.mjs`) |
| **jiti** | Runs some TS scripts from npm (`db:seed`, `db:rescue-admin`, etc.) |

---

## Hosting and deploy (pointer only)

Live stack is **Linux + cPanel** (e.g. Spaceship). Exact steps, zip layout, and restart live in [FlightPro.md](./FlightPro.md) and [Spaceship.md](./Spaceship.md). No need to “learn cPanel” deeply before you’re comfortable with Next + Payload locally.

---

## What to learn (prioritized)

### Tier A — daily (start here)

1. **TypeScript** — types, interfaces, `async`/`await`, modules.
2. **React** — components, hooks, client vs server components (Next.js model).
3. **Next.js App Router** — `app/` routes, layouts, Server Actions, when to use `'use client'`.
4. **Tailwind** — utilities, responsive breakpoints, reading `globals.css` + existing patterns.
5. **Payload at a high level** — collections, fields, relationships, access control basics; read `payload.config.ts` and `collections/*`.

### Tier B — regular (as you build features)

1. **Payload access control** and **upload** fields (media, thumbnails).
2. **Server Actions** patterns in `lib/*_server_actions.ts` (vault, auth-related flows).
3. **SQLite + schema drift** — when things break, `npm run repair:sqlite` and understanding that **code and DB must stay compatible** (see incidents docs if needed).

### Tier C — as needed

1. **Playwright** — only if you extend or debug the test harness.
2. **Deploy packaging** — `npm run deploy:preflight`, `npm run pushitlive`, `final_deploy.zip` (see FlightPro).
3. **Tauri** — packaging a desktop build; config in `src-tauri/`.

### Not the main track (unless you choose it)

- **Deep Rust** — only for advanced Tauri/native work.
- **GraphQL expert-level** — Payload exposes it; most app work is collections + REST/Server Actions.
- **Alternative databases** — this repo is SQLite-first for local/single-tenant style hosting; switching DBs is a major project.

---

## Optional exploration (adjacent, not commitments)

- **Vercel / edge hosting** — conceptual contrast with your **cPanel Node** deploy (you are not required to use Vercel for this project’s live path).
- **Other headless CMSes** — perspective only; you are standardized on **Payload 3**.
- **Observability** — Sentry, Logtail, etc., if you add them later (not required in current stack list).
- **LibSQL / Turso** — only if you intentionally adopt `@libsql/client` for a new data path.

---

## Maintenance

- Update the **Version snapshot** table when you bump **Next**, **Payload**, **React**, or **Tailwind** majors.
- If you add a major new dependency (e.g. ORM, test runner), add one row to **Core runtime** or **Quality and automation** so this file stays the single stack index.
- **Global CSS:** ship namespaced surfaces from **`app/globals.css`** only (imported by [`app/(main)/layout.tsx`](../../app/(main)/layout.tsx)); add shared `.msc-*` blocks there rather than a second unimported `globals.css`.
