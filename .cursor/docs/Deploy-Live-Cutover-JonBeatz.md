# Deploy Live Cutover — jon-beatz.com

Purpose: repeatable, low-stress cutover from local MSC-Projectz to Spaceship cPanel live app.

Scope: this runbook assumes **local is authoritative** for code + `payload.sqlite` + `media/`, and uses a **full clean cutover**.

## 0) Ground rules

- **Local (Cursor / PC repo root)** commands run on your Windows machine in this repo.
- **Live (cPanel)** steps run in browser at [https://server9.shared.spaceship.host:2083/](https://server9.shared.spaceship.host:2083/).
- Stop Node app before deleting/replacing live files.
- Use `755` for directories and `644` for files after extract.

## 1) Proven local packaging (completed)

From branch `MSC-Projectz-Jedi-Master-v1`, this worked:

- **Local (Cursor / PC repo root):** `npm run deploy:preflight`
- **Local (Cursor / PC repo root):** `npm run pushitlive`
- Output: `final_deploy.zip` created successfully at repo root.

Observed warnings (non-blocking, keep noted):

- `Deploy-Profile.local.json not found. Using template only.`
- `ftpUsername is still template placeholder.`

## 2) Live cutover checklist (do in order)

### A. Backup first (required)

1. **Live (cPanel):** open File Manager, go to app root for `jon-beatz.com`.
2. Create timestamp backup folder (example): `backup_pre_cutover_YYYYMMDD_HHMM`.
3. Copy current app files into backup folder (or create zip backup in place).
4. Confirm backup includes current `.env`, `payload.sqlite`, and `media/`.

### B. Stop app + clean root

1. **Live (cPanel):** Node.js Application Manager -> select app -> **Stop**.
2. In app root, delete old deploy content for clean cutover:
   - delete `.next`
   - delete `node_modules`
   - delete old app code folders/files that are part of the package
3. Keep only what you intentionally preserve (normally backup folder only).

### C. Upload + extract new package

1. Upload local `final_deploy.zip` to app root.
2. Extract zip in app root (File Manager extract or `unzip.php` route if you use that helper).
3. Confirm extracted files include `.next`, `server.js`, `package.json`, `.env`, `payload.sqlite`, `media/`.

### D. Install deps + permissions + restart

1. **Live (cPanel -> Node.js app terminal or NPM UI):** run:
   - `npm install`
   - if required by host resolution only: `npm install --legacy-peer-deps`
2. Set permissions recursively:
   - directories: `755`
   - files: `644`
3. **Live (cPanel):** Node.js Application Manager -> **Restart**.

## 3) Post-deploy verification

Check in browser:

- `https://jon-beatz.com/`
- `https://jon-beatz.com/admin`
- `https://jon-beatz.com/dashboard`
- `https://jon-beatz.com/calendar`
- `https://jon-beatz.com/tasks`
- `https://jon-beatz.com/help`

Success criteria:

- routes load without white screen/chunk errors
- admin login works
- no fresh permissions/runtime errors in app logs

If broken:

1. Stop app.
2. Restore backup from section 2A.
3. Restart app.
4. Re-run cutover more slowly using this checklist.

## 4) Progress and wins log

| Time | Step | Result | Notes |
|---|---|---|---|
| 2026-04-29 | Local preflight + package | PASS | `deploy:preflight` + `pushitlive` succeeded; `final_deploy.zip` generated. |
| 2026-04-29 | Local build inside packaging | PASS | Next build compiled and staged deploy package. |
| 2026-04-29 | Live baseline route probe | PARTIAL | `/`, `/dashboard`, `/tasks`, `/help` return login shell. `/calendar` currently 404 on live (expected old version gap). |
| 2026-04-29 | Live backup | PENDING | Execute section 2A in cPanel. |
| 2026-04-29 | Live clean cutover | PENDING | Execute sections 2B–2D in cPanel. |
| 2026-04-29 | Live route verification | PENDING | Execute section 3 and record outcomes. |

## 5) What to improve next deploy

- Add `.cursor/docs/Deploy-Profile.local.json` with real FTP username so preflight warning disappears.
- Keep this file updated with exact failure + fix details after each deployment.
