# Flight plan: jon-beatz.com

Short checklist. **Authoritative SOP:** **`FlightPro.md`**.

## 1. Local build (PC)

- [ ] `.env` present (from `.env.example`) with real secrets only on your machine.  
- [ ] **`DATABASE_URL`** = `file:./payload.sqlite` (Payload reads this in `payload.config.ts`).  
- [ ] **`NEXT_PUBLIC_SITE_URL`** = your public origin, e.g. `https://jon-beatz.com` (used by vault/server URL helpers).  
- [ ] `npm run build` succeeds, or use **`npm run pushitlive`** to build+zip in one go.  
- [ ] `server.js` + `.next` + `package.json` will be on the server after unzip (see `msc_package_deploy.mjs` **COPY_PLAN**).

## 2. cPanel / Node (example variables)

Do **not** copy secrets from this table into chat or commits. Set values in cPanel to match your real `.env`.

| Variable | Purpose |
| :--- | :--- |
| `NODE_ENV` | `production` on the host |
| `PAYLOAD_SECRET` | Long random string (match local/prod policy) |
| `DATABASE_URL` | `file:./payload.sqlite` (or host-specific path if different) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, e.g. `https://jon-beatz.com` |

## 3. Server activation (paths vary by account)

- Use cPanel **Node.js Application Manager** for the domain.  
- **Document root** and **nodevenv** paths are host-specific; when SSH/cPanel examples appear in this repo, replace home/user segments with *your* cPanel paths.  
- After deploy, **Restart** the app; check `stderr.log` in the app directory if the process exits.

## 4. Unzip + permissions

- Upload **`final_deploy.zip`**, extract on server, **Restart** Node.  
- If you see permission errors, apply folder **755** / file **644** rules from **`FlightPro.md` §5**.
