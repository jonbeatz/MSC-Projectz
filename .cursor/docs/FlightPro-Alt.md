# FlightPro-Alt — Alternate master deployment blueprint

> **Version:** 1.0.0  
> **Target:** jon-beatz.com (Linux / cPanel)  
> **Pairing doc:** `FlightPro.md` (SOP and recovery). Use this file for **WSL / OOM** and **script-level** detail.

---

## 0. System instructions (Cursor context)

*Use this file as additional context for deploy and build troubleshooting.*

1. **Ask before large changes:** confirm whether the target is a **new public URL** or the existing **jon-beatz.com** stack.
2. **Environments:** develop on **Windows (Vader)**; production is **Linux**. **Never** ship a standard zip that relies on **Windows-compiled** `node_modules` — either install on the server or use a **WSL/Linux** build for bundled native deps (see §3 Scenario B).
3. **OOM / heavy builds:** if the build or host runs out of memory, use the **WSL / high-memory** workflow in §3 B, not a bigger zip alone.

---

## 1. Environment (`.env`)

Keep secrets in the repo-root **`.env`**. Do not paste real secrets into cPanel or chat; mirror values in cPanel’s app **environment UI** for production.

| Variable | Purpose / typical value |
| --- | --- |
| `NODE_ENV` | `production` on the server |
| `DATABASE_URL` | `file:./payload.sqlite` (see `payload.config.ts`) |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://jon-beatz.com` (used by vault/server URL helpers) |
| `PAYLOAD_SECRET` | Long random string — **never commit a real value** in docs or Git |

*Legacy/alternate names:* some docs mention `PAYLOAD_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_SERVER_URL`. This codebase’s app layer prefers **`NEXT_PUBLIC_SITE_URL`** — align with `lib/msc_vault_*.ts` and `.env.example`.

---

## 2. Deployment script: `msc_package_deploy.mjs`

- **What it does:** pre-flight (requires `server.js`, `.env`, `payload.sqlite`) → `npm run build` → copy **COPY_PLAN** into `deploy_package/` → zip **`final_deploy.zip`**.
- **Source of truth:** the real file in the repo — always read **`msc_package_deploy.mjs`**, not a stale copy-paste in a doc.
- **Default:** `node_modules` is **not** in the plan; the server should run `npm install` (or `npm install --legacy-peer-deps` if your host requires it) when dependencies change.

### COPY_PLAN (default entries)

| Path | Type |
| --- | --- |
| `.next` | dir |
| `public` | dir |
| `media` | dir |
| `app` | dir |
| `collections` | dir |
| `components` | dir |
| `lib` | dir |
| `types` | dir |
| `server.js` | file |
| `payload.config.ts` | file |
| `next.config.mjs` | file |
| `tsconfig.json` | file |
| `.env` | file |
| `package.json` | file |
| `payload.sqlite` | file |
| `unzip.php` | file |

**OOM / WSL note:** to include **`node_modules`** in the package (emergency only, large artifact), add `{ from: 'node_modules', type: 'dir' }` to **COPY_PLAN** in `msc_package_deploy.mjs` after a **Linux** or WSL `npm install`+`npm run build`. Prefer server-side `npm install` when possible.

---

## 3. Workflows

### Scenario A — Standard deployment (code + build artifacts only)

Use when the **server has enough RAM** to run `npm install` after deploy.

1. `npm run pushitlive` (in this repo: runs `build:prod` → `node msc_package_deploy.mjs` — check `package.json` for the exact graph).
2. Upload **`final_deploy.zip`** to the app root.
3. Unzip (e.g. `https://jon-beatz.com/unzip.php` if that helper is deployed and allowed).
4. **cPanel → Node.js** → **Restart** the app.
5. On the server, **`npm install`** if `package.json` changed and `node_modules` was not shipped.

### Scenario B — WSL / high-memory (optional `node_modules` in zip)

Use when the **host or build** hits **OOM** and you must ship a pre-built tree.

1. Build in **WSL or Linux** (or match the server ABI): e.g. `npm install` then `npm run build`.
2. Optionally add `{ from: 'node_modules', type: 'dir' }` to **COPY_PLAN** in `msc_package_deploy.mjs` (see §2).
3. `npm run pushitlive` (or `node msc_package_deploy.mjs` per `package.json`).
4. Upload **`final_deploy.zip`**, unzip, restart Node.
5. On Linux shell (cPanel **Terminal** or SSH): e.g. `chmod -R 755 .next public media` and, if shipped, `node_modules`; `chmod 644` for `server.js`, `payload.sqlite`, `.env` as required by the host. Replace user/host paths (e.g. `wjehbnzcoy`) with **your** account.

---

## 4. Troubleshooting

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| **500, EACCES** | File permissions on Linux | Dirs (e.g. `.next`, `public`, `media`): **755**; key files: **644** (or host-corrected). |
| **500, module not found** | `node_modules` / native mismatch (Windows vs Linux) | Reinstall on **server** or WSL, or use Scenario B with Linux-built `node_modules`. |
| **Process killed / OOM** | Low server memory at build or runtime | Lighter build (more RAM on PC, or WSL), or Scenario B; avoid building huge monoliths on the smallest tier without swap. |
| **Database locked** | SQLite permissions / two writers | Ensure one process owns **`payload.sqlite`**; check owner matches the Node user; avoid editing DB from two services at once. |

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

**Server-side permission fix** (run on **Linux** after deploy, from app root; adjust paths and user as needed — not a Windows one-liner):

```bash
chmod -R 755 .next public media
chmod 644 server.js payload.sqlite .env
```

---

## 6. Changelog (doc)

- **1.0.0** — Reformatted: fixed escaped Markdown, merged run-on lines into sections, table for **COPY_PLAN**, aligned script description with `msc_package_deploy.mjs`, placeholders for secrets, cross-link to `FlightPro.md`.
