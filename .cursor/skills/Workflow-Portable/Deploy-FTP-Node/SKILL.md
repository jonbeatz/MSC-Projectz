---
name: deploy-ftp-node
description: Portable deploy protocol for PC-side upload tools and server-side Node restart flows with preflight and post-deploy verification.
---

# Deploy FTP + Node (Portable)

Use this skill for projects that deploy from local machine to a hosted Node app via FTP/SFTP and restart from hosting panel.

## Golden split

- **Local machine:** build + upload commands.
- **Server terminal/panel:** install deps (if needed), restart app.

Never run local uploader commands on the server shell.

## Standard safe flow

1. Optional preflight check (`verify:local` equivalent).
2. Build locally.
3. Upload full build artifact/folder (`.next` equivalent for Next.js).
4. Upload changed runtime/config files (if applicable).
5. Server-side: dependency install only if lock/deps changed.
6. Restart Node app from hosting panel.
7. Validate live in private/incognito window.

## Critical guardrails

- Do not partially upload random files from a compiled build output.
- If server build folder is deleted, re-upload immediately before restart.
- Keep patch files present if postinstall uses patch tooling.

## Post-deploy output requirement

Always return:

1. Upload completion summary (counts, failures).
2. Exact next action (restart app).
3. Link(s) to server panel pages if provided by project docs.

