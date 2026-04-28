# Development Roadmap — MSC-Projectz

## Sprint 1: Identity and authentication (priority: high)

*Goal: Fix the login experience and user identification.*

- [x] **Login & registration — single path:** Replaced the dual flow (store “signup” + `/auth/register`) with one source of truth: **`/auth/register`** via **`msc_registerUser`** (Payload). Login screen: **Create account** → `/auth/register` only; inline signup, invite-code shortcut, and duplicate “Request an account” CTA removed. `AuthView` is `login` | `forgot-password`; Zustand **`signup`** removed. *(Apr 2026)*
- [x] **Password security (new passwords):** Shared policy in **`lib/msc_password_policy.ts`**: min **8** characters, at least one **uppercase** letter, one **number**, one **special** character. Applied to register form, server **`msc_registerUser`**, admin create/reset, and related UI. Login does not re-check complexity (existing accounts). *(Apr 2026)*
- [x] **Dashboard identity:** Top header prefers **`user.username`** when set; falls back to email local-part. Dropdown “Signed in as” still shows full email. *(Apr 2026)*
- [x] **Welcome email on registration:** `msc_registerUser` now triggers `msc_sendWelcomeEmail` in a fire-and-forget path (registration does not fail when SMTP send fails). *(Apr 2026)*
- [x] **Verification / activation emails:** Verification-link flow is now live via tokenized email verification and trust-gate routing (implemented under Sprint 3). *(Apr 2026)*

### Sprint 1 — notes

| Item | Status |
|------|--------|
| Single registration path (`/auth/register` + Payload) | Done |
| Password strength policy (8 + upper / number / special) | Done |
| Nav display name (username first) | Done |
| Welcome email on register (`msc_sendWelcomeEmail`) | Done |
| Verification-link email flow (Brevo/FluentSMTP specific) | Done (implemented in Sprint 3) |

## Sprint 2: Access and vault logic (priority: medium)

*Goal: Secure the data and fix internal interactions.*

- [x] **Global vault (Master Admin RBAC):** Added `master-admin` role with inherited admin vault access, explicit Master-Admin-only controls for assigning/removing Master Admin role, and bootstrap/rescue alignment so first/repair admin can be promoted safely. *(Apr 2026)*
- [x] **Member cards:** Fixed "Add member" CTA to open the selected project panel (Task Pulse) instead of opening project edit settings. *(Apr 2026)*
- [x] **Cross-route signaling for Task Pulse:** Added one-shot signal bus so successful user creation in Settings can open Task Pulse with project context on dashboard routes. *(Apr 2026)*
- [x] **Vault projects — write-strict (Payload):** **`msc_vaultReadOwnProjects`** unchanged (owner or `members` can read). **`msc_vaultWriteOwnProjects`** for `update`/`delete` on **`msc-vault-projects`**: admins full; non-admins only when `user` = self (members no longer edit/delete project rows). *(Apr 2026)*
- [x] **Audit logs (admin actions):** Added `msc-audit-logs` collection, non-blocking audit writes for user admin actions, and admin-only audit viewer embedded in Settings with filters + details modal. *(Apr 2026)*
- [x] **Core collection/profile hardening complete:** users collection now enforces self/admin read-update boundaries, media owner is forced/locked for non-admin writes, and avatar assignment validates media ownership (admin override only). *(Apr 2026)*

## Sprint 3: Identity & trust (priority: high)

*Goal: Add secure, tokenized account verification and trust gates.*

- [x] **Verification schema fields:** Added `isVerified`, `verificationToken` (hashed/indexed), and `verificationTokenExpires` on Payload users. *(Apr 2026)*
- [x] **Verification token service:** Added `lib/msc_auth_verification.ts` with SHA-256 token hashing, expiry validation, and verification email sender. *(Apr 2026)*
- [x] **Email verification action + page:** Added `msc_verifyEmailAction` and `/auth/verify` flow (verifying, success, expired/error states). *(Apr 2026)*
- [x] **Trust gate + resend hold flow:** Added middleware guard for unverified sessions and `/auth/verify-reminder` resend UX with cooldown and token rotation. *(Apr 2026)*
- [x] **UI refactor + identity playground:** Verification UI unified on `components/auth/msc_VerificationView.tsx`; admin-only identity preview playground uses `msc_EmailPreviewsClient.tsx` with Studio Dark styling and deterministic success/error/expired states. *(Apr 2026)*
- [x] **Dev bypass defense-in-depth:** Local trust bypass now requires env master switch (`DEV_BYPASS_ENABLED=true`) + bypass cookie, plus dev visual indicator badge when active. *(Apr 2026)*
- [x] **Identity Playground expansion: auth flow integration:** Added `Auth Flows` preview section to the playground with Verify Reminder and Verify Email page previews, plus high-contrast text refinements for dark-mode legibility. *(Apr 2026)*
- [x] **UI polish: header-based dev indicators:** Replaced global floating bypass badge with compact header status dot tooltip (`Dev Bypass Active`) near session controls for cleaner dashboard chrome. *(Apr 2026)*
- [x] **Monitoring + rate-limit hardening follow-up:** IP-based sliding-window limits (in-process) for resend + registration **requests**; structured `[msc:verification]` JSON log lines (hashed `ipHash`, `userId`, `kind`) for funnel drop-off analysis; env overrides in `lib/msc_verification_ip_rate_limit.ts`. *(Apr 2026)*

**Sprint 3 core status:** **Sprint 3 closed.**

### Sprint 3 outcome snapshot (why this mattered)

- **Infrastructure reliability:** Local SQLite repair (`npm run repair:sqlite`) extends **`payload_locked_documents_rels`** with polymorphic FK columns as collections grow (**e.g. `msc_clients_id`, `msc_vault_snippets_id`, `msc_audit_logs_id`**). Reduces **`no such column`** failures on **`payload.update`** (dashboard manual reorder, admin saves) when the on-disk DB predates a collection.
- **Identity trust engine:** Verification moved to hashed token + expiry, with one-time consumption semantics and trust-gate enforcement for unverified sessions.
- **Developer velocity safeguards:** Identity Playground + localhost-only admin dev bypass (env switch + cookie gate + visual badge) enable fast feature iteration without weakening production policy boundaries.
- **Operational debugging:** Resend verification and trust-gate paths now emit actionable server logs instead of opaque failure states, reducing mean-time-to-fix when auth issues occur.

## Sprint 4: Interface polish (priority: low)

*Goal: Reduce clutter and improve mobile usage.*

- [x] **Admin runtime blocker resolved:** Local `/admin/login` Payload crash (`CodeEditor` config undefined) fixed by restoring required Payload route-group layout wiring (`app/(payload)/layout.tsx` -> `RootLayout` + `handleServerFunctions` with `config` + `importMap`). Added regression guardrail to run import-map regeneration + build/smoke auth checks after admin-layout edits. *(Apr 2026)*
- [x] **Cleanup:** Removed duplicate **Configure Local Path** CTA; path is set only via **Edit project** (same field). *(Apr 2026)*
- [x] **Tasks surface declutter pass:** Removed top project-card progress strip on dashboard, made Project Info collapsed by default on Tasks page, switched in-progress rows to neutral backgrounds, and slimmed progress bars for cleaner density. *(Apr 2026)*
- [x] **Mobile responsiveness (Command Center shell):** Below **`lg` (max-width 1023px)**, the sidebar is a **drawer** (`-translate-x-full` when closed, `z-40` backdrop, `z-50` panel, body scroll lock, resize to desktop closes menu, Escape closes). At **`lg+`**, the **collapsible rail** (`w-16` / `w-64`) and left margin on main (`lg:ml-16` / `lg:ml-64`) remain. **`useIsMobile()`** in **`lib/msc_hooks.ts`** uses `useSyncExternalStore` + `matchMedia('(max-width: 1023px)')` with **SSR default `false`**. Project search in the header is **`hidden lg:block`**. Main content **`p-4 md:p-6`**; dashboard/project **`gap-4` → `md:` wider** where needed; footer **in-flow** below `lg`, **fixed** bottom-right at **`lg`**. *(Apr 2026)*
  - [x] Sidebar is off-canvas on small viewports (hamburger opens); no rail margin on mobile.
  - [x] Container padding and responsive gaps applied on dashboard and project grid stats row.
- [x] **Project sort + manual order (replaces DnD backlog item):** Persisted **`manualRank`** on `msc-vault-projects`, client **`projectSortMode`** (manual / name / updated / status) with **`msc_sortProjectsForDashboard`**, dashboard header **Sort** control, and **Move up / down** on grid cards and list rows when sort is **manual**. **Standard users:** controls only for projects you own; swap requires the **adjacent** row in manual order to also be yours (shared rows block — server **`msc_moveProjectManual`**). **Admin / master-admin:** may reorder any adjacent pair in the loaded list. Chevrons stay visible on desktop (`opacity-90`, full on hover). *(Apr 2026)*

## Sprint 5: Feature expansion (priority: backlog)

*Goal: Future roadmap items.*

- [x] **Calendar (Command Center):** Month/week grid at **`/calendar`** with vault tasks by due date, task chips, add-task + edit flows, and agenda for the selected day. **Phase 9.1 layout:** **`grid-cols-1 md:grid-cols-7`**, **`gap-px`** zinc frame, **`min-h-[150px]`** + **`h-auto`** (no **`1fr`** row stretch); **`md`** **Mon–Sun** header via **`hidden md:contents`**; mobile shows **weekday+date** per stacked cell; **`md:min-w-2xl`** + horizontal scroll when needed. **Day detail `Dialog`** (**`#121212`**) lists all tasks for a day; cell preview shows **3** tasks + **`+ N more`**. **Agenda** button on **`max-md`** opens bottom **`Sheet`**. **`useIsMaxMd`** where applicable. **Touch:** long-press + pencil; desktop double-click. **A11y / DOM:** **`div role="button"`** day cells. **Visual:** selection/today use **`ring-inset`** on **`#121212`** cells. *(Apr 2026)*
- [x] **CRM Command Center — Phase 1 (create/archive/edit profile):** Shipped inline client profile edit in **`MSC-Projectz-ClientDrawer`** (name, status, primary contact, phone) with safe server action merge that preserves **`primaryContact.user`**. Added **New Client** dialog in **`MSC-Projectz-ClientsRouteView`** and backend **`msc_createClient`** (`status: 'lead'`, default onboarding checklist). Added **Archive Client** flow with confirmation via **`AlertDialog`** + **`msc_archiveClient`** (`status: 'archived'`) and active list hides archived rows by default. *(Apr 2026)*

### Sprint 5 — calendar notes

| Item | Status |
|------|--------|
| `/calendar` grid + agenda + task edit/add | Done |
| Mobile: scroll matrix + bottom sheet agenda + `useIsMaxMd` | Done |
| No nested buttons (day cell vs chip / pencil) | Done |
| Selection/today border (no ring corner artifacts) | Done |

## Sprint 8: Avatar resolution and UI standardization (priority: medium)

*Goal: One resolver for Payload `users.avatar` shapes (string URL, populated media `{ url }`, `avatarUrl`) and a calm, uniform no-photo treatment on dashboard surfaces.*

- [x] **`msc_resolveAvatarUrl`** in **`lib/msc_avatar_url.ts`** — single resolution path; no client-side media fetch by id. *(Apr 2026)*
- [x] **`msc_mapProjectMember`** (**`lib/msc_map_vault.ts`**) resolves **`avatarUrl`** before client mapping; raw media objects are not passed through for display. *(Apr 2026)*
- [x] **Profile DRY:** **`msc_avatarUrlFromDoc`** in **`lib/msc_profile_server_actions.ts`** delegates to **`msc_resolveAvatarUrl`**. *(Apr 2026)*
- [x] **`MemberClusterTrigger`** (**`components/MemberClusterTrigger.tsx`**): uses resolver; **`fallbackType`**: **`'initials'`** | **`'icon'`** (default **`'icon'`**); Lucide **`User`** with **`strokeWidth={1.5}`**, padded circle (**Soft Studio**). *(Apr 2026)*
- [x] **Call sites:** **`MSC-Projectz-ProjectCard`** (`fallbackType="icon"`), **`CalendarTaskChip`**, **`MSC-Projectz-TaskAssignee`** badge aligned with resolver + icon fallback. *(Apr 2026)*

---

### How to use this

1. Keep this file aligned with **what shipped** — after a meaningful change, mark checkboxes and add a one-line note under the sprint (or in the table for Sprint 1).
2. Pick **one** open task when planning work.
3. Implement and verify (`next build` / local smoke) before checking it off.
4. If requirements change (e.g. password rules), **edit the item text** so the roadmap stays the source of truth, not an old spec.

### Changelog (brief)

- **2026-04** — Sprint 1: single auth/register path, password policy module, dashboard username preference; help doc updated for `/auth/register`; welcome email trigger added in `msc_auth_actions` via `msc_sendWelcomeEmail`.
- **2026-04** — Sprint 2: Vault collection `update`/`delete` use `msc_vaultWriteOwnProjects` (read still `msc_vaultReadOwnProjects`).
- **2026-04** — Sprint 2: Role-based UI gating unified on `RoleGate`; deprecated `AdminGate` removed and docs updated (`START-HERE`, `Project-Truth`).
- **2026-04** — Sprint 2 closeout: implemented Master Admin RBAC (`master-admin` role), elevated admin access helpers, settings role controls, and bootstrap/rescue scripts updated to preserve privileged restore paths.
- **2026-04** — Sprint 2: Admin audit trail shipped (`msc-audit-logs`), shared admin guard extracted, and Settings-embedded audit viewer added with filter + JSON details viewer.
- **2026-04** — Sprint 2: Final hardening pass shipped for users/media/profile ownership controls (IDOR/spoofing mitigation) and marked core hardening complete.
- **2026-04** — Sprint 2 cleanup: `Add member` on project cards now opens Task Pulse (project selection) to prevent dead-end edit flow.
- **2026-04** — Sprint 2 cleanup: Added cross-route Task Pulse signal (`useTaskPulseSignal`) from Settings user-create success to dashboard Task Pulse/Task Drawer open state with auto-reset.
- **2026-04** — Sprint 3 started: tokenized verification flow shipped (hashed token + expiry fields, server verify action, and `/auth/verify` page).
- **2026-04** — Sprint 3 core closeout: trust gate middleware + verify-reminder resend flow (token rotation, cooldown, masked-email reminder UI) shipped.
- **2026-04** — Sprint 3 UI refactor complete: reusable `VerificationView` plus admin identity playground for deterministic verification-state previews.
- **2026-04** — Sprint 3 hardening: dev bypass refined with env master switch + cookie gate and global dev badge indicator when active.
- **2026-04** — Sprint 3 outcome: reliability + trust hardening + dev-velocity tooling completed (schema repairs, trust gate, resend diagnostics, and local-only bypass controls).
- **2026-04** — Sprint 3 polish: verification/playground components standardized with `msc_` filenames and Studio Dark active-state treatment.
- **2026-04** — Sprint 3 polish: Identity Playground now includes Auth Flows previews, and dev bypass status moved to a compact header indicator with tooltip.
- **2026-04** — Sprint 4 polish: tasks/dashboard declutter pass shipped (neutral in-progress rows, thinner progress bars, default-collapsed Project Info, and dashboard project-card top progress strip removed).
- **2026-04** — Sprint 4 stability: `/admin/login` Payload runtime blocker documented after deep isolation attempts (layouts, custom admin component, dependency unification, import-map regen) with follow-up focused on admin-shell context/module path.
- **2026-04** — Sprint 4 stability: final nightly attempt (remove direct `@payloadcms/ui`, keep unified `3.84.1` pins/overrides) still reproduced `/admin/login` 500; proceeded to admin-shell/layout recovery.
- **2026-04** — Sprint 4 stability: blocker resolved by restoring canonical Payload `(payload)` `RootLayout` wiring (`config` + `importMap` + `handleServerFunctions`) and re-validating login flow (`/admin` healthy, auth submit path clean).
- **2026-04** — Sprint 4 release gate closeout: created `v1.03` tag after full build/auth/access proofs; removed unsupported `next.config` key (`devBundleServerPackages`) to keep production console clean while preserving green build/smoke checks.
- **2026-04** — Local ops: documented `*gate-user*@msc.local` as optional audit fixtures (not dev bypass); added `npm run db:prune-gate-users` + `scripts/msc_delete_gate_test_users.mjs` for safe removal with backup; `MSC-Users.md` / `FlightPro.md` / `Agent-Runbook.md` / `START-HERE.md` updated.
- **2026-04-27** — **Next route groups:** moved Command Center, auth, and login under `app/(main)/` with a dedicated document layout; root `app/layout.tsx` is pass-through so Payload `RootLayout` in `app/(payload)/` is not nested under the main `<body>`. Fixes `/admin` duplicate `<html>`/`<body>` and related hydration errors. Operator docs (`START-HERE`, `Project-Truth`, `ReCall`, `Agent-Runbook`, `Restore-Points`, `Session-Snapshots`, roadmap changelog) updated for `MSC-Projectz-FullDev-v3` and the new paths.
- **2026-04-27** — **Sprint 3 final:** IP-aware throttling (resend + per-submit registration) and `[msc:verification]` JSON funnel telemetry; see `lib/msc_verification_ip_rate_limit.ts`, `lib/msc_verification_telemetry.ts`, `app/actions/resend-verification.ts`, `lib/msc_auth_actions.ts`, `app/actions/verify-email.ts`. Disable with `MSC_VERIFICATION_DISABLE_IP_RATE_LIMIT=true` (local only).
- **2026-04-27** — **Sprint 4 cleanup:** Removed **Configure Local Path** green CTA and `ConfigurePathModal`; users set `localPath` in **Edit project** only.
- **2026-04-27** — **Sprint 4 (mobile shell):** Responsive Command Center: `lib/msc_hooks.ts` (`useIsMobile`), drawer sidebar + `dashboard-layout` (hamburger, scroll lock, resize/ Escape), `MSC-Projectz-Dashboard` + `project-grid` spacing. **Do not** run `clean:next` / `verify:next` while `next dev` uses the same `.next` (see `Agent-Runbook`).
- **2026-04-27** — **Sprint 4 (polish):** `next.config.mjs` **rewrites** `GET /favicon.ico` → `/media/msc-icon.png` so the browser default request matches the same on-disk mark under **`./media`** (no duplicate file in `public/`).
- **2026-04-27** — **Git:** primary integration line continues on branch **`MSC-Projectz-FullDev-v4`** (created from `FullDev-v3` at the same commit as this doc pass); `FullDev-v3` remains on remote for history.
- **2026-04-27** — **Calendar (Sprint 5 / mobile):** `/calendar` mobile layout (horizontal scroll matrix, `CalendarAgendaPanel` + bottom `Sheet`, `useIsMaxMd`), touch edit affordances on **`CalendarTaskChip`**, day cells as focusable **divs** to avoid invalid nested **`<button>`** hydration, border-only selection/today (no `ring` corner glitches). See **`Session-Snapshots`**, **`Restore-Points`**, **`START-HERE`** (Core Features).
- **2026-04-27** — **Git:** primary integration line advances to **`MSC-Projectz-FullDev-v5`** (cut from the **`MSC-Projectz-FullDev-v4`** tip at calendar closeout; **`FullDev-v4`** remains for history). Operator pointers updated in **`START-HERE`**, **`Project-Truth`**, **`ReCall`**, **`Session-Snapshots`**, **`Restore-Points`**.
- **2026-04-27** — **Sprint 8:** Avatar URL resolution (**`lib/msc_avatar_url.ts`**), mapper normalization (**`msc_mapProjectMember`**), **`MemberClusterTrigger`** **`fallbackType`** (**`'icon'`** default = Lucide **`User`**), project card + **`CalendarTaskChip`** + task assignee badge; profile **`msc_avatarUrlFromDoc`** DRY. See **`Agent-Runbook.md`** → *Profile avatars & member clusters*.
- **2026-04-28** — **SQLite / Payload drift:** **`npm run repair:sqlite`** extends **`payload_locked_documents_rels`** with polymorphic lock FKs (**`msc_audit_logs_id`**, **`msc_clients_id`**, **`msc_vault_snippets_id`**) so **`payload.update`** (manual project reorder, saves) does not fail with **`no such column`**. Operator docs (**`Daily-Ops-Cheat-Sheet`**, **`FlightPro`**, **`Project-Truth`**, **`START-HERE`**, **`Session-Snapshots`**) updated; roadmap Sprint 4 manual-order note aligned with admin reorder behavior.
- **2026-04-28** — **Phase 9 calendar + `FullDev-v6`:** Responsive calendar grid (**`CalendarGrid`**, **`MSC-Projectz-Calendar`** re-export), day-detail **Dialog**, stacked mobile layout, **`Agenda`** sheet affordance; primary branch **`MSC-Projectz-FullDev-v6`**. **`START-HERE`**, **`Project-Truth`**, **`Session-Snapshots`**, this roadmap updated.
- **2026-04-28** — **Git:** primary integration line advances to **`MSC-Projectz-FullDev-v7`** (created from **`FullDev-v6`** tip; **`FullDev-v6`** remains on **`origin`**). Operator pointers: **`START-HERE`**, **`Project-Truth`**, **`ReCall`**, **`Session-Snapshots`**, **`Restore-Points`**.
- **2026-04-28** — **CRM Phase 1 shipped:** `msc_updateClientProfile` (safe merge preserving `primaryContact.user`), `msc_createClient`, `msc_archiveClient`; drawer profile edit mode + New Client dialog + archive danger-zone confirmation in Command Center. Active clients list now excludes archived by default.
