# Docs Architecture (Canonical Set)

This file defines the active documentation system for `MSC-Projectz`.

## Canonical docs (read order)

1. `START-HERE.md`
2. `Session-Snapshots.md`
3. `Development-Roadmap.md`
4. `Agent-Runbook.md`
5. `FlightPro.md`
6. `Spaceship.md`
7. `Deploy-Profile.template.json` + `Deploy-Profile.local.example.json`
8. `Deploy-Secrets-Workflow.md`
9. `Restore-Points.md`

## Folder purpose

- `docs/` -> active canonical docs and current runbooks.
- `docs/incidents/` -> incident deep-dives and forensic notes.
- `docs/reports/` -> JSON or generated report artifacts.
- `docs/archive/<date>-<topic>/` -> retired docs kept for history.

## Cleanup completed (2026-04-28)

Archived to `docs/archive/2026-04-28-docs-audit/`:

- `Daily-Ops-Cheat-Sheet.md`
- `Project-Truth.md`
- `Jedi-List.md`
- `ReCall.md`
- `MasterSetUp.md`
- `Flight.md`
- `DeployUpdate.md`

## Reference (not part of canonical read order)

- **`Tech.md`** — technology inventory, version snapshot, and prioritized learning map for the stack.
- **`.cursor/plans/`** ([`../plans/README.md`](../plans/README.md)) — canonical planning artefacts in Git (README describes Cursor profile draft path vs repo rules).
- **`../../_design_references/README.md`** — design snapshots / v0 reference; not part of the build (see README).

## Update rule

When documentation changes, update canonical docs first. Avoid duplicating SOP steps across multiple files; prefer one authoritative file and cross-reference it.

Authority note: this file owns canonical docs order. Other docs/rules may reference this order but should not redefine a conflicting sequence.
