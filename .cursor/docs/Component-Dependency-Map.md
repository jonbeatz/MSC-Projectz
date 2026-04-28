# MSC-Projectz Component Dependency Map

Learning reference for the current Command Center UI architecture.

## 1) Big-picture flow

`MSC_Projectz_CommandCenterShell` -> `MSC_Projectz_DashboardRouteView` -> `MSC_Projectz_Dashboard` -> `ProjectGrid` -> `MSC_Projectz_ProjectCard` -> `MSC_Projectz_TaskPulseFocusDrawer` -> `MSC_Projectz_TaskPulse` -> (`MSC_Projectz_TaskPulseCodeVault`, `MSC_Projectz_ClientDrawer`) -> `MSC_Projectz_WorkspaceModalShell`

This is the primary dashboard/focus workspace chain.

## 2) Top-level route shells

- `components/MSC-Projectz-CommandCenterShell.tsx`
  - Wraps authenticated command-center pages.
  - Provides search/add-project context via `MSC_Projectz_CommandCenterProvider`.
  - Renders `DashboardLayout`, `MSC_Projectz_VaultHydrator`, and `AddProjectModal`.

- `components/MSC-Projectz-DashboardRouteView.tsx`
  - Route-level orchestrator for dashboard state.
  - Owns focus state (`focusProjectId`, `focusOpen`, `focusTab`) and modal/drawer selection states.
  - Renders:
    - `MSC_Projectz_Dashboard`
    - `EditProjectModal`
    - `ProjectVault`
    - `TaskDrawer`

## 3) Dashboard surface layer

- `components/MSC-Projectz-Dashboard.tsx`
  - Main dashboard surface.
  - Empty-state CTA or project grid.
  - Renders:
    - `ProjectGrid`
    - `MSC_Projectz_TaskPulseFocusDrawer`

- `components/MSC-Projectz-ProjectCard.tsx`
  - Reusable project card in the grid.
  - Handles card-level actions (edit, explorer, live link, credential popover, quick task, task drawer open).
  - Uses:
    - `MemberClusterTrigger`
    - `MscManualProjectMoveControls`
    - multiple UI primitives (`Button`, `Popover`, `DropdownMenu`, `Input`, `Badge`)

## 4) Focus workspace layer (overlay-first)

- `components/MSC-Projectz-TaskPulseFocusDrawer.tsx`
  - Right-side focus workspace drawer.
  - Hosts project-specific task/code workspace.
  - Renders:
    - `MSC_Projectz_TaskPulse`

- `components/MSC-Projectz-TaskPulse.tsx`
  - Core task + code-vault workspace for selected project.
  - Manages:
    - task kanban/timeline behavior
    - telemetry panel
    - client info launch
    - tab state (`tasks`, `code-vault`)
  - Renders:
    - `MSC_Projectz_TaskPulseCodeVault`
    - `MSC_Projectz_ClientDrawer` (dialog mode)
    - `MSC_Projectz_TaskAssigneeBadge`

## 5) Nested modal/dialog layer

- `components/MSC-Projectz-TaskPulseCodeVault.tsx`
  - Snippet list + create + detail flows.
  - Uses dialog pattern (not nested drawer pattern).
  - Renders:
    - `MSC_Projectz_WorkspaceModalShell` (for create modal)
    - `MSC_Projectz_SnippetViewer` (detail content)

- `components/MSC-Projectz-ClientDrawer.tsx`
  - Client details/pulse/vault panel.
  - Supports `presentation="sheet"` or `presentation="dialog"`.
  - In dialog presentation it renders:
    - `MSC_Projectz_WorkspaceModalShell`

- `components/MSC-Projectz-WorkspaceModalShell.tsx`
  - Shared modal frame/shell for centered workspace dialogs.
  - Standardizes title/header/body structure and glass-card styling.

## 6) Clients route branch

- `components/MSC-Projectz-ClientsRouteView.tsx`
  - `/clients` route surface.
  - Handles clients list/create flow and selected client drawer.
  - Renders:
    - `MSC_Projectz_ClientDrawer`
    - create client `Dialog`

## 7) State ownership cheat sheet

- **Global app state:** `useAppStore` (projects, auth, tasks, settings, hydration).
- **Route composition state:** `MSC_Projectz_DashboardRouteView`.
- **Dashboard-level selection/focus state:** lifted in `MSC_Projectz_DashboardRouteView`, consumed by `MSC_Projectz_Dashboard`.
- **Task/code workspace local UI state:** `MSC_Projectz_TaskPulse` + `MSC_Projectz_TaskPulseCodeVault`.
- **Client dialog internal state:** `MSC_Projectz_ClientDrawer`.

## 8) Layering model (current standard)

1. Dashboard grid base layer
2. Focus workspace drawer layer
3. Centered dialogs over focus layer (snippet create/detail, client dialog)

This keeps navigation predictable and avoids drawer-on-drawer stacking issues.
