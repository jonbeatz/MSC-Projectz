# Development Roadmap — MSC-Projectz

## Sprint 1: Identity and authentication (priority: high)

*Goal: Fix the login experience and user identification.*

- [x] **Login & registration — single path:** Replaced the dual flow (store “signup” + `/auth/register`) with one source of truth: **`/auth/register`** via **`msc_registerUser`** (Payload). Login screen: **Create account** → `/auth/register` only; inline signup, invite-code shortcut, and duplicate “Request an account” CTA removed. `AuthView` is `login` | `forgot-password`; Zustand **`signup`** removed. *(Apr 2026)*
- [x] **Password security (new passwords):** Shared policy in **`lib/msc_password_policy.ts`**: min **8** characters, at least one **uppercase** letter, one **number**, one **special** character. Applied to register form, server **`msc_registerUser`**, admin create/reset, and related UI. Login does not re-check complexity (existing accounts). *(Apr 2026)*
- [x] **Dashboard identity:** Top header prefers **`user.username`** when set; falls back to email local-part. Dropdown “Signed in as” still shows full email. *(Apr 2026)*
- [x] **Welcome email on registration:** `msc_registerUser` now triggers `msc_sendWelcomeEmail` in a fire-and-forget path (registration does not fail when SMTP send fails). *(Apr 2026)*
- [ ] **Verification / activation emails (next):** Implement Brevo/FluentSMTP-specific verification-link flow (separate from welcome email).

### Sprint 1 — notes

| Item | Status |
|------|--------|
| Single registration path (`/auth/register` + Payload) | Done |
| Password strength policy (8 + upper / number / special) | Done |
| Nav display name (username first) | Done |
| Welcome email on register (`msc_sendWelcomeEmail`) | Done |
| Verification-link email flow (Brevo/FluentSMTP specific) | Not started |

## Sprint 2: Access and vault logic (priority: medium)

*Goal: Secure the data and fix internal interactions.*

- [ ] **Global vault:** Implement "Master Admin" role-based access control (RBAC).
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
- [ ] **Monitoring + rate-limit hardening follow-up:** Add IP-aware resend throttling/telemetry and monitor verification funnel drop-off.

**Sprint 3 core status:** **Sprint 3 core closed; monitoring + rate-limit hardening follow-up.**

### Sprint 3 outcome snapshot (why this mattered)

- **Infrastructure reliability:** Local SQLite repair coverage now includes evolving Payload relationship columns (`payload_locked_documents_rels`), reducing lock/schema surprise failures during auth/resend flows.
- **Identity trust engine:** Verification moved to hashed token + expiry, with one-time consumption semantics and trust-gate enforcement for unverified sessions.
- **Developer velocity safeguards:** Identity Playground + localhost-only admin dev bypass (env switch + cookie gate + visual badge) enable fast feature iteration without weakening production policy boundaries.
- **Operational debugging:** Resend verification and trust-gate paths now emit actionable server logs instead of opaque failure states, reducing mean-time-to-fix when auth issues occur.

## Sprint 4: Interface polish (priority: low)

*Goal: Reduce clutter and improve mobile usage.*

- [ ] **Cleanup:** Remove "Configure Local Path" (green button).
- [ ] **Mobile responsiveness:**
  - [ ] Force sidebar/menu to minimize by default on mobile.
  - [ ] Adjust container padding/spacing for mobile interactions.
- [ ] **Drag and drop:** Implement card reordering.

## Sprint 5: Feature expansion (priority: backlog)

*Goal: Future roadmap items.*

- [ ] **Calendar:** Implement calendar view for task management.

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
