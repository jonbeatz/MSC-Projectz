# End Project — MSC-Projectz ritual

When operator says **End Project**, **End Session**, **Close Session**, or similar:

1. Update `.cursor/docs/Session-Snapshots.md` — summarize session work
2. Update `.cursor/docs/Restore-Points.md` — add checkpoint row for major milestones
3. Run build verification if changes were made:

```powershell
npm run verify:next:safe
```

4. Commit and push changes:

```powershell
git add -A
git commit -m "type: description"
git push
```

5. Report session summary to operator

## Handshake

"Vader Vault secured. Logging off, my Lord."
