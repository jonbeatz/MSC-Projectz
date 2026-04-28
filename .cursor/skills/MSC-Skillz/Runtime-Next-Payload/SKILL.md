---
name: msc-runtime-next-payload
description: Next.js + Payload runtime execution standards for MSC-Projectz. Use for app/router/component/lib changes, local recovery, and verify/dev smoke loops.
---

# Runtime Next + Payload

Use this skill for runtime-impacting work in this repo.

## Scope

- Applies to changes under `app/`, `components/`, `lib/`, `collections/`, config, and runtime scripts.
- Does not replace global authority docs/rules; it operationalizes them.

## Required flow

1. Make scoped code changes.
2. Run build gate:
   - `npm run verify:next`
   - or `npm run verify:next:safe` when port 3000 may be in use.
3. Ensure dev is running after verify:
   - `npm run dev`
4. Smoke check:
   - `http://127.0.0.1:3000/`
   - `http://127.0.0.1:3000/admin`

## Recovery flow

When localhost is broken (`ERR_CONNECTION_REFUSED`, 500s, missing chunks):

1. `npm run dev:recover`
2. Re-run smoke checks.
3. If still broken, run manual clean sequence per `.cursor/rules/local-runtime-recovery.mdc`.

## Guardrails

- Never invent script names; confirm in `package.json`.
- Do not run live/server commands for local runtime repair.
- If behavior and docs conflict, fix docs/rules drift in the same session.
