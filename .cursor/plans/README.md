# Project plans (`.cursor/plans`)

**Canonical folder** for MSC-Projectz planning markdown: feature plans, refactor plans, and Plan-mode artefacts you want **in Git** next to `.cursor` config.

Use repo-relative paths such as `.cursor/plans/2026-05-01-feature-x.plan.md`.

---

## Why plans sometimes appear under `C:\Users\…` first

Cursor’s Plan mode often **drafts** files under your **user profile** first, for example:

`%USERPROFILE%\.cursor\plans\`

That is Cursor’s default stash area (global to your Windows user). **There is no supported project setting** (as of common Cursor builds) that retargets that default into this repo automatically. See [forum discussion — plan files location](https://forum.cursor.com/t/plan-files-location/156476/6) for context.

**This repo’s rule:** persist anything important under **this project’s** `.cursor/plans/` folder (path: `MSC-Projectz\.cursor\plans\` from the repo root).

---

## How to get plans into `.cursor/plans/`

### From Cursor UI

1. When a plan is shown, use **Save to workspace**. Cursor usually writes into **` .cursor/plans/` inside this repo**.
2. If a draft only exists under `%USERPROFILE%\.cursor\plans`, **copy or move** it into **`\<repo>\.cursor\plans\`** so it is versioned with the project.
3. Commit as usual.

### From the agent (markdown)

Ask the assistant to **`Write`** new plan files directly under **`.cursor/plans/`**.

Suggested names: `YYYY-MM-DD-short-topic.plan.md`.

---

## Relationship to `%USERPROFILE%\.cursor\plans`

- **Project home (tracked in Git):** **`.cursor/plans/`** here.
- **User profile folder:** scratch/drafts; copy into **`.cursor/plans/`** before closeout when the plan matters for the repo.
