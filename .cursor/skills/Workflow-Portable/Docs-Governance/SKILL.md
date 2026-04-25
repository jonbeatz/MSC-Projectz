---
name: docs-governance
description: Keeps docs coherent by enforcing a source-of-truth order, classifying core vs optional docs, and running drift audits.
---

# Docs Governance (Portable)

Use this skill to keep project documentation fast, coherent, and low-contradiction.

## Core approach

Maintain a small **core docs set** for daily use, plus optional/archive docs for deep reference.

## Required artifacts

1. `START-HERE.md` (entrypoint + source order)
2. `Agent-Runbook.md` (copy/paste triggers)
3. deploy/host doc (e.g. `Spaceship.md`)
4. command reference (e.g. `Jedi-List.md`)
5. restore/checkpoint log (e.g. `Restore-Points.md`)

## Governance rules

- If docs conflict, follow source-of-truth order from `START-HERE.md`.
- Keep command behavior synced with `package.json` scripts.
- Remove obsolete docs that duplicate current instructions.
- Avoid long repeated history in daily-operational docs.

## Drift audit checklist

1. Compare runbook prompts vs real scripts.
2. Compare deploy docs vs actual deploy command.
3. Confirm operator/profile handshake rules are present.
4. Confirm cPanel/server links or access path are current.
5. Update one-line summaries in core docs after major changes.

