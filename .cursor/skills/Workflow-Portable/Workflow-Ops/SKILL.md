---
name: workflow-ops
description: Portable trigger-command workflow for daily start, continue, deploy, and finish routines with confirmation gates and operator handshake.
---

# Workflow Ops (Portable)

Use this skill to run a repeatable daily operator workflow in any project.

## Operator handshake

Start each recognized trigger flow with:

- `Ok <OperatorName> - <recognized command>. <one-line action plan>.`

Only do this once at flow start (not every follow-up).

## Recognized trigger commands

- `Lets Start`
- `Lets Continue`
- `Lets Push It Live`
- `Lets Push It Live (Safe)`
- `Lets Verify Live`
- `Lets Checkpoint Docs + Commit`
- `Lets Checkpoint + Deploy`
- `Lets Cut New Branch`
- `Lets Finish`
- `Lets Finish + Deploy`

## Required behavior

1. Confirm workspace root before running commands.
2. Use source-of-truth docs in project-defined order.
3. Use confirmation gates before:
   - commit
   - deploy
   - branch deletion/rename
4. Prefer short status updates during long-running steps.

## Suggested docs order (if project does not override)

1. `START-HERE.md`
2. `Agent-Runbook.md`
3. `Spaceship.md` (or host/deploy equivalent)
4. `Jedi-List.md` (or commands equivalent)
5. `Restore-Points.md`

