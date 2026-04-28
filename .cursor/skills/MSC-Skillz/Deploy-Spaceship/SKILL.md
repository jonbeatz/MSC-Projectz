---
name: msc-deploy-spaceship
description: Repo-specific deploy flow for MSC-Projectz on Spaceship/cPanel. Use for packaging, upload guidance, restart sequencing, and post-deploy verification.
---

# Deploy Spaceship

Use this skill for deploy tasks in this repo.

## Canonical deploy path

1. Local preflight:
   - `npm run deploy:preflight`
2. Build/package:
   - `npm run pushitlive`
3. Confirm artifact:
   - `final_deploy.zip` at repo root
4. Upload artifact to server app location.
5. Restart Node app in cPanel.
6. Verify live routes and logs.

## Local vs live boundary

- Local (Cursor/PC repo root): preflight, build/package, git operations.
- Live (cPanel): host shell actions, restart, live checks.
- Do not mix these contexts.

## Guardrails

- Never use missing script names.
- Do not skip preflight unless explicitly requested.
- If deploy docs conflict with scripts, follow `package.json` and patch docs drift immediately.

## Minimum post-deploy report

Return:

1. Artifact/build outcome
2. Restart status
3. Route verification outcome
4. Any follow-up remediation needed
