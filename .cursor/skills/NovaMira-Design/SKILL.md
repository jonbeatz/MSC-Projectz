---
name: novamira-design
description: >-
  NovaMira visual design system: glassmorphism, bento grids, SaaS dark layered
  neutrals, MSC Studio Gold as the primary brand accent (Gold Standard), Nova Red
  for DiviGear filters and cross-project destructive emphasis, 8px rhythm,
  borders-over-shadows, and admin/dashboard patterns (MSC PRO ENGINE Studio Mode).
  Use for UI polish, the msc-new Next bundle, plugin admin CSS, Divi modules, and
  high-end studio layouts alongside the Nova skill.
---

# NovaMira Design — Glass + Bento (“Plugin Jedi” direction)

This skill complements **`.cursor/skills/Nova/SKILL.md`** (code conventions) and **`.cursor/docs/NovaMira-MSC-PRO-ENGINE.md`** (msc-shows-core behavior). It does **not** replace `.cursorrules` on security, Divi 4 scope, or `msc_` / `msc-` / `nm-` naming.

**Goal:** Reach **Plugin Jedi Status** by combining **glassmorphism** with a **Bento Grid** — a layout idiom (from Japanese bento boxes) that uses **varied rectangular cells** to pack dashboards into a high-density, calm, premium feel.

**Modern label:** often **SaaS Dark** or **glass UI**: dark base, layered neutrals, thin borders, sparse bright accents.

**MSC “Gold Standard” (this stack):** For **MyStudioChannel / MSC-branded** surfaces — especially the **`msc-new` Next.js marketing site** — treat **Studio Gold** as the **default strategic accent** (CTAs, badges, highlights, glows). **Nova Red** remains canonical for **DiviGear red-pill filters**, **destructive actions**, and **other WordPress-centric projects**; do not replace Gold with Red on MSC public marketing unless the user asks for a one-off experiment.

---

## 1. Layered neutrality (“off-black” stack)

Avoid **pure `#000000` for every surface**. Professional dark UIs use **steps** of charcoal and gray so elevation reads clearly:

| Layer | Role | Guidance |
|-------|------|----------|
| **Canvas / workspace** | Deepest plane | Very dark charcoal — near black. Align with project rule: **`#000000`** is acceptable as the **primary page** background where the design calls for black (see `.cursorrules`). |
| **Raised surfaces** | Cards, panels, “Vader” status tiles, quick actions | **Noticeably lighter** than canvas — one or two steps up so elements feel *closer* to the user. |
| **Inset / well** | Optional secondary areas | Slightly darker than cards *or* same as canvas with a border — avoid more than **3–4** gray steps or the palette muddies. |

**Implementation hint:** define CSS variables (e.g. `--nm-surface-0` … `--nm-surface-2`) in one place (`msc-shows-core` admin CSS or child theme) and reuse — matches **MSC Engine** `studio_light` / `saas_dark` theming without duplicating hexes everywhere.

---

## 2. Border-defined hierarchy (not muddy shadows)

On dark backgrounds, **heavy drop shadows** often look dirty. Prefer:

- **Hairline borders:** `1px` **subtle** light-on-dark outlines (`rgba(255,255,255,0.06)`–`0.12` is a common range; tune for contrast).
- **Separation over depth:** hierarchy from **surface step + border**, not stacked shadows.
- **Soft geometry:** **large radii** on cards and primary buttons (`12px`–`20px+` depending on density — align with **pill filters** at `20px` in Nova rules; **DiviGear** uses **red** pills per `.cursorrules`, **MSC marketing** often uses **gold** pills / badges at similar radius).

Use shadows **sparingly** — e.g. a **soft, wide** shadow only for modals, dropdowns, or floating FABs.

---

## 3. Strategic accents — **MSC Studio Gold** (Gold Standard) + **Nova Red** (cross-project)

Dark UIs make **small bright accents** read as “signal.” On **MSC / MyStudioChannel** work, **Gold leads**; **Red** stays available where Nova already standardized it (filters, destructive, non-MSC client sites).

| Use | Pattern |
|-----|---------|
| **Primary brand / marketing accent (MSC)** | **Studio Gold `#F5B841`** — the **Gold Standard** for MSC: hero emphasis, primary CTAs on the marketing site, eyebrow pills, badge chrome, accent borders, and controlled **glow** (e.g. `glow-accent` / `.msc-glow`). Implement as **`--accent`** / **`text-accent`** / **`bg-accent`** in the Next bundle (`app/globals.css`) or **`.msc-text-gold` / `.msc-bg-gold` / `.msc-border-gold`** for Divi-aligned hex. Use **sparingly** so Gold stays premium, not loud. |
| **DiviGear filter pills & WP “red pill” UI** | **Nova Red `#c01a1a`** — **not** the default replacement for Gold on MSC marketing. Use for filter nav and patterns called out in `.cursorrules`: background `#c01a1a`, text `#ffffff`, `border-radius: 20px`, padding `6px 18px`. |
| **Destructive / danger** | **Nova Red** (or semantic `destructive` tokens) for purge, delete, irreversible confirms — **rare** on marketing pages; common in admin and tooling. |
| **Success / OK** | Vibrant **green** for status dots, “OK”, HTTPS — instant reassurance. |
| **Default text on dark** | High contrast; target **≥ 4.5:1** vs background per `.cursorrules`. |

Do **not** sprinkle **Gold** or **Red** on every control — **scarcity** preserves hierarchy. On **this repo’s Next site**, default to **Gold** for “hero” emphasis; reach for **Red** when matching DiviGear or destructive semantics.

---

## 4. Bento + component organization

**Bento = modular grid of unequal cells** (dashboard widgets, quick links, tutorials, system status).

- **Small, single-purpose tiles** beat one long scrolling column — reduces cognitive load.
- **Rhythm:** use **8px multiples** for gaps and padding (8, 16, 24, 32, 64) per `.cursorrules`. Consistent **gutter** between tiles is what makes density feel *expensive*, not cramped.
- **Responsive:** bento collapses to **single column** on narrow viewports; touch targets **≥ 44px** where primary.

**Front-of-house (Divi):** full-width sections when grids need room (`et_full_width_page` per `.cursorrules`). **Featured Image** + **16:9** for show/project grids remains the Nova standard.

---

## 5. Functional sidebar navigation

**Vertical sidebar** with **simple icons + short labels** — maximizes horizontal space for bento content. Standard pattern for **studio / dev / SaaS** tools (including MSC admin when applicable).

Keep sidebar **visually quieter** than the content pane (lower contrast text, single accent for active item).

---

## 6. Glassmorphism (use with care)

**Glass** = **translucent surface + backdrop blur + light border**, often on **elevated** layers.

- **Performance:** `backdrop-filter` can cost GPU — test on low-end devices; provide a **solid fallback** (opaque `--nm-surface-*`) when blur is unsupported or `prefers-reduced-transparency`.
- **Readability:** blur is decoration — **text contrast** must still meet **4.5:1**.
- **Not everywhere:** one glass **header bar** or **panel** per view is often enough; full-page glass stacks read noisy.

---

## 7. Aligned with Nova / `.cursorrules` (carry-over checklist)

These stay **non-negotiable** for NovaMira public UI unless the user overrides:

- **Grids / cards:** **16:9** thumbnails, `object-fit: cover`, `width: 100%` on targets like `.dg-cpt-image-wrap img`, `.msc-show-card img`.
- **MSC Studio Gold (token reference):** **`#F5B841`** — primary marketing accent in `app/globals.css` (`--accent`, OKLCH pair) and `.msc-*-gold` utilities; keep **Gold** as the **default** MSC front-of-house accent unless a task explicitly calls for Red.
- **Red pill filters (DiviGear only / WP filters):** `background #c01a1a`, text `#ffffff`, `border-radius 20px`, padding `6px 18px`.
- **Interaction:** `cursor: pointer` on clickables; `transition: all 0.2s ease-in-out`; subtle card hover scale (e.g. `scale(1.03)`).
- **Motion access:** respect **`prefers-reduced-motion`** — reduce or disable scale/blur transitions when set.
- **Focus:** visible **`:focus-visible`** outlines for keyboard users (don’t rely on hover alone).
- **Images:** meaningful **`alt`**; **`loading="lazy"`** below the fold.
- **CSS namespaces:** custom classes **`msc-`** / **`nm-`**; plugin CSS in **`msc-shows-core`** assets when the plugin owns the feature.
- **Hydration Polish:** Use `suppressHydrationWarning` on the root `<body>` tag to handle minor server/client attribute mismatches (like dark mode classes) without crashing the React engine.
- **Asset Loading:** Use root-relative URLs for hero and grid images (e.g. **`/media/...`** for files in `public/media/`). If `basePath` is enabled in `next.config.mjs`, do **not** bake that prefix into `src`—Next prepends it. Avoid double-prefix 404s.

---

## 8. Modern polish (2024–2026 friendly)

- **Typography:** limit **2–3** font roles (display / body / mono if needed); consistent **line-height** (e.g. 1.5–1.6 body) on dark for readability.
- **No decorative motion** for core layout — save animation for **feedback** (success, error, loading).
- **Iconography:** single stroke weight; align to **8px** grid.
- **Dark-on-dark links:** underline or clear hover state — don’t rely on color alone.

---

## Related files

| Doc | Purpose | Path |
|-----|---------|------|
| **Logic Skill** | Code + Divi integration | .cursor/skills/Nova/SKILL.md |
| **Next bundle map** | Sections, hooks, changelog | .cursor/docs/Development.md |
| **Design tokens (Next)** | Gold, surfaces, glass | `app/globals.css` |
| **Project Context** | Engine behavior | .cursor/docs/NovaMira-MSC-PRO-ENGINE.md |
| **Fix Log** | Turbopack/WP Hydration | .cursor/docs/FixNodeSite.md |




---

## When this skill should not override project facts

If a client build or legacy page uses a different palette or layout system, **don’t mass-refactor** without a scoped task. For **new** NovaMira-branded surfaces (especially MSC admin, **msc-new** marketing, and studio-style dashboards), prefer this direction — **Gold-first for MSC public UI**, **Red where DiviGear / destructive / legacy Nova red-pill specs apply** — unless product says otherwise.


