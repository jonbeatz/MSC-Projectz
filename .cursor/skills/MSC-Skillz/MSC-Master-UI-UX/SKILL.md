---
name: msc-master-ui-ux
description: Consolidated UI/UX quality gate for MSC-Projectz interfaces. Use for screen design/review in dashboards, forms, tables, modals, and navigation flows.
---

# MSC Master UI/UX

Use this skill when implementing or reviewing UI/UX changes in this repo.

## Authority and scope

1. Follow `.cursorrules` and `.cursor/rules/*.mdc` first.
2. Use this as a practical quality-gate layer for interface decisions.
3. Applies to Next.js/Payload command-center surfaces (dashboard, focus drawers, forms, settings, tables, modals, nav).
4. Keep this output order for reviews/specs: context/goals -> foundations -> component rules -> accessibility criteria -> anti-patterns -> QA checklist.

## 1) UI type classifier

Before judging quality, classify the change:

- `dashboard` / `workspace`
- `form` / `settings`
- `table` / `list`
- `modal` / `drawer` / overlay
- `navigation` / command flow
- `empty/loading/error/success` state

Then run only the relevant checks from sections 2-7.

## 2) Preflight design checks (before coding)

Confirm:

1. Primary user action is explicit.
2. Screen has clear success criteria.
3. Information priority is obvious (no equal-weight noise).
4. Failure/recovery path exists.
5. Navigation and escape path are predictable.

If these are unclear, stop and simplify first.

Also restate design intent in one sentence before implementing.

Preflight documentation requirement:

- rules must be testable with a token, threshold, or concrete example (avoid adjective-only guidance),
- interaction expectations should be captured for keyboard, pointer, and touch.

## 3) Build guardrails (implementation quality)

- Keep cognitive load low (progressive disclosure over crowded panels).
- Use token-first styling; avoid one-off hardcoded visual values.
- Maintain strong interaction affordance (hover/focus/disabled states).
- Keep destructive actions visually distinct from primary actions.
- Prefer composable, reusable UI primitives over bespoke one-offs.
- Define component anatomy, variants, and behavior before polishing visuals.
- Use concrete constraints (sizes, spacing, breakpoints, state behavior), not vague adjectives.

## 3.1) Component state completeness (required)

For each affected component/surface, explicitly verify relevant states:

- default
- hover
- focus-visible
- active/pressed
- disabled
- loading
- error
- empty

If a state is not applicable, state why.

Edge-case coverage is also required:

- long labels/content wrapping
- empty dataset states
- overflow behavior in constrained containers
- failure recovery path

## 4) Accessibility gate (ship-blocking)

Verify:

- labels and field descriptions are present,
- keyboard navigation works end-to-end,
- `:focus-visible` states are visible,
- headings/landmarks are sensible,
- contrast is readable in dark and light contexts,
- semantic HTML is preferred before ARIA,
- ARIA is used only where needed and correctly.

Any critical accessibility failure blocks ship.

## 5) Responsive + theme parity gate

Test at least:

- `375`, `428`, `768`, `1280`, `1536`

Check:

- no overflow/collapse regressions,
- overlay/dialog sizing is usable on small screens,
- dark/light states preserve readability and hierarchy,
- no token mismatch causing hidden/low-contrast text.
- no horizontal scroll on mobile unless intentionally designed.

## 6) Flow + form quality gate

For flows/forms, verify:

- validation timing is sensible,
- errors are clear and near the source,
- submit controls prevent accidental double-submit,
- loading/success/error/empty states all exist,
- users can recover without dead ends.

## 6.1) Practical UI anti-pattern checks

Check for these common quality failures:

- interactive cards/buttons missing pointer affordance,
- hover effects that cause layout shift,
- inconsistent icon sets/sizes within one surface,
- content hidden behind fixed headers/toolbars,
- weak light-mode contrast caused by overly transparent surfaces.

## 7) Postflight verification loop

Before calling done:

1. Visual pass (layout + states + hierarchy).
2. Console pass (no new relevant errors).
3. Interaction pass (click, keyboard, close/open cycles).
4. Regression pass for related surfaces.
5. Theme pass (light + dark) and viewport pass (mobile + desktop).

## 7.1) Quality gate language

- Use **must** for non-negotiable requirements.
- Use **should** for recommendations.
- Pair major do-rules with at least one anti-pattern/don't example in reviews.
- If aesthetics conflict with accessibility, accessibility wins.
- For new patterns, include one migration note for legacy/inconsistent surfaces.

## 8) Severity and output format

Report findings in this structure:

- `findings` (ordered by severity: critical -> major -> minor)
- `strengths`
- `priority_fixes` (top 1-3)
- `ship_ready` (`yes`/`no`)
- `notes`

Keep fixes specific and measurable.

When possible, include acceptance criteria that can be tested in implementation (not preference-only wording).
