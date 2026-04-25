---
name: session-closeout
description: End-of-day closeout workflow with docs sync, guarded commit/push, optional deploy, and local service shutdown.
---

# Session Closeout (Portable)

Use this skill when ending a session or handing work off.

## Closeout modes

- **Safe closeout:** docs update + commit/push + stop local services.
- **Closeout + deploy:** safe closeout, then deploy flow.

## Safe closeout checklist

1. Summarize working tree changes by type.
2. Update core docs if behavior changed.
3. Draft commit message focused on why.
4. Ask for confirmation before commit/push.
5. Commit and push to current branch.
6. Stop local dev listeners/processes.
7. Provide next-start checklist.

## Optional deploy extension

After safe closeout, ask confirmation, then run project deploy command (e.g. `pushit:live`).

Always end with:

- exact cPanel/server restart step
- live verification checklist

