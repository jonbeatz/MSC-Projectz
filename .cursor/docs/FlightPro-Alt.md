# FlightPro-Alt — Alternate master deployment blueprint

> **Version:** 1.0.1  
> **Target:** jon-beatz.com (Linux / cPanel)  
> **Pairing doc:** `FlightPro.md` (primary SOP). Use this file only when standard flow fails or you hit advanced Linux/runtime edge cases.

---

## 0. System instructions (Cursor context)

_Use this file as additional context for deploy and build troubleshooting._

1. **Ask before large changes:** confirm whether the target is a **new public URL** or the existing **jon-beatz.com** stack.
2. **Environments:** develop on **Windows (Vader)**; production is **Linux**. **Never** ship a standard zip that relies on **Windows-compiled** `node_modules` — either install on the server or use a **WSL/Linux** build for bundled native deps (see §3 Scenario B).
3. **OOM / heavy builds:** if the build or host runs out of memory, use the **WSL / high-memory** workflow in §3 B, not a bigger zip alone.

---

## 1. Environment (`.env`)

Keep secrets in the repo-root **`.env`**. Do not paste real secrets into cPanel or chat; mirror values in cPanel’s app **environment UI** for production.

| Variable               | Purpose / typical value                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`             | `production` on the server                                                     |
| `DATABASE_URL`         | `file:./payload.sqlite` (see `payload.config.ts`)                              |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://jon-beatz.com` (used by vault/server URL helpers) |
| `PAYLOAD_SECRET`       | Long random string — **never commit a real value** in docs or Git              |

_Legacy/alternate names:_ some docs mention `PAYLOAD_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_SERVER_URL`. This codebase’s app layer prefers **`NEXT_PUBLIC_SITE_URL`** — align with `lib/msc_vault_*.ts` and `.env.example`.

---

## 2. Deployment script: `msc_package_deploy.mjs`

- **What it does:** pre-flight (requires `server.js`, `.env`, `payload.sqlite`) → `npm run build` → copy **COPY_PLAN** into `deploy_package/` → zip **`final_deploy.zip`**.
- **Source of truth:** the real file in the repo — always read **`msc_package_deploy.mjs`**, not a stale copy-paste in a doc.
- **Default:** `node_modules` is **not** in the plan; the server should run `npm install` (or `npm install --legacy-peer-deps` if your host requires it) when dependencies change.

### COPY_PLAN (default entries)

| Path                | Type |
| ------------------- | ---- |
| `.next`             | dir  |
| `public`            | dir  |
| `media`             | dir  |
| `app`               | dir  |
| `collections`       | dir  |
| `components`        | dir  |
| `lib`               | dir  |
| `types`             | dir  |
| `server.js`         | file |
| `payload.config.ts` | file |
| `next.config.mjs`   | file |
| `tsconfig.json`     | file |
| `.env`              | file |
| `package.json`      | file |
| `payload.sqlite`    | file |
| `unzip.php`         | file |

**OOM / WSL note:** to include **`node_modules`** in the package (emergency only, large artifact), add `{ from: 'node_modules', type: 'dir' }` to **COPY_PLAN** in `msc_package_deploy.mjs` after a **Linux** or WSL `npm install`+`npm run build`. Prefer server-side `npm install` when possible.

### Native `sharp` (binary correction — read if `stderr` mentions `sharp`)

**Symptom:** `Failed to load external module sharp` (or similar) in **`stderr.log`**.  
**Cause:** `sharp` ships **OS- and arch-specific** native binaries. A `node_modules` tree built on **Windows** (or copied from a dev PC) will not run `sharp` on **Linux**.

**Fix on the server** (**Live (cPanel → Terminal)** or SSH), from the app root after a correct `npm install` for that OS:

```bash
npm rebuild sharp --platform=linux --arch=x64
```

**Best practice:** do **not** upload Windows `node_modules`. Run `npm install` on the server (or use a **WSL/Linux** build for any zipped `node_modules`) so `sharp` resolves the right prebuild.

---

## 3. Escalation workflows (appendix)

### Scenario A — Standard flow failed, now verify assumptions

Before changing anything major, re-check:

1. `package.json` script names still match docs (`pushitlive`, `build:prod`, etc.).
2. Zip contains expected runtime files from `COPY_PLAN`.
3. Server restart was performed after unzip.
4. `stderr.log` confirms the current error, not a stale one.

### Scenario B — WSL / high-memory recovery (optional Linux `node_modules`)

Use when host build/runtime repeatedly hits OOM or Linux native module issues.

1. Build in **WSL/Linux** to match server ABI: `npm install` then `npm run build`.
2. Optional emergency path: add `{ from: 'node_modules', type: 'dir' }` to `COPY_PLAN`.
3. Build package with `npm run pushitlive`.
4. Upload zip, unzip, restart Node.
5. If permission issues remain, run Linux permission/ownership correction from §4/§5.

---

## 4. Troubleshooting

| Symptom                                              | Cause                                                                    | Solution                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **500, EACCES**                                      | Permissions; Next may **write** under **`.next`** at runtime             | Run `chmod -R 755` on **`.next`**, `public`, and `media` (and `node_modules` if present). If errors **continue**, see **ownership** below — cPanel often breaks when files are uploaded or unzipped as a **different user** than the Node app. |
| **`sharp` / `Failed to load external module sharp`** | **Binary mismatch** (Windows vs Linux `node_modules`, or wrong prebuild) | On the server: `npm rebuild sharp --platform=linux --arch=x64` (from app root). Prefer server-side `npm install` or a WSL/Linux-built tree — see §2 **Native sharp**.                                                                          |
| **Process killed / OOM**                             | Low server memory at build or runtime                                    | Use the **WSL / Linux** build pipeline (§3 B) to produce a **Linux-native** build locally, or add RAM/swap; avoid huge in-place builds on the smallest tier.                                                                                   |
| **500, generic module not found**                    | Bad `node_modules` tree or path                                          | Reinstall on the **server** (`rm -rf node_modules && npm install` if policy allows) or use Scenario B with a Linux-built `node_modules`.                                                                                                       |
| **Database locked**                                  | SQLite permissions / two writers                                         | Ensure one process owns **`payload.sqlite`**; same **owner** as the Node process; avoid two services writing the DB at once.                                                                                                                   |

**If you still get EACCES after `chmod`:** permissions are not always enough. **Reset ownership** so the cPanel/Node system user owns the app tree (exact UI varies: File Manager “Change ownership”, JetBackup tools, or host support / SSH `chown` if your plan allows). Symptom: app starts but cannot write cache or temp files under **`.next`**.

---

## 5. Command aliases (align with `package.json`)

**Authoritative** scripts live in **`package.json`**. The following is a **reference** — do not paste blindly; merge with what is already there.

This repo (example — verify with `package.json`):

```json
{
  "scripts": {
    "build:prod": "node msc_package_deploy.mjs",
    "pushitlive": "npm run build:prod",
    "test:local": "npm run build && node server.js"
  }
}
```

**Optional** WSL/ops helpers (add only if you use them):

```json
{
  "scripts": {
    "build:wsl": "npm install && npm run build"
  }
}
```

**Server-side permission fix (first line of defense)** — run on **Linux** after deploy, from the **app root** (not a Windows one-liner):

```bash
chmod -R 755 .next public media
chmod 644 server.js payload.sqlite .env
```

**If EACCES persists:** Next.js may still be unable to write under **`.next`**. Re-check **ownership** (see §4): uploads via FTP/zip are often owned by a user that is **not** the cPanel **Node** user — use the host’s ownership repair flow or `chown` when permitted so the app user owns the project tree.

---

## 6. Changelog (doc)

- **1.0.2** — Re-scoped as advanced appendix only; removed duplicated standard deploy path; added escalation-first workflow and cleaned formatting.
- **1.0.1** — EACCES: ownership note after `chmod`; `sharp` binary mismatch and `npm rebuild sharp --platform=linux --arch=x64` in §2 and troubleshooting; expanded table for common production errors.
- **1.0.0** — Reformatted: fixed escaped Markdown, merged run-on lines into sections, table for **COPY_PLAN**, aligned script description with `msc_package_deploy.mjs`, placeholders for secrets, cross-link to `FlightPro.md`.
