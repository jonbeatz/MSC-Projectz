# Scripts Inventory

This folder contains utility scripts for local development, recovery, data maintenance, and deploy preflight.

## Canonical scripts (actively used by `package.json`)

- `deploy_profile_check.mjs`
- `kill-dev-port.mjs`
- `local-http-smoke.mjs`
- `msc_delete_gate_test_users.mjs`
- `msc_media_usage_cleanup.ts`
- `msc_playwright_command.mjs`
- `msc_playwright_open_session.mjs`
- `msc_playwright_test.mjs`
- `msc_promote_user_to_master.mjs`
- `msc_rescue_admin.ts`
- `msc_seed_data.ts`
- `msc_sqlite_repair_vault_schema.mjs`

## Compatibility aliases in `package.json`

- `dev:fresh` -> alias to `dev:recover`
- `smoke:local` -> alias to `verify:local`
- `media:cleanup:run` -> alias to `media:cleanup:apply`
- `package:production` -> alias to `package:deploy`

## Archived one-time migration / forensic scripts

These scripts were moved to `scripts/archive/` and are not part of normal workflows:

- `archive/msc_backfill_project_thumbnails_to_media.ts`
- `archive/msc_cleanup_legacy_project_thumbnails.ts`
- `archive/msc_sync_media_files_to_collection.ts`
- `archive/msc_playwright_manual_clients_glass_check.mjs`
- `archive/msc_package_for_production.mjs` (deprecated; `package:production` now aliases to `package:deploy`)

If one-time scripts are re-used, promote them to canonical scripts and add an explicit `package.json` command.
