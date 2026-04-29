# Command Center — high-end nav & chrome preset

Visual preset aligned with `_design_references/Navigation` (floating glass rail, frosted header). **Reuse these tokens/classes** when building new Command Center surfaces so chrome stays consistent.

## CSS classes (`app/globals.css`)

| Class | Use |
|--------|-----|
| **`msc-cc-nav-rail`** | Dark **primary sidebar** — Clients radial (`--msc-clients-route-bg-image`) + cool grey frost stack, blur, rim, sheen `::before`, inset shadow. **Children:** direct `> *` need normal flow; decorative layer is `z-0`. |
| **`msc-cc-header-glass`** | Dark **sticky top bar** — same radial family, horizontal frost gradient, bottom hairline, blur. |

Both support **`prefers-reduced-transparency: reduce`** (solid gradients, blur off).

## Layout offsets (`dashboard-layout.tsx`)

When **`msc-cc-nav-rail`** is active (dark theme), the rail is **inset**: `left: 0.75rem`, `top/bottom: 0.75rem`, width `16rem` / `4rem` collapsed. **`main`** uses:

- Expanded: `lg:ml-[calc(0.75rem+16rem+0.75rem)]`
- Collapsed: `lg:ml-[calc(0.75rem+4rem+0.75rem)]`

Light theme keeps classic **`lg:ml-64` / `lg:ml-16`** flush sidebar.

## Sidebar composition (`dashboard-sidebar.tsx`)

- **Workspace** caps label + primary routes.
- **Other** caps label + Clients, Engine, then **Relatel-style collapsible** (e.g. Settings → sub-links).
- **Add Project** stays primary CTA on the rail.
- **User profile** lives in the **header dropdown** only (avoid duplicating in the rail).
- **Sign out** in the rail: **muted grey** hover (no destructive red).

## Shared gradient token

`--msc-clients-route-bg-image` in `:root` — same base as Clients route and calendar surfaces.

## Optional next steps

- More collapsible groups (mirror NavRef3).
- Light-theme frosted variant if product wants parity.
