---
name: msc-docs-ops-authority
description: Documentation and operations authority rules for MSC-Projectz. Use when updating docs, scripts references, checkpoints, or workflow instructions.
---

# Docs Ops Authority

Use this skill when docs or workflow guidance are being edited.

## Authority rules

1. `package.json` is command truth.
2. `.cursor/docs/Docs-Architecture.md` is canonical docs map.
3. `.cursorrules` and `.cursor/rules/*.mdc` define persistent operating policy.

## Required behavior for docs updates

- Keep edits focused to canonical docs first.
- Remove/avoid duplicated instructions across multiple docs.
- Archive redundant docs rather than deleting useful history.
- If commands or paths changed, update docs in the same session.

## Minimal update set (when relevant)

- `START-HERE.md`
- `Session-Snapshots.md`
- `Development-Roadmap.md`
- `Agent-Runbook.md`
- `FlightPro.md`
- `Restore-Points.md`

## Closeout expectations

- Add snapshot entries for meaningful workflow milestones.
- Add restore-point entries for rollback-worthy milestones.
- Keep commit messages focused on why/operational impact.
