---
name: Phase 9 Day Detail
overview: Implement a Gold Master Day-Detail binding layer with strict typing, deterministic grouping, and shared consumer rendering for Calendar Grid and Agenda.
todos:
  - id: define-day-contract
    content: Define normalized, type-safe DayDetail and DayDetailGroup interfaces in msc_calendar_utils.ts
    status: pending
  - id: build-day-selector
    content: Implement deterministic buildDayDetail builder (sorting, client-name grouping, fallback buckets)
    status: pending
  - id: wire-calendar-page
    content: Refactor calendar page to use buildDayDetail output and centralize hydration checks
    status: pending
  - id: update-day-consumers
    content: Update CalendarGrid and CalendarAgendaPanel to consume DayDetail only (no ad-hoc grouping)
    status: pending
  - id: verify-flows
    content: Verify task add/edit flows and run build + local smoke checks
    status: pending
isProject: false
---

# Phase 9: Calendar Day-Detail Binding

## Gold Master Direction

Use a hybrid-first architecture with one canonical selector contract:
- Build a strict typed `DayDetail` contract that includes resolved `clientName` metadata.
- Build deterministic transformation helpers in `msc_calendar_utils.ts`.
- Feed both Day Dialog and Agenda Panel from the same payload.
- Keep existing hydration/store/server actions unchanged (no new fetch layer in Phase 9.1).

## Why This Fits Current Architecture
- Calendar already hydrates projects/tasks via [`d:\Cursor_Projectz\MSC-Projectz\app\(main)\(command-center)\calendar\page.tsx`](d:\Cursor_Projectz\MSC-Projectz\app\(main)\(command-center)\calendar\page.tsx) using `hydrateVaultFromPayload`.
- Day bucketing utilities already exist in [`d:\Cursor_Projectz\MSC-Projectz\lib\msc_calendar_utils.ts`](d:\Cursor_Projectz\MSC-Projectz\lib\msc_calendar_utils.ts).
- Client↔project↔task joins are already modeled in [`d:\Cursor_Projectz\MSC-Projectz\lib\msc_client_actions.ts`](d:\Cursor_Projectz\MSC-Projectz\lib\msc_client_actions.ts) and [`d:\Cursor_Projectz\MSC-Projectz\lib\msc_map_vault.ts`](d:\Cursor_Projectz\MSC-Projectz\lib\msc_map_vault.ts).

## Canonical DayDetail Contract

```ts
type DayDetailGroup = {
  clientId: string
  clientName: string
  items: MscCalendarTaskItem[]
}

type DayDetail = {
  ymd: string
  items: MscCalendarTaskItem[]
  count: number
  clientGroupedItems: DayDetailGroup[]
  emptyState: boolean
}
```

### Contract rules
- Builder must resolve `clientName` during transformation (not in component render).
- Include fallback bucket for missing/unassigned client links.
- Keep output deterministic for stable UI ordering.

## Implementation Steps
1. **Define Day-Detail Contract**
   - Add `DayDetail` and `DayDetailGroup` interfaces/types in [`d:\Cursor_Projectz\MSC-Projectz\lib\msc_calendar_utils.ts`](d:\Cursor_Projectz\MSC-Projectz\lib\msc_calendar_utils.ts).
   - Reuse existing task/project types; do not introduce `any`.

2. **Create Reusable Selector/Builder**
   - Implement `buildDayDetail(ymd, projects, tasks)` (or equivalent pure API) in [`d:\Cursor_Projectz\MSC-Projectz\lib\msc_calendar_utils.ts`](d:\Cursor_Projectz\MSC-Projectz\lib\msc_calendar_utils.ts).
   - Reuse `msc_filterTasksForDay`/existing date-key helpers where possible.
   - Deterministic sort order: `clientName -> projectName -> dueDate -> title`.
   - Group tasks into `clientGroupedItems` with explicit `clientName`.

3. **Wire Calendar Page to New Contract**
   - In [`d:\Cursor_Projectz\MSC-Projectz\app\(main)\(command-center)\calendar\page.tsx`](d:\Cursor_Projectz\MSC-Projectz\app\(main)\(command-center)\calendar\page.tsx), replace ad-hoc day extraction with `buildDayDetail` output.
   - Ensure existing loading and hydration flow remain unchanged.
   - Pass only standardized `DayDetail` payloads into day-specific consumers.

4. **Update Day-Detail Consumers**
   - Update [`d:\Cursor_Projectz\MSC-Projectz\components\CalendarGrid.tsx`](d:\Cursor_Projectz\MSC-Projectz\components\CalendarGrid.tsx) dialog and [`d:\Cursor_Projectz\MSC-Projectz\components\CalendarAgendaPanel.tsx`](d:\Cursor_Projectz\MSC-Projectz\components\CalendarAgendaPanel.tsx) to consume `DayDetail`.
   - Render group headers with `Client: {clientName}`.
   - Enforce `emptyState` rendering parity between both components.

5. **Validation and Stability Checks**
   - Verify add/edit task flows still work from day-detail (`CalendarAddTaskDialog` / `CalendarTaskEditDialog`) without stale UI.
   - Run build gate and local route smoke checks (`/calendar`, `/clients`) to confirm no regressions.

## Scope Guardrails
- No schema changes and no new dependencies.
- No new server endpoint in this phase; rely on existing hydrated store data.
- UI components consume `DayDetail` contract only, not raw task arrays.

## Phase 9.2 (Next, Optional)
- Add server-driven day-window aggregate for scalability and reduced client payload.
- Add filter chips (client/status/priority) to Day-Detail backed by same contract shape.
