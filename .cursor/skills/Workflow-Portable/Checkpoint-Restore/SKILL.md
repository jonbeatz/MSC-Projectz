---
name: checkpoint-restore
description: Creates consistent restore points with branch/SHA, working-state notes, and exact rollback commands.
---

# Checkpoint + Restore (Portable)

Use this skill to create fast rollback confidence after meaningful milestones.

## When to add a restore point

- major UI/admin milestone
- deploy stability fix
- schema/migration change
- branch handoff or release checkpoint

## Restore point template

Use this row format in `Restore-Points.md`:

`| RP-YYYY-MM-DD-short-name | YYYY-MM-DD | What worked. Branch/commit: <branch>@<sha>. Restore: <exact commands>. Caveats: <env/deps>. |`

## Required checkpoint data

1. Checkpoint ID
2. Branch + commit SHA
3. What was confirmed working
4. Exact restore commands
5. Caveats (env/dependency/host notes)

## Branch-cut helper flow

1. Confirm working tree status
2. Create new branch from current HEAD
3. Push upstream tracking
4. Confirm branch + status

