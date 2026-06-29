---
name: nova
description: >-
  NovaMira implementation conventions for WordPress/Divi and related stacks:
  naming, security, query standards, media path discipline, Divi integration,
  and delivery validation. Use for NovaMira/MSC code and technical reviews.
---

# NovaMira Implementation Skill

Use this for NovaMira/MSC technical work where code conventions and delivery safety matter.

## Scope gate (important)

- Use this skill when the task involves WordPress/Divi (or NovaMira assets that share those conventions).
- If the active repo/task is non-WordPress (for example Next.js/Payload app runtime work), defer to project rules/docs first:
  - `.cursorrules`
  - `.cursor/docs/Docs-Architecture.md`
  - `.cursor/skills/Workflow-Portable/*`

## Scope and authority

1. Follow project-wide rules first (`.cursorrules`, `.cursor/rules/*`).
2. This skill governs NovaMira implementation details (WordPress/Divi + related code patterns).
3. For visual language, use `.cursor/skills/NovaMira-Design/SKILL.md`.

## Core conventions

- **PHP naming:** prefix custom symbols with `msc_`.
- **CSS naming:** namespace custom selectors with `msc-` or `nm-`.
- **WP bootstrap guard:** start PHP files with:
  ```php
  defined( 'ABSPATH' ) || exit;
  ```
- **Media paths:** use project-safe relative paths (for web assets, prefer `/media/...` conventions used by the project).

## Security and data standards

- Use nonces for AJAX/REST operations that mutate state or expose privileged data.
- Prefer `WP_Query` or higher-level APIs; do not use `query_posts`.
- Use `'no_found_rows' => true` when pagination counts are unnecessary.
- Prefer PHP-defined field groups (`acf_add_local_field_group`) for critical, portable schemas.

## Divi / content integration rules

- Prefer native Divi/DiviGear module flows over brittle Code-module interception.
- Prefer Featured Image over duplicate ACF image fields unless art direction requires otherwise.
- Keep filter behavior and AJAX aligned with plugin-native expectations.

## UI implementation carry-overs (technical)

- Grid thumbnails should preserve 16:9 ratio where project cards/shows use media previews.
- Interactive elements must have explicit pointer affordance and consistent transition timing.
- Keep filter-pill styling consistent with project design skill guidance (Red for DiviGear filter semantics).

## Delivery checklist

Before completion, validate:

1. Responsive behavior at phone + tablet breakpoints.
2. Lazy loading for below-the-fold images where appropriate.
3. Contrast and keyboard accessibility for actionable UI.
4. Meaningful `alt` text on semantic images.

## Non-override rule

If an active legacy project uses a different established namespace/pattern, do not mass-refactor without an explicit migration task.
