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

## Wrapper deprecation plan

- **Deprecation announced:** 2026-04-28
- **Soft-removal target:** after two stable release cycles with no wrapper-only references
- **Hard-removal target:** next major workflow-pack cleanup once all references point to canonical skills

## Wrapper migration checklist

Before removing wrapper folders:

1. Search project docs/rules/prompts for wrapper paths and update to canonical paths.
2. Confirm no automation/scripts reference wrapper skill folders directly.
3. Keep one release cycle with wrappers present after last reference update.
4. Remove wrappers and update this README in the same commit.
