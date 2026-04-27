# Deploy Secrets Workflow

Use this workflow to keep deploy credentials available to operators/agents without storing plaintext secrets in repo docs.

## Policy

- Do not store plaintext production secrets in tracked files.
- Keep non-secret connection details in `Deploy-Profile.template.json`.
- Keep account-specific non-secret overrides in local-only `Deploy-Profile.local.json` (gitignored).
- Keep secrets encrypted at rest in `.cursor/docs/Deploy-Secrets.enc` (gitignored by default in this repo policy).

## Required secret set (example)

- FTP/FTPS password
- `PAYLOAD_SECRET`
- `RESEND_API_KEY`
- Any provider API keys used in production

## Recommended local files

- `.cursor/docs/Deploy-Profile.local.json` (non-secret override, gitignored)
- `.cursor/docs/Deploy-Secrets.enc` (encrypted payload, gitignored)
- `.cursor/docs/Deploy-Secrets.key` (local decrypt key, gitignored)

## Encryption/decryption pattern

Use your preferred encryption toolchain (age, gpg, or team standard). Example command shape:

```bash
# encrypt (example shape only)
encrypt-tool --in deploy-secrets.plain.json --out .cursor/docs/Deploy-Secrets.enc --key-file .cursor/docs/Deploy-Secrets.key

# decrypt (example shape only)
encrypt-tool --decrypt --in .cursor/docs/Deploy-Secrets.enc --out deploy-secrets.plain.json --key-file .cursor/docs/Deploy-Secrets.key
```

Do not commit plaintext `deploy-secrets.plain.json`.

## Rotation procedure

1. Rotate provider-side credential first (host/app/API provider).
2. Update local encrypted payload.
3. Verify local deploy and runtime checks.
4. Update `Session-Snapshots.md` with:
   - what secret class was rotated (not the value),
   - reason,
   - validation result.

## Agent behavior

When an agent needs deploy credentials:

1. Read `Project-Truth.md` + deploy profile docs first.
2. Ask for decryption/access step if secret is unavailable.
3. Never print secret values in chat, commits, or docs.
