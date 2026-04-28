# MSC Media / Vault Thumbnails — Retrospective (for next attempt)

Internal notes from the **2026-04** push to move vault project thumbnails onto Payload **`media`**, optional flat **`./media`** layout, and **`repair:sqlite`** alignment. Use this before retrying so we avoid repeating the same traps.

---

## What we were trying to do

1. **Vault thumbnails as real Media rows** — `thumbnail` as a **relationship** to `media` instead of only a giant TEXT field (URLs / `data:` URLs).
2. **`legacy_thumbnail_backup`** — keep a copy of old text thumbnails for rollback during migration.
3. **Optional: flat `./media`** — `upload.staticDir: 'media'` instead of `media/msc_projects/` (organizational only).
4. **`npm run migrate:thumbnails`** — materialize `data:` URLs to files + create `media` docs + set relation.
5. **`npm run repair:sqlite`** — non-interactive SQLite fixes when Drizzle **`push`** would block on Windows/CI.

---

## Problems we hit (symptoms → causes)

### 1. “Rendering…” / “Syncing vault…” / dashboard never finishing

- Often **not** the React string “Rendering…” alone — **vault hydration** waits on **`vaultHydrated`** and successful Payload/API responses.
- **`hydrateVaultFromPayload`** had a path where a **stale tenant response** returned **without** setting **`vaultHydrated: true`** → infinite “Syncing vault…” (fixed in code during that session: always set **`vaultHydrated: true`** when bailing on stale data).

### 2. `/admin` timeouts, **`curl` exit 28**, **`admin:000`**

- **Drizzle interactive prompts** during **`next dev`** (“create column vs rename”, “accept data loss”, **delete `thumbnail` column**). When stdin isn’t a real TTY, the server can **block**; **`getPayload()`** never completes → **login (`msc_login`) hangs** on **`await getPayload({ config })`** with **`fetch` pending**.

### 3. **`SQLITE_ERROR: no such column: thumbnail`** vs **`no such column: thumbnail_id`**

- **Schema drift** between **Payload collections** and **local `payload.sqlite`**:
  - Old DB: **`thumbnail`** as **TEXT** (legacy).
  - New code: relationship column **`thumbnail_id`** (+ optional **`legacy_thumbnail_backup`**).
  - Partial migrations left **both** or **neither**, so Drizzle **`SELECT`** failed in **`onInit`** / vault queries.

### 4. **`index … already exists`** (e.g. **`msc_vault_projects_user_idx`**)

- **Duplicate dev servers** or repeated **`push`** trying **`CREATE INDEX`** again → **`getPayload`** fails during init → **500 on login**.

### 5. **`migrate:thumbnails` / CLI scripts failing under `tsx`**

- **`payload/dist/bin/loadEnv.js`** used **`import default from '@next/env'`**; **tsx** left **`default` undefined** → **`loadEnvConfig`** destructuring threw.
- **Fix that worked:** patch **`node_modules/payload/dist/bin/loadEnv.js`** to **`import * as nextEnvImport from '@next/env'`** and persist with **`patch-package`** (**`patches/payload+3.84.1.patch`** + **`postinstall`**).
- **`server-only`** import from collections → CLI outside Next threw or couldn’t resolve → **`scripts/msc_cli_module_hooks.ts`** + **`msc_server_only_stub.cjs`** (**`Module._resolveFilename`**) so **`migrate-thumbnails`** could load **`payload.config`**.

### 6. **`git reset --hard` + “go back to FullDev-v7” vs local DB**

- **Git** restored **code** to **`origin/MSC-Projectz-FullDev-v7`**, but **`payload.sqlite` is not in Git** (typically gitignored).
- DB had already been migrated (e.g. **`thumbnail`** dropped); **v7 code** still queried **`thumbnail`** → **`no such column: thumbnail`** until DB restored from a **`.bak`** that still matched that schema.

---

## Things we tried that helped

| Approach | Why it helped |
|----------|----------------|
| **`npm run repair:sqlite`** extended with **`legacy_thumbnail_backup`**, **`thumbnail_id`**, backfills from legacy **`thumbnail` TEXT** | Avoids some Drizzle “missing column” prompts; aligns DB without GUI |
| **`ALTER TABLE … DROP COLUMN thumbnail`** (after backup + **`thumbnail_id`** / **`legacy_thumbnail_backup`**) | Stops Drizzle from prompting to **delete** the legacy column (which blocked stdin) |
| **`migrate:thumbnails`** with **`PAYLOAD_MIGRATING`**, **`disableOnInit`** where applicable | Safer one-off migration |
| **`npm run db:list-vault-thumbs`** | Quick sanity check of relation vs legacy fields |
| **`payload.sqlite.bak.*` backups** (repair script timestamps) | Restore points when schema experiments go wrong |
| **`patch-package`** for Payload **`loadEnv`** | Makes **`tsx`** CLI scripts usable again after **`npm install`** |

---

## Recommended order next time (operator checklist)

1. **Backup DB:** copy **`payload.sqlite`** to something like **`payload.sqlite.before-media-v2`**.
2. **One dev server on 3000** — avoid overlapping **`next dev`** (duplicate push / duplicate indexes).
3. **Implement schema + collections** on a branch; run **`npm run repair:sqlite`** until **`PRAGMA table_info(msc_vault_projects)`** matches what Payload expects.
4. **Run `migrate:thumbnails`** (with **`patch-package`** + CLI hooks if still required).
5. **`npm run verify:next:safe`** before declaring victory.
6. **If reverting code via Git:** restore a matching **`payload.sqlite`** from **`.bak`** or re-run **`repair:sqlite`** / migrations — **code and DB must move together**.

---

## Quick verification commands (Local, repo root)

```bash
npm run repair:sqlite
npm run db:list-vault-thumbs   # if script exists on branch
npm run verify:next:safe
npm run dev
```

SQLite (if **`sqlite3` CLI** installed):

```sql
PRAGMA table_info(msc_vault_projects);
```

---

## Files / areas that were central (reference for future diffs)

- `collections/MSC-Projectz-VaultProjects.ts` — `thumbnail` relationship, `legacy_thumbnail_backup`
- `collections/MSC-Projectz-Media.ts` — `upload.staticDir`
- `scripts/msc_sqlite_repair_vault_schema.mjs` — non-interactive repairs
- `scripts/migrate-thumbnails.ts` — data URL → `media` files (when present)
- `lib/msc_map_vault.ts` — mapping Payload docs → UI `Project.thumbnail`
- `lib/store.ts` — vault hydration / `vaultHydrated`
- `lib/msc_vault_server_actions.ts` — `msc_login` → `getPayload`

---

## TL;DR for the next session

1. **SQLite + Payload schema must stay in lockstep** — use **`repair:sqlite`** and avoid leaving stray legacy columns that Drizzle wants to drop interactively.
2. **CLI scripts that import `payload.config`** may need **`@next/env`** + **`server-only`** workarounds (or official upstream fixes).
3. **Git rollback ≠ database rollback** — always pair branch resets with a **`payload.sqlite`** backup from the same era as the code.
