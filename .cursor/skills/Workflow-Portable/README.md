# Workflow-Portable Skills

Portable workflow pack with a reduced, low-drift core.

## Active skills (canonical)

- `Workflow-Ops` - trigger routing and operator handshake.
- `Session-Handoff-Restore` - closeout + checkpoint/restore discipline.
- `Deploy-Profile-Package` - repo-first deploy flow with script/docs authority.

## Authority rules (all skills)

1. `package.json` is command truth.
2. `.cursor/docs/Docs-Architecture.md` is docs-map truth.
3. If docs conflict, follow the project's canonical order and update drift in the same session.

## Compatibility folders

Legacy folders are kept as wrappers for backward compatibility:

- `Checkpoint-Restore`
- `Session-Closeout`
- `Deploy-FTP-Node`
- `Docs-Governance`

Each wrapper redirects to one of the active canonical skills above.
