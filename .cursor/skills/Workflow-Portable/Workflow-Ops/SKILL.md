---
name: workflow-ops
description: Trigger-command router for startup, continue, deploy, checkpoint, and finish flows with handshake and authority checks.
---

# Workflow Ops (Portable, Canonical)

Use this skill as the single trigger router for operator phrases and day-flow orchestration.

## Non-negotiable authority

Before executing any flow:

1. Trust `package.json` for command names.
2. Trust `.cursor/docs/Docs-Architecture.md` for docs order.
3. If either is missing, fall back to project `START-HERE.md`.

## Operator handshake

At recognized flow start, send once:

- `Ok <OperatorName> - <recognized command>. <one-line action plan>.`

Do not repeat the handshake on every follow-up message.

## Recognized trigger commands

- `Ready to begin`
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

## Routing map

- **Start/Continue triggers** -> run startup checks and context load from canonical docs.
- **Deploy triggers** -> route to `Deploy-Profile-Package`.
- **Checkpoint/Finish triggers** -> route to `Session-Handoff-Restore`.

## Required behavior

1. Confirm workspace root before any command.
2. Show short progress updates during long-running steps.
3. Use explicit confirmation before destructive/high-impact operations (commit, push, deploy, branch surgery).
