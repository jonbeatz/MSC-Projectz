---
name: msc-ui-command-center
description: Command Center UI/UX rules for MSC-Projectz. Use for dashboard, focus drawer, modal layering, and visual consistency changes.
---

# UI Command Center

Use this skill for dashboard/workspace UI changes.

## Core interaction model

- You **must** keep dashboard grid as stable base layer.
- You **must** use overlay-first focus workflow on project selection.
- Nested actions **must** use centered modal dialogs, not drawer-on-drawer.
- You **must** preserve predictable close behavior:
  - dialog closes back to focus drawer
  - focus drawer closes back to dashboard

## Visual consistency

- You **must** use existing design tokens and utility classes; avoid ad-hoc hardcoded styles.
- You **must** keep controls readable in hover/focus/active states.
- You **must** maintain clear separation between primary actions and destructive actions.
- You **must** preserve accessibility basics (`focus-visible`, contrast, pointer affordance).

## Regression checklist

Validate before done:

1. Dashboard card click opens expected focus state.
2. Task/Code interactions render without layout squish/collapse.
3. Nested create/edit flows open correct modal layer.
4. Keyboard and mouse interactions remain consistent.
5. Empty/loading/error behavior exists for dashboard cards, focus drawer panels, and modal flows.
6. Edge cases pass for long project names, dense lists, and overflow inside constrained panels.
7. Interaction parity holds across keyboard, pointer, and touch for open/close cycles.

Any failure in accessibility, state completeness, or interaction parity is a **release blocker** until fixed.

## Scope boundary

This skill governs UX behavior and composition patterns; runtime/build/deploy validation still follows runtime/deploy skills and repo rules.
