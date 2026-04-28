# Clients Glassmorphism Debug Note

Date: 2026-04-28
Scope: `/clients` only
Status: Resolved (working baseline shipped)

## Goal
Ship a premium "Studio Glass" look on the Clients cards and route background.

## What Was Attempted
- Scoped classes live in `app/globals.css` (Clients glass `@layer components`; legacy `styles/globals.css` removed):
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

## Root Cause (final)
- `globals.css` was imported correctly in the active `/clients` layout chain.
- The practical break was in the rendered state:
  1. scoped clients glass class definitions were missing/out-of-sync at one point, and
  2. the route/card class usage was also not aligned with those definitions.
- Because of this mismatch, the intended glass styles were not producing visible output.

## Working Fix That Landed
1. Restored scoped classes in `app/globals.css` (`@layer components`):
   - `.msc-clients-route-bg`
   - `.msc-clients-glass-card`
   - `.msc-clients-glass-card::before`
2. Re-applied scoped classes in `components/MSC-Projectz-ClientsRouteView.tsx`:
   - route wrapper: `msc-clients-route-bg`
   - cards: `msc-clients-glass-card`
3. Added explicit on-element glass baseline on the client cards (inline style + glare overlay) to guarantee visible effect while tuning:
   - translucent background + border + shadow
   - `backdropFilter` / `WebkitBackdropFilter`
   - diagonal glare layer in-card

## Verification
- `npm run verify:next:safe` passed after fix.
- Dev server healthy.
- `/clients` and `/admin` returned `200`.
- Operator confirmed: "I see it now."

## Important
Keep this as the baseline. Future tuning should be incremental (one dial at a time: opacity, border intensity, glare strength), not full rewrites.
