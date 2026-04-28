---
name: novamira-design
description: >-
  NovaMira visual system for dark layered UIs, bento layouts, accent strategy
  (Gold-first MSC / Red for DiviGear + destructive), and practical accessibility-
  first polish. Use with the Nova implementation skill.
---

# NovaMira Design Skill

This skill defines NovaMira visual direction. Pair it with:

- `.cursor/skills/Nova/SKILL.md` for implementation conventions.

## Scope gate (important)

- Use this skill when designing NovaMira/MSC branded surfaces, especially WordPress/Divi-adjacent UI work.
- For non-WordPress app runtime tasks in this repo, prioritize canonical project authorities first:
  - `.cursorrules`
  - `.cursor/docs/Docs-Architecture.md`
  - `.cursor/skills/Workflow-Portable/*`

## Design intent

Build calm, premium, high-density dark interfaces with:

- layered neutral surfaces,
- border-first hierarchy,
- sparse strategic accent usage,
- bento-informed layout organization.

## Accent strategy (core)

- **MSC public / brand-forward UI:** Gold-first (`#F5B841`) for primary emphasis.
- **DiviGear filters + destructive semantics:** Red (`#c01a1a`) for filter pills and danger actions.
- **Success state:** green signal accents.

Do not over-apply accent colors; scarcity preserves hierarchy.

## Surface and hierarchy system

- Avoid flat all-black stacks; use 2-4 neutral surface steps.
- Prefer subtle borders over heavy shadows for structure.
- Reserve stronger shadows for true overlays (modal/dropdown/floating layers).
- Keep radii and spacing on an 8px rhythm.

## Layout rules

- Use bento-style modular composition for dashboards and dense control surfaces.
- Collapse to single-column cleanly on narrow screens.
- Keep touch targets meaningful (>= 44px where primary).
- Keep sidebar/navigation visually quieter than primary content.

## Glassmorphism guidance

- Use glass effects selectively (one elevated region is usually enough).
- Provide fallback surfaces when blur/transparency is unsupported.
- Maintain readable contrast regardless of blur treatment.
- Respect reduced-motion/reduced-transparency preferences.

## Accessibility and interaction baseline

- Preserve visible `:focus-visible` states.
- Keep text contrast and semantic emphasis clear.
- Ensure meaningful image alt text and lazy-loading below fold.
- Use deliberate, minimal motion for feedback rather than decoration.

## Non-override rule

If an active product surface already has a locked palette/system, do not mass-refactor without a scoped migration task.


