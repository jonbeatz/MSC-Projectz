---
name: Phase 9.1.1 QoL Refinement
overview: Improve calendar friction and visual density by implementing contextual task creation and status badging.
todos:
  - id: contextual-add-task
    content: Update 'Add Task' triggers in CalendarGrid and Agenda to inject the specific 'ymd' into the CreateTask dialog.
    status: pending
  - id: status-badging
    content: Implement compact, tokenized status badges on CalendarTaskChip using project/task status metadata.
    status: pending
  - id: verify-qol
    content: Smoke test modal prefill behavior and ensure badges do not cause layout shifts.
    status: pending
isProject: false
---

# Phase 9.1.1: QoL Refinement

## Contextual "New Task" Prefill
- **Goal:** Eliminate date-picker friction.
- **Implementation:**
    - Update the "Add Task" button (in Empty State or Header) to accept a `date` prop.
    - Pass this date to `CreateTaskDialog`.
    - If `date` is provided, disable/bypass the date-selection field in the modal to prevent redundant input.

## Status Badging
- **Goal:** At-a-glance project health.
- **Implementation:**
    - Use existing status metadata from `MscCalendarTaskItem`.
    - Add a small (6px) rounded dot or pill badge to `CalendarTaskChip.tsx`.
    - Map statuses: 'Active' (Green), 'Lead' (Yellow), 'Completed' (Gray), 'Blocked' (Red).
    - Ensure it is visually secondary to the Task Title.

## Guardrails
- Keep UI "Studio Dark" aesthetic (subtle colors, no heavy saturation).
- Ensure no layout shift (use `flex-shrink-0` for badges).
- No changes to `DayDetail` contract needed; strictly view-layer enhancement.

Cursor Prompt: Executing Task 1 (Contextual "New Task" Prefill)
Now that the plan is set, let’s execute Contextual "New Task" Prefill immediately. This is the biggest friction-remover for your workflow.

Role: Senior Full-Stack Architect
Objective: Implement contextual task creation in the calendar.

Task: Contextual "New Task" Prefill

Identify Entry Points:

Locate the "Add Task" button in components/CalendarGrid.tsx (the Empty State) and components/CalendarAgendaPanel.tsx.

Implement Injection:

Modify the handler for these buttons to pass the current ymd string to the CreateTaskDialog (or your existing Task Creation component).

If your CreateTaskDialog already accepts props, pass the ymd as a defaultDate or initialDate.

UX Logic:

When the modal opens, the date field should be pre-filled and, if possible, non-editable (or read-only) to lock in the context.

Crucial: Verify that this only happens when the button is clicked from the Calendar. Do not change the global "New Task" button behavior in other parts of the app.

Constraints:

No schema changes.

Maintain existing styling and "Studio Dark" theme.

Ensure the ymd format remains consistent with the rest of your lib/msc_calendar_utils.ts logic.
