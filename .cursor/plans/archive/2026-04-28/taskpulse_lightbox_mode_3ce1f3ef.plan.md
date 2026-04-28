---
name: TaskPulse Focus Drawer
overview: Implement a hybrid focus workflow where the current inline panel remains for quick triage and a full-size slide-over drawer opens for deep Task/Code Vault work.
todos:
  - id: define-hybrid-ux
    content: Finalize hybrid behavior (inline by default + optional full-size slide-over focus mode).
    status: pending
  - id: add-focus-shell
    content: Add focus drawer shell component/state for selected project Task/Code Vault workspace.
    status: pending
  - id: wire-triggers
    content: Add Expand/Close triggers and preserve selected project/tab state between modes.
    status: pending
  - id: validate-nested-overlays
    content: Test TaskPulse nested dialogs/drawers in overlay mode and fix stacking/focus issues.
    status: pending
  - id: run-regression
    content: Run local verify build and dashboard/mobile smoke checks for layout regressions.
    status: pending
isProject: false
---

# Task/Code Vault Focus Drawer Plan

## Recommendation
Use a **slide-over Sheet/Drawer** as the focus workspace. This is **moderate complexity** and aligns better with the Command Center feel than a centered lightbox.

Locked decisions for implementation:
- **Desktop default:** keep inline panel as default; open drawer only via explicit Focus action.
- **State strategy:** **two-phase** rollout — lift state first; add `useTaskPulseSync` + `sessionStorage` only if Phase 1 testing shows real desync/draft-loss.

The current architecture is already componentized enough to support it:
- Selection state is in [components/MSC-Projectz-DashboardRouteView.tsx](D:/Cursor_Projectz/MSC-Projectz/components/MSC-Projectz-DashboardRouteView.tsx)
- Task/Code Vault content is encapsulated in [components/MSC-Projectz-TaskPulse.tsx](D:/Cursor_Projectz/MSC-Projectz/components/MSC-Projectz-TaskPulse.tsx)
- Code Vault internals already use dialogs/drawers safely in [components/MSC-Projectz-TaskPulseCodeVault.tsx](D:/Cursor_Projectz/MSC-Projectz/components/MSC-Projectz-TaskPulseCodeVault.tsx)

## Suggested UX Direction (Best Option)
Implement a **hybrid mode**:
- Keep the current inline right panel for quick triage.
- Add an **Expand / Focus** action that opens Task + Code Vault in a near/full-width **slide-over drawer**.
- In focus mode, treat it as a workspace layer (high z-index, proper backdrop, scroll lock).
- Preserve current selected project and active tab (`Tasks`/`Code Vault`) between inline and overlay.

This gives speed for small actions and deep space for editing without forcing one behavior.

## Why This Is Moderate (Not High) Complexity
- No data model changes needed.
- Most work is state wiring + layout composition.
- Biggest risk is nested overlay behavior (TaskPulse contains drawers/dialogs), but existing components already handle dialog usage and can be tested incrementally.

## Implementation Shape
1. **Phase 1 — State lift first**
   - Lift `focusProjectId`, `focusOpen`, and `focusTab` to dashboard route level.
   - Keep one TaskPulse state model consumed by inline view and drawer wrapper.
2. Introduce a new shell component (e.g. `TaskPulseFocusDrawer`) that renders `MSC_Projectz_TaskPulse` in a large `Sheet`/drawer container.
3. Add UI trigger on selected project area: `Expand` opens focus drawer for current project.
4. Keep inline panel behavior unchanged as desktop default.
5. Add keyboard/close behavior (`Esc`, close button, backdrop), preserve project selection on close.
6. Validate mobile behavior: overlay can become primary under narrower widths.
7. **Phase 2 — Conditional sync hook**
   - Add `useTaskPulseSync` with `sessionStorage` only if Phase 1 reveals desync or draft-loss when switching modes/projects.

## QA Focus
- Open project -> inline panel still works.
- Open focus drawer -> Tasks and Code Vault both usable with more space.
- Switching tabs persists correctly.
- Draft input continuity is verified during mode switches (and across project switches where intended).
- Embedded dialogs/drawers (snippet dialog, client drawer) still stack correctly.
- No regressions on `/dashboard`, `/tasks`, `/vault` interactions.

## Effort Estimate
- MVP hybrid mode: ~1 coding pass (small/medium PR).
- Polish pass (animations, transitions, tab persistence refinements): optional follow-up.