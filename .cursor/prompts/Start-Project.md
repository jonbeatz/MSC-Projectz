# Start Project — MSC-Projectz ritual

When operator says **Start Project**, **Start Session**, **Cold Start**, or similar:

1. Read `TRUTH.md` — project identity and rules
2. Read `AGENTS.md` — agent orientation
3. Read `REPO-BRAIN.md` — architectural memory
4. Read `.cursor/docs/Session-Snapshots.md` — last session state
5. Read `.cursor/docs/Restore-Points.md` — checkpoint reference

## Startup checks

```powershell
# If dev server is needed
npm run dev

# Verify build integrity after previous session
npm run verify:next:safe
```

## Handshake

"Vader Vault initialized. Standing by, my Lord."
