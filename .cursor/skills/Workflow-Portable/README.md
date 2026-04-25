# Workflow-Portable Skills

Portable skills pack for reusing this workflow in other Cursor projects.

## What is included

- `Workflow-Ops` - trigger-command operating model (`Lets Start`, `Lets Continue`, `Lets Finish`, etc.)
- `Deploy-FTP-Node` - local-build/upload + server-restart deployment split
- `Docs-Governance` - source-of-truth docs order and drift audits
- `Checkpoint-Restore` - restore-point format and rollback discipline
- `Session-Closeout` - end-of-session docs/commit/push/stop flow

## How to copy into a new project

1. Copy this folder into the new project:
   - from: `.cursor/skills/Workflow-Portable/`
   - to: `.cursor/skills/Workflow-Portable/`
2. Ensure each subfolder keeps its `SKILL.md` path unchanged.
3. Create or update these core docs in the new project:
   - `.cursor/docs/START-HERE.md`
   - `.cursor/docs/Agent-Runbook.md`
   - deploy/hosting guide (project-specific)
   - command list (`npm` scripts or equivalent)
4. In the new `START-HERE.md`, define source-of-truth order.

## Recommended source-of-truth order

1. `START-HERE.md`
2. `Agent-Runbook.md`
3. deploy/hosting doc (project-specific)
4. commands reference
5. `Restore-Points.md`

## Recommended prompts in new projects

- `Lets Start`
- `Lets Continue`
- `Run verify:local and show pass/fail only`
- `Lets Push It Live`
- `Lets Push It Live (Safe)`
- `Lets Checkpoint Docs + Commit`
- `Lets Finish`

## Operator handshake pattern

At the start of recognized runbook flows, return:

- `Ok <Name> - <what was recognized>. <what will run next>.`

Example:

- `Ok Jon - recognized "Lets Push It Live (Safe)". Running preflight verify first, then deploy if checks pass.`

## Porting checklist

- Update deploy commands to match the new project (`npm`, `pnpm`, or custom scripts).
- Replace hosting links and restart instructions with the new provider.
- Update restore point template fields if your team needs ticket/release IDs.
- Confirm no doc contradictions after first real deploy.
