# Quick deploy (jon-beatz.com)

Full detail: **`FlightPro.md`**.

1. Make and commit changes locally.
2. (Recommended) **`npm run verify:next`** so production build is clean before packaging.
3. **`npm run pushitlive`** — builds, stages `deploy_package/` from `msc_package_deploy.mjs` **COPY_PLAN**, writes **`final_deploy.zip`**.
4. Upload **`final_deploy.zip`** (FTP/SFTP) to the server app root.
5. Unzip (e.g. `https://jon-beatz.com/unzip.php` if that helper is deployed and allowed).
6. **cPanel → Node.js Application Manager → Restart** for the site.
7. If something fails, check app **`stderr.log`** and **`FlightPro.md` §5–6** (permissions, `node_modules` on Linux, full `.next`).
