---
name: jedi-dashboard-magic
description: Preserve and reproduce the MSC "Jedi Magic" Command Center look: dark frosted dashboard chrome, right-side focus drawers, and the final neutral calendar matrix style. Use when polishing dashboard, focus drawers, calendar month grid, or asking to "match this look" in MSC.
---

# Jedi Dashboard Magic

Use this skill when the operator asks for the exact premium MSC look-and-feel now used in Dashboard, right-side drawers, and Calendar.

## Design intent

Keep the experience calm, premium, and dense:

- dark neutral layers,
- subtle borders before heavy glow,
- restrained blue accent (`msc-ui-accent`) only for active meaning,
- smooth right-drawer workflow over stable dashboard base.

## Core visual anchors (must keep)

1. **Main canvas ownership**
   - `msc-cc-route-canvas` stays on `<main>` (`dashboard-layout.tsx`) in dark mode.
   - Layout shell stays `px-0` in dark mode; each route owns its own horizontal padding.

2. **Dashboard + drawer relationship**
   - Dashboard grid remains the base layer.
   - Focus/task drawers slide in from the right and feel integrated, not detached.
   - Keep nested actions in dialogs over drawer; avoid drawer-on-drawer.

3. **Accent strategy**
   - Use `msc-ui-accent` (`#599ede`) for active highlights, selection, and key status.
   - Do not flood whole surfaces with accent.

## Calendar final recipe (operator-approved)

When updating desktop month view, preserve this shape:

- **Weekday header row:** full names (`Monday` … `Sunday`), slimmer than day tiles.
- **Day grid:** equal-height cells (fixed desktop auto rows), no stretching by task count.
- **Tone:** neutral dark slate (less blue, lower saturation).
- **Depth:** flatter cards (minimal bevel), slight light-grey perimeter stroke.
- **Detail modal:** neutral dark shell (`msc-calendar-detail-dialog`), close `X` always clickable.

## Implementation checklist

- [ ] Keep borders subtle (`white/3`-`white/8` range), avoid bright outlines.
- [ ] Keep card radii consistent and modest (flatter than bubbly glass).
- [ ] Ensure task density never changes day-card height.
- [ ] Preserve keyboard accessibility on day cells and modal close.
- [ ] Validate visual parity across `/dashboard`, right drawers, and `/calendar`.

## Required references

- `.cursor/docs/msc-cc-command-center-nav-preset.md`
- `.cursor/skills/MSC-Skillz/UI-Command-Center/SKILL.md`
- `app/globals.css` (Command Center + Calendar surface classes)

## Regression guardrails

- If vertical gutter strips appear, check canvas ownership + route padding split before touching gradients.
- If calendar looks blue/beveled, reduce saturation and shadow first (not radius explosion).
- If modal close `X` fails, verify dialog close stacking (`z-index`) and header overlay layers.
