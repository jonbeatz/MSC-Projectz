# Clients Glassmorphism Debug Note

Date: 2026-04-28
Scope: `/clients` only
Status: Paused (visual effect not reaching desired result)

## Goal
Ship a premium "Studio Glass" look on the Clients cards and route background.

## What Was Attempted
- Added scoped classes in `styles/globals.css`:
  - `.msc-clients-route-bg`
  - `.msc-clients-glass-card`
  - `.msc-clients-glass-surface`
- Applied classes in `components/MSC-Projectz-ClientsRouteView.tsx`.
- Added multiple visual passes:
  - subtle glass
  - V2 atmospheric gradient + stronger border/shadow
  - diagnostic `!important` pass
  - V3 refractive pass with glare pseudo-element (`::before`)
- Ensured wrapper used route class and `min-h-screen`.
- Rebuilt repeatedly with `npm run verify:next:safe`.

## What We Observed
- Build and runtime were healthy (`/clients` and `/admin` returned 200).
- CSS classes appeared in the live DOM.
- Visual output still read as mostly flat/dark instead of pronounced glass depth.

## Why We Paused
The effect did not meet expected quality despite multiple style variants and force overrides.

## Next Session Plan
1. Run a strict parent-chain audit on `/clients` for backdrop blockers:
   - `transform`
   - `filter`
   - `perspective`
   - `isolation`
   - clipping/stacking interactions
2. Do a controlled inline sanity test on the route wrapper to confirm final paint path.
3. If needed, move glass render layer to a dedicated card component with explicit pseudo-element layering (`z-index` strategy).
4. Re-test with one controlled visual baseline before further style experiments.

## Important
Do not continue random style tuning first. Start with structural/stacking diagnostics, then re-apply a single glass recipe.
