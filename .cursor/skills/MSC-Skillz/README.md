# MSC-Skillz

Project-specific skill pack for `MSC-Projectz` (Next.js + Payload + local ops).

## Canonical skills

- `Runtime-Next-Payload` - runtime architecture, build/recovery, and verification flow.
- `UI-Command-Center` - dashboard/focus workspace UX patterns and interaction rules.
- `MSC-Master-UI-UX` - consolidated UI/UX quality gate from top external skill patterns, tuned for this repo.
- `Docs-Ops-Authority` - command/docs authority and low-drift documentation updates.
- `Deploy-Spaceship` - deploy flow for this repo (`deploy:preflight` -> `pushitlive`).

## Usage flow (default)

1. Start with `Runtime-Next-Payload` for runtime-impacting changes.
2. Apply `UI-Command-Center` for command-center composition and overlay behavior.
3. Run `MSC-Master-UI-UX` quality gates before final sign-off.
4. Use `Docs-Ops-Authority` to resolve drift and update docs/rules in the same session.
5. Use `Deploy-Spaceship` only for deploy tasks.

## Quality-gate escalation (required)

- Runtime verify/build success is necessary but not sufficient.
- If UI is affected, release readiness also requires:
  - accessibility gate pass,
  - state completeness (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`, `empty`),
  - modality parity (keyboard, pointer, touch),
  - responsive/theme parity and overflow checks.
- Accessibility or state-flow regressions are release blockers until fixed.

## Authority model

- Command/script truth: `package.json` (always authoritative for runnable command names).
- Policy/order truth: `.cursorrules` and `.cursor/rules/*.mdc`.
- Canonical docs map: `.cursor/docs/Docs-Architecture.md`.

If any skill text conflicts with these authorities, follow them and update the skill in the same session.

## Maintenance rule

- Keep `MSC-Skillz` repo-specific and practical; do not import external brand/style systems directly.
- Cherry-pick transferable patterns (quality checks, review structure, testable criteria), then adapt to current repo conventions.
