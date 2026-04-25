# Restore Points

Use this file for fast recovery after meaningful milestones. Keep entries short and include exact restore commands.

| Checkpoint | Date | Notes |
| --- | --- | --- |
| RP-2026-04-25-command-center-routes | 2026-04-25 | Route-based Command Center refactor is committed and pushed. Branch/commit: `MSC-Projectz-v2@8602e72fb89b09523e87ad12b7c4179a9f262fec`. Remote: `origin` -> `https://github.com/jonbeatz/MSC-Projectz.git`. Confirmed: `npm run verify:next` passed; local smoke checks returned `200` for `/`, `/dashboard`, `/profile`, `/help`, and `/settings`. Restore: `git fetch origin && git switch MSC-Projectz-v2 && git reset --hard 8602e72fb89b09523e87ad12b7c4179a9f262fec && npm install && npm run dev`. Caveats: one local SQLite backup was intentionally left uncommitted: `payload.sqlite.bak.2026-04-25T18-38-26-162Z`. |
