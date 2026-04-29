# Command Center — high-end nav & chrome preset

Visual preset aligned with `_design_references/Navigation` (floating glass rail, frosted header). **Reuse these tokens/classes** when building new Command Center surfaces so chrome stays consistent.

## CSS classes (`app/globals.css`)

| Class | Use |
|--------|-----|
| **`msc-cc-nav-rail`** | Dark **primary sidebar** — Clients radial (`--msc-clients-route-bg-image`) + cool grey frost stack, blur, rim, sheen `::before`, inset shadow. **Children:** direct `> *` need normal flow; decorative layer is `z-0`. |
| **`msc-cc-header-glass`** | Dark **sticky top bar** — same radial family, horizontal frost gradient, bottom hairline, blur. |
| **`msc-cc-header-glass--bite`** | **`lg+` only:** soft **top-left radius** + inset shadow so the header meets the rail without **`clip-path`** (sticky-safe). Paired with **`lg:-ml-2 lg:pl-8`** on the header row in `dashboard-layout.tsx` for alignment. |
| **`msc-cc-route-canvas`** | Dark (and light) **main-column wash** — layered radials over `hsl(var(--background))`. **Canonical placement:** on **`<main>`** in dark Command Center so the gradient reaches the **left/right/bottom** edges of the content column (see below). **`main.msc-cc-route-canvas`** also sets **`min-height: 100vh`** and **`background-repeat: no-repeat`** in `globals.css`. |

**`msc-cc-nav-rail`** and **`msc-cc-header-glass`** support **`prefers-reduced-transparency: reduce`** (solid gradients, blur off).

## Layout offsets (`dashboard-layout.tsx` + `dashboard-sidebar.tsx`)

When **`msc-cc-nav-rail`** is active (dark theme), the rail is **inset** with Tailwind **`left-2`**, **`top-2` / `bottom-2`** (mobile glass), and **`top-0 bottom-0 left-2`** on **`lg+`**. Width **`w-64` expanded** / **`w-16` collapsed**. **`main`** left margin matches **half spacing + rail + half spacing**:

- Expanded: `lg:ml-[calc(0.5rem+16rem+0.5rem)]`
- Collapsed: `lg:ml-[calc(0.5rem+4rem+0.5rem)]`

Light theme keeps classic **`lg:ml-64` / `lg:ml-16`** flush sidebar.

## Route canvas vs shell padding (avoid “straight edge” gutters)

**Problem (fixed pattern):** If **`msc-cc-route-canvas`** only wraps an **inner** route while **`DashboardLayout`** still applies **horizontal padding** on the shell, **`bg-background`** shows as thin **vertical strips** (and a **fixed** footer can sit on a different layer, adding a **bottom** seam).

**Current rule (dark Command Center):**

1. Apply **`msc-cc-route-canvas`** on **`<main>`** when `isDark` (`dashboard-layout.tsx`).
2. Use **`px-0`** on the **children wrapper** in dark mode; **each route** supplies its own horizontal inset, e.g. **`px-4 sm:px-5 md:px-6`** on **`MSC_Projectz_Dashboard`**, **`global-tasks-view`**, **`MSC_Projectz_ClientsRouteView`**.
3. **Calendar** keeps its own surface: **`msc-calendar-route-bg`** on the calendar page root (already padded **`p-3 sm:p-6`**). Other routes (Help, Profile, Settings) should add **`px-*`** on their root if they feel flush after **`px-0`**.

## Footer (`dashboard-layout.tsx`)

- **Dark:** footer is **in document flow** (**not** `lg:fixed`), **`bg-transparent`**, subtle **`border-t border-white/[0.05]`** so “Powered by…” reads on the **same** gradient as the page.
- **Light:** footer may stay **`lg:fixed`** bottom-right for the classic shell.

## Command Center accent (cool blue)

- **`--msc-ui-accent-hex`** defaults to **`#599ede`**; Tailwind maps **`msc-ui-accent`** / **`color-msc-ui-accent`** in `app/globals.css`. Use for Command Center highlights (cards, pulses, selects) so polish stays **one family** with Dashboard/Tasks/Clients.

## Jedi Magic signature (dashboard + right drawers)

- Keep Dashboard as the **stable base layer** and right-side focus drawers as the **primary workspace motion**.
- Right drawers should feel docked to the shell (shared dark/frost treatment), not like separate floating apps.
- Preserve this order: **grid -> right drawer -> centered modal**.
- Use accent blue for active edges/state cues only; keep surface hierarchy mostly neutral.

## Calendar final (operator-approved dark studio pass)

Use this when asked to “match the final calendar look”:

1. **Desktop weekday row** uses full names (`Monday`…`Sunday`) and stays slimmer than day tiles.
2. **Month cells** are equal-height on desktop (fixed auto rows); task count must not stretch card height.
3. **Visual tone** is neutral dark slate (less blue/saturation), flatter cards, subtle grey perimeter strokes.
4. **Day-detail modal** uses neutral dark shell (`msc-calendar-detail-dialog`), and close `X` must remain reliably clickable.
5. Keep parity with mobile tone: calm, dense, minimal gloss.

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
- If this visual language drifts, apply **`.cursor/skills/MSC-Skillz/Jedi-Dashboard-Magic/SKILL.md`**.
