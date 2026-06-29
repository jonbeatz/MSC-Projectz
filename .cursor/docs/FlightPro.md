# FlightPro.md — Master deployment & recovery blueprint

> **Status:** Active — use with **`package.json`** (source of truth for script names)  
> **Primary live target (this protocol):** `jon-beatz.com` (Linux / cPanel / Spaceship)  
> **Dev machine:** Windows (Vader) — paths and port checks use PowerShell / `netstat` patterns below.

## 0. How this file stays useful (future you / agents)

1. **After any change to npm scripts or deploy files**, update **§1 Commands** and skim **§3 Deploy** so they still match `package.json`, `msc_package_deploy.mjs`, and `server.js`.
2. **After a successful milestone or hotfix**, add a one-line row to **`Restore-Points.md`** and bump **§7 Checkpoint template**.
3. Keep **FlightPro** (this file) and **`START-HERE.md`** as the active narrative source of truth for deploy/recovery workflow.
4. **Secrets:** never commit real `PAYLOAD_SECRET` or mail passwords. Use placeholders in docs; real values live only in local `.env` and cPanel env UI.
5. **Media rule:** user uploads and generated files belong under project-root **`./media`** (see **`.cursor/rules/media-asset-management.mdc`**). The deploy **COPY_PLAN** includes `media/`.
6. **Local-first (frozen live):** When the operator is iterating only in Cursor on this repo, skip **live** steps — no FTPS upload, no cPanel file replace, no production Node restart, no editing production env vars — until they explicitly kick off a **new clean cutover** (`pushitlive` → upload/extract/install/restart per **§3**). Agents should implement, **`npm run verify:next`** (or **`verify:next:safe`** if dev shares **3000**), and local smoke/tests only; **`§4.1`** mail variables apply to **production** unless the operator tests SMTP locally via **`.env.local`**.

## 0.1 Doc reading order (governance)

1. **`START-HERE.md`** — vision, branch, what changed recently
2. **`FlightPro.md`** (this file) — deploy + local recovery SOP
3. **`Session-Snapshots.md`** — latest operational handoff
4. **`Agent-Runbook.md`** — agent coding and tenant rules
5. **`Spaceship.md`** and **`Restore-Points.md`** — host context + git checkpoints

---

## 1. The command center (synced to `package.json`)

| Script                                          | What it does                                                                                                                                                                                                                                                                                                  |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                                   | Next dev on port **3000** (`next dev --webpack`).                                                                                                                                                                                                                                                             |
| `npm run build`                                 | Production build (`next build`).                                                                                                                                                                                                                                                                              |
| `npm run start`                                 | `next start` (not used for daily local dev; cPanel can use `node server.js` — see `server.js`).                                                                                                                                                                                                               |
| `npm run clean:next`                            | Deletes `.next/`.                                                                                                                                                                                                                                                                                             |
| `npm run verify:next`                           | `clean:next` + `next build` — **build gate** after code changes. **Do not run while `npm run dev` is holding port 3000** (it deletes `.next` under a live dev server and breaks HMR). Stop dev first, or use a flow that never deletes `.next` while dev is up.                                               |
| `npm run deploy:preflight`                      | Validates deploy profile, required scripts/files, and relative media path guardrails before packaging.                                                                                                                                                                                                        |
| `npm run package:production`                    | Alias to `npm run package:deploy` (command truth from `package.json`).                                                                                                                                                                                                                                        |
| `npm run package:deploy`                        | `node msc_package_deploy.mjs` — same entry as `build:prod` (see below).                                                                                                                                                                                                                                       |
| `npm run build:prod` / **`npm run pushitlive`** | Runs **`msc_package_deploy.mjs`**: validates `server.js`, `.env`, `payload.sqlite` → `npm run build` → stages **`deploy_package/`** from **COPY_PLAN** → writes **`final_deploy.zip`** at repo root.                                                                                                          |
| `npm run test:local`                            | `npm run build` then `node server.js` — smoke production-style local run (not hot reload).                                                                                                                                                                                                                    |
| `npm run repair:sqlite`                         | Vault DB repair / schema assist (`scripts/msc_sqlite_repair_vault_schema.mjs`). Adds missing columns on **`msc_vault_projects`**, **`payload_locked_documents_rels`** (polymorphic lock FKs such as **`msc_clients_id`**, **`msc_vault_snippets_id`**), tasks, users, etc. Idempotent; backs up SQLite first. |
| `npm run db:rescue-admin`                       | Admin recovery (`jiti scripts/msc_rescue_admin.ts`).                                                                                                                                                                                                                                                          |
| `npm run db:prune-gate-users`                   | Deletes local audit users `*gate-user*@msc.local` and related rows (`scripts/msc_delete_gate_test_users.mjs`); **not** for production DBs — local SQLite hygiene only.                                                                                                                                        |

> **Note:** Script names in this file are synced to `package.json` and should be treated as authoritative for local operations.

---

## 2. Local recovery (port 3000 / white screen / stale chunks)

**Symptoms:** `ERR_CONNECTION_REFUSED`, nothing on **3000**, 500s after deleting `.next` while dev was running, or broken `/_next/static/...` chunks.

**Windows (Vader) — one clean cycle:**

1. Find the listener: `netstat -ano | findstr ":3000"` → note the **LISTENING** PID.
2. Stop it: `taskkill /PID <pid> /F`
3. `npm run clean:next`
4. `npm run dev` — wait for **Local:** / **Ready** in the terminal.
5. Smoke: `http://127.0.0.1:3000/` and `http://127.0.0.1:3000/admin` (expect **200**).

**Build gate (after app code changes):** from repo root, `npm run verify:next` until exit code **0**.

---

## 3. Deploy pipeline (SOP) — `pushitlive` → `final_deploy.zip`

**A. On the PC (before zip)**

1. Ensure profile context is loaded from `.cursor/docs/Deploy-Profile.template.json` (+ `.cursor/docs/Deploy-Profile.local.json` if present).
2. Run **`npm run deploy:preflight`** and resolve any hard failures.
3. Ensure **`.env`**, **`payload.sqlite`**, and **`server.js`** exist (deploy script validates these).
4. Run **`npm run pushitlive`** (alias for `build:prod` → `msc_package_deploy.mjs`).
5. Confirm **`final_deploy.zip`** in the project root.
6. **COPY_PLAN** (see `msc_package_deploy.mjs`) includes among others: `.next/`, `public/`, `media/`, `app/`, `collections/`, `components/`, `lib/`, `types/`, `server.js`, `payload.config.ts`, `next.config.mjs`, `tsconfig.json`, `.env`, `package.json`, `payload.sqlite`, `unzip.php`. It does **not** bundle `node_modules` — the server must run **`npm install`** in cPanel when dependencies change.
7. If the script logs `skip (missing)` for an optional path, only fix it when that path is required for your release.

**B. On the server (cPanel)**

1. Upload **`final_deploy.zip`** to the app root (FTP/SFTP).
2. Unzip (e.g. `https://jon-beatz.com/unzip.php` if that helper is deployed and allowed).
3. **Node.js Application Manager** → **Restart** the app.
4. If you see **500** / permission errors, apply **§5 Permission hygiene** and check **`stderr.log`** in the app root.

**C. cPanel / Node**

- **Live (cPanel):** use the Node.js UI for the domain; do not run PC-only upload scripts on the server unless you know you need them.
- For Spaceship cPanel short links, see **`.cursor/rules/jon-operator-cpanel.mdc`** (bookmarks in **`START-HERE.md`** if refreshed).

**D. Live spot-check (after restart — e.g. `https://jon-beatz.com`)**

1. Open `/` — login or landing behaves as expected (no white screen, no chunk 404s in devtools Network).
2. Open `/admin` — Payload admin loads; sign-in works if applicable.
3. Smoke **Command Center** paths you ship (`/dashboard`, `/clients`, etc.) for layout regressions.
4. Confirm **`NEXT_PUBLIC_SITE_URL`** matches the live origin so server actions and auth helpers resolve correctly (see §4).

---

## 4. Environment variables (principles)

Copy **`.env.example`** to **`.env`** and set real values locally. For production, mirror needed keys in cPanel’s application environment.

| Concern                   | Notes                                                                                                                                                                                                                                 |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Payload**               | `PAYLOAD_SECRET` — long random string.                                                                                                                                                                                                |
| **Database**              | `payload.config.ts` uses **`DATABASE_URL`** (e.g. `file:./payload.sqlite`). Some helper scripts also read **`DATABASE_URI`**; if a tool fails, set both to the same SQLite file URI.                                                  |
| **Public site URL**       | App code uses **`NEXT_PUBLIC_SITE_URL`** for server actions / auth origin helpers (see `lib/msc_vault_server_actions.ts` and `lib/msc_vault_payload_session.ts`). Set this to your real public origin (e.g. `https://jon-beatz.com`). |
| **Mail (studio / vault)** | `MSC_STUDIO_OUTGOING_*` in **`.env.example`** — required on the server for **verification**, **resend verification**, **welcome**, and SMTP-backed task notifications.                                                                |

Do **not** paste production secrets into docs; use placeholders in tables.

### 4.1 Verification email — local first, then production

**Local (Cursor):** Copy **`.env.local.example`** → **`.env.local`** (gitignored). Set **`NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`** (or `http://localhost:3000`) so verification links in outbound mail match the origin you use in the browser; keep **one** host for the whole session (see **Vault session** notes in **`Agent-Runbook.md`**). Add **`MSC_STUDIO_OUTGOING_USER`** / **`PASS`** from Spaceship when you want real delivery from **`npm run dev`**. Do **not** check **`.env.local`** into Git.

**Production (later):** Replace only the public URL in the host env — **`NEXT_PUBLIC_SITE_URL=https://jon-beatz.com`** — plus the same **`MSC_STUDIO_OUTGOING_*`** block in **cPanel**. The app code path is identical; only env differs.

---

#### Production (Spaceship / cPanel)

The app sends verification links with **nodemailer** using **`MSC_STUDIO_OUTGOING_*`**. WordPress **FluentSMTP** does **not** supply credentials to this Node app — production values go on the **Node.js** application.

1. **Live (cPanel → Node.js Application Manager)** → select **`jon-beatz.com`** (or your app) → **Environment Variables** / **Edit** (wording varies by skin).
2. Set or confirm (values from Spaceship mail / Spacemail; use an **app password** where the provider requires it):

| Variable                   | Example / notes                                                                                                                                                    |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | `https://jon-beatz.com` — verification links use this origin; wrong value = broken verify URLs.                                                                    |
| `MSC_STUDIO_OUTGOING_HOST` | `mail.spacemail.com`                                                                                                                                               |
| `MSC_STUDIO_OUTGOING_PORT` | `465`                                                                                                                                                              |
| `MSC_STUDIO_OUTGOING_SSL`  | `true`                                                                                                                                                             |
| `MSC_STUDIO_OUTGOING_USER` | Full mailbox address (e.g. `studio@jon-beatz.com`) — should match an allowed sender for that mailbox.                                                              |
| `MSC_STUDIO_OUTGOING_PASS` | App password for that mailbox (not your cPanel login).                                                                                                             |
| `MSC_STUDIO_OUTGOING_FROM` | Optional. If set, used as the **From** header (e.g. `MSC <studio@jon-beatz.com>`). If unset, **From** defaults to `MSC_STUDIO_OUTGOING_USER` when it contains `@`. |

3. **Restart** the Node application so `process.env` picks up changes.
4. **Test:** register a throwaway address or use **Resend verification** on `/auth/verify-reminder`; check host **`stderr.log`** only if delivery fails (look for nodemailer / SMTP errors, not passwords).

If mail still does not send, confirm the mailbox allows **SMTP submission** on **465** from the host’s outbound IP and that **`NEXT_PUBLIC_SITE_URL`** has no trailing slash mismatch beyond what the app normalizes.

---

## 5. Permission hygiene (“EACCES” / 500 after deploy)

In **cPanel File Manager** (or SSH), typical fixes:

- **Directories** (e.g. `.next`, `public`, `media`): **755** recursive where the app must traverse.
- **Files** (e.g. `server.js`, `payload.sqlite`, `.env`): **644** (adjust if your host requires a stricter private mode for the DB or env).
- If errors persist after chmod, verify **ownership** matches the Node app user (owner mismatch can still trigger EACCES).

---

## 6. Common production failures

- **Native binary / module mismatch on Linux vs Windows** — on the server, remove server `node_modules` and run **`npm install`** (or `npm install --legacy-peer-deps` if documented for this host) from the app path, then restart.
- **`sharp` / native addon crash** — if logs show module load errors, run `npm rebuild sharp --platform=linux --arch=x64` on the Linux host and restart.
- **Missing build** — `server.js` with `NODE_ENV=production` expects `.next` from a prior **`npm run build`**. The deploy script runs build before staging.
- **Incomplete upload** — mixed old/new `.next` can cause `vendor-chunks` or missing chunk errors; upload a full **`final_deploy.zip` extract or clean `.next` on the server and redeploy.
- **DB not in package** — `payload.sqlite` is part of **COPY_PLAN** when the file exists; do not deploy without a migration plan if you change schema.

---

## 7. Checkpoint template (for `Restore-Points.md`)

```text
| RP-YYYY-MM-DD-short-name | YYYY-MM-DD | Branch: feature/... @ <full-sha> (<subject>). Deploy: pushitlive → final_deploy.zip. Verify: verify:next; smoke / + /admin 200. Restore: git fetch && git switch <branch> && git reset --hard <sha> && npm install && npm run dev. Caveats: … |
```

---

## 8. Related docs

- **`START-HERE.md`** — startup contract and ops context.
- **`Spaceship.md`** — provider/DNS/cPanel context.
- **`Deploy-Secrets-Workflow.md`** — encrypted secret handling workflow.
- **`Deploy-Live-Cutover-JonBeatz.md`** — operator step-by-step clean cutover runbook with progress log.
