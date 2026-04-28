---
name: msc-ui-command-center
description: Command Center UI/UX rules for MSC-Projectz. Use for dashboard, focus drawer, modal layering, and visual consistency changes.
---

# UI Command Center

Use this skill for dashboard/workspace UI changes.

## Core interaction model

- Keep dashboard grid as stable base layer.
- Use overlay-first focus workflow on project selection.
- Nested actions should use centered modal dialogs, not drawer-on-drawer.
- Preserve predictable close behavior:
  - dialog closes back to focus drawer
  - focus drawer closes back to dashboard

## Visual consistency

- Use existing design tokens and utility classes; avoid ad-hoc hardcoded styles.
- Keep controls readable in hover/focus/active states.
- Maintain clear separation between primary actions and destructive actions.
- Preserve accessibility basics (`focus-visible`, contrast, pointer affordance).

## Regression checklist

Validate before done:

1. Dashboard card click opens expected focus state.
2. Task/Code interactions render without layout squish/collapse.
3. Nested create/edit flows open correct modal layer.
4. Keyboard and mouse interactions remain consistent.

## Scope boundary

This skill governs UX behavior and composition patterns; runtime/build/deploy validation still follows runtime/deploy skills and repo rules.
