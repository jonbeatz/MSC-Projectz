---
name: nova
description: >-
  NovaMira Engine conventions for WordPress/Divi child themes: msc_ PHP prefixes,
  msc-/nm- CSS namespaces, MSC-Media file naming, security and query standards,
  cinematic 16:9 grids, red-pill filter styling, Divi module patterns, and a
  pre-delivery checklist. Use when building or reviewing NovaMira pages, Divi
  layouts, project grids, DiviGear CPT filters, or MSC/Nova-branded PHP/CSS.
---

# NovaMira Engine (Master Edition)

Guidance for this codebase and related NovaMira work. Apply alongside existing project rules (child theme, Divi 4, DiviGear).

## Extended context (MSC PRO ENGINE)

For NovaMira / **`msc-shows-core`** — DiviGear grid flow vs plugin hooks, CSS variables, Auto category sync, admin Engine theme/accent, v4.7.x notes, and stack boundaries — read:

**`.cursor/docs/NovaMira-MSC-PRO-ENGINE.md`**

## Extended context (MSC PRO ENGINE)
- **Product Context:** .cursor/docs/NovaMira-MSC-PRO-ENGINE.md
- **Visual / Dashboard Design:** .cursor/skills/NovaMira-Design/SKILL.md
- **Technical Fixes:** .cursor/docs/FixNodeSite.md

---

## 1. Core identity and naming (Vader protocol)

| Area | Rule |
|------|------|
| **PHP** | Prefix functions, classes, and hooks with `msc_`. |
| **CSS** | Namespace custom classes with `msc-` or `nm-` to avoid collisions with Divi and plugins. |
| **Files** | Follow the `MSC-Media-` naming convention for media-related assets and related PHP where applicable. |

- **Plugin Standards:** Every plugin file must include `defined( 'ABSPATH' ) || exit;`.
- **Settings API:** Use the WordPress Settings API or a clean custom dashboard for Layout Tuning options (color, text, excerpt limits).
- **ACF Locking:** Prefer `acf_add_local_field_group` (PHP) over JSON imports for mission-critical 'Shows' fields to ensure they are 'locked' and portable.

---

## 2. Technical standards and security

- **Bootstrap:** Every PHP file must begin with:

  ```php
  defined( 'ABSPATH' ) || exit;
  ```

- **AJAX and REST:** Use WordPress nonces for all AJAX actions and REST endpoints that mutate state or expose privileged data.

- **Queries:** Prefer `WP_Query` (or high-level APIs). Do **not** use `query_posts`. When using `WP_Query`, set `'no_found_rows' => true` when pagination counts are not needed.

---

## 3. UI/UX design system (Pro-Max)

### Cinematic thumbnails

Project grids must enforce **16:9** thumbnails:

```css
.dg-cpt-image-wrap img,
.msc-show-card img {
  aspect-ratio: 16 / 9 !important;
  object-fit: cover !important;
  width: 100%;
  height: auto;
}
```

### Interaction polish

| Concern | Rule |
|---------|------|
| **Clickables** | `cursor: pointer;` on interactive elements. |
| **Motion** | Default transition: `transition: all 0.2s ease-in-out;` |
| **Card hover** | Prefer `transform: scale(1.03);` (or project-standard `scale(1.05)` where already established). |

---

## 4. Divi integration

- **Images:** Prefer the **Featured Image** over duplicate ACF image fields when both exist, unless the design explicitly requires ACF-only art direction.

- **Filter styling (red pill)** — DiviGear / filter nav:

```css
.dg-cpt-filter-nav-item {
  background: #c01a1a !important;
  border-radius: 20px !important;
  color: #ffffff !important;
  padding: 6px 18px !important;
  margin: 5px;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}
```

- **Divi 5 / DiviGear:** Prefer the **native** Filterable CPT / shortcode-module flow over Code-module hacks that intercept layout output; keep AJAX behavior aligned with the plugin.

---

## 5. Pre-delivery checklist (Alpha check)

Before treating a page or feature as done, confirm:

1. **Responsive:** Layout holds at **375px** (phone) and **1024px** (tablet).
2. **Performance:** Images use `loading="lazy"` where appropriate (e.g. below-the-fold grids).
3. **Contrast:** White (or light) text remains readable on **#000000** backgrounds.
4. **Accessibility:** Images that convey meaning have appropriate `alt` text.

---

## When this skill should not override project facts

If the active repo already uses different prefixes (e.g. legacy `nova_` / `dt_`), **do not mass-rename** without an explicit migration task. For new code in NovaMira-branded work, prefer the `msc_` / `msc-` / `nm-` rules above unless the user says otherwise.

## 6. Next.js Static Export & Deployment
- **Config Audit:** Ensure `next.config.mjs` contains `output: 'export'` and `unoptimized: true`. Reference `public/` files with root-relative paths (e.g. **`/media/...`**). Add `basePath` / `assetPrefix` only when the deployed URL is under a subdirectory—and never duplicate that prefix inside `src`.
- **Image Optimization:** In static mode, bypass the Next.js Image loader; use `unoptimized: true` to prevent 404s on Spaceship.
- **Deployment Protocol:**
  1. `npm install` (if node_modules is missing/corrupt).
  2. `npm run build:wp-theme` (using the mjs pipeline).
  3. **ZIP Rule:** Only zip the *contents* of the `out` folder, never the `out` folder itself, to ensure the `index.html` sits at the root of the destination directory.


