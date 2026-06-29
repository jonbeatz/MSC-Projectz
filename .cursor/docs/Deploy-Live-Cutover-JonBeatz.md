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

### Optional: upload package from Cursor via FTPS

- **Local (Cursor / PC repo root):** `npm run deploy:upload`
- Upload source: `final_deploy.zip` (or `deployment.artifactFile` in profile)
- Remote destination: `host.remoteAppRoot` from `.cursor/docs/Deploy-Profile.local.json`
- One-command package + upload: **Local (Cursor / PC repo root):** `npm run deploy:package-upload`
- Dry run (no transfer): **Local (Cursor / PC repo root):** `$env:MSC_DEPLOY_DRY_RUN='1'; npm run deploy:upload`
- If your host FTPS cert chain is flaky: **Local (Cursor / PC repo root):** `$env:MSC_FTPS_INSECURE='1'; npm run deploy:upload`

### Operator phrases (chat shortcuts)

Use these phrases with the agent to trigger the exact command flow:

- **"make a new zip build"** -> run **Local (Cursor / PC repo root)** `npm run pushitlive`
- **"upload the zip"** -> run **Local (Cursor / PC repo root)** `npm run deploy:upload`
- **"build and upload in one go"** -> run **Local (Cursor / PC repo root)** `npm run deploy:package-upload`
- **"dry-run upload check"** -> run **Local (Cursor / PC repo root)** `$env:MSC_DEPLOY_DRY_RUN='1'; npm run deploy:upload`

#### Important path rule (jon-beatz.com)

- For FTP user `jonbeatz@jon-beatz.com`, FTP login already lands in the domain root.
- Set `host.remoteAppRoot` to `/` in `.cursor/docs/Deploy-Profile.local.json`.
- Do **not** use `/home/...` or `/jon-beatz.com/` here, or upload will go into the wrong nested folder.

### Post-upload checklist (required before restart)

1. **Live (cPanel File Manager):** open `/home/wjehbnzcoy/jon-beatz.com/` and confirm `final_deploy.zip` exists in that exact root.
2. Extract `final_deploy.zip` **in the same root directory** (do not extract into a subfolder).
3. Sanity check extracted root now contains items like `.next`, `server.js`, `package.json`, `.env`, `payload.sqlite`, `media/`.
4. If extraction accidentally created a wrapper folder, move its contents up to root, then delete the empty wrapper.
5. Delete `final_deploy.zip` after a successful extract to keep the app root clean.
6. Continue with section **2D** (`npm install`, permissions, restart).

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

### E. First-login verification fallback (emergency only)

Use this only when **section 2F** is not configured yet and you need immediate operator access without receiving email.

1. **Live (cPanel -> Terminal):** `cd ~/jon-beatz.com`
2. Run this one-time verify update (replace email if needed):

```bash
python3 - <<'PY'
import sqlite3
db = '/home/wjehbnzcoy/jon-beatz.com/payload.sqlite'
email = 'jonbeatz@gmail.com'.lower().strip()

con = sqlite3.connect(db)
cur = con.cursor()
cur.execute("SELECT id,email,role,is_verified FROM users WHERE lower(email)=?", (email,))
row = cur.fetchone()
print("before:", row)

if row:
    cur.execute("""
      UPDATE users
      SET is_verified = 1,
          verification_token = NULL,
          verification_token_expires = NULL
      WHERE id = ?
    """, (row[0],))
    con.commit()
    cur.execute("SELECT id,email,role,is_verified FROM users WHERE id=?", (row[0],))
    print("after:", cur.fetchone())
else:
    print("No user found for", email)
con.close()
PY
```

3. Sign out/in (or restart app) and confirm login proceeds past `/auth/verify-reminder`.
4. Prefer **section 2F** next so new users receive real verification mail.

### F. Production SMTP for verification (recommended before inviting users)

Verification, welcome, and resend flows use **`MSC_STUDIO_OUTGOING_*`** on the Node process. Configure in **Live (cPanel → Node.js Application Manager → Environment Variables)** then **Restart**. Full variable list and Spacemail defaults: **`FlightPro.md` → §4.1 Production verification email**.

After setting variables, test with a new registration or **Resend verification** from `/auth/verify-reminder` and confirm the message arrives (and the link opens on `https://jon-beatz.com/auth/verify?...`).

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

| Time       | Step                          | Result                    | Notes                                                                                                                                             |
| ---------- | ----------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29 | Local preflight + package     | PASS                      | `deploy:preflight` + `pushitlive` succeeded; `final_deploy.zip` generated.                                                                        |
| 2026-04-29 | Local build inside packaging  | PASS                      | Next build compiled and staged deploy package.                                                                                                    |
| 2026-04-29 | Live baseline route probe     | PARTIAL                   | `/`, `/dashboard`, `/tasks`, `/help` return login shell. `/calendar` currently 404 on live (expected old version gap).                            |
| 2026-04-29 | Live backup                   | SKIPPED (operator choice) | Operator explicitly chose no backup for this cutover.                                                                                             |
| 2026-04-29 | Live clean cutover            | PASS                      | Stop app -> clean root -> upload/extract `final_deploy.zip` -> Run NPM Install -> Start app.                                                      |
| 2026-04-29 | Live route verification       | PASS (auth gate)          | Live app loads; login/verify screen reachable at `jon-beatz.com`. Access blocked by expected email verification gate, not deploy/runtime failure. |
| 2026-04-29 | FTPS upload path correction   | PASS                      | First uploads landed in nested folders; fixed by setting `remoteAppRoot` to `/` for this FTP account.                                             |
| 2026-04-29 | First-login verify workaround | PASS                      | Updated `users.is_verified` for operator account via sqlite in cPanel terminal; login succeeded and dashboard loaded.                             |

## 5) What to improve next deploy

- Add `.cursor/docs/Deploy-Profile.local.json` with real FTP username so preflight warning disappears.
- Keep this file updated with exact failure + fix details after each deployment.
- Complete **section 2F** + **`FlightPro.md` §4.1** on live so SMTP verification replaces SQLite **§2E** workarounds for normal onboarding.
