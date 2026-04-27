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
- [ ] **Member cards:** Fix "Add Member" so it successfully opens Task Pulse.
- [x] **Vault projects — write-strict (Payload):** **`msc_vaultReadOwnProjects`** unchanged (owner or `members` can read). **`msc_vaultWriteOwnProjects`** for `update`/`delete` on **`msc-vault-projects`**: admins full; non-admins only when `user` = self (members no longer edit/delete project rows). *(Apr 2026)*
- [x] **Audit logs (admin actions):** Added `msc-audit-logs` collection, non-blocking audit writes for user admin actions, and admin-only viewer at `/settings/audit` with filters + details modal. *(Apr 2026)*
- [ ] **Credential scoping (remaining):** Keep auditing Local API / app routes so non-owners cannot mutate others’ data; collection read already scopes non-admins to visible projects; write on projects is now owner-only.

## Sprint 3: Interface polish (priority: low)

*Goal: Reduce clutter and improve mobile usage.*

- [ ] **Cleanup:** Remove "Configure Local Path" (green button).
- [ ] **Mobile responsiveness:**
  - [ ] Force sidebar/menu to minimize by default on mobile.
  - [ ] Adjust container padding/spacing for mobile interactions.
- [ ] **Drag and drop:** Implement card reordering.

## Sprint 4: Feature expansion (priority: backlog)

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
- **2026-04** — Sprint 2: Admin audit trail shipped (`msc-audit-logs`), shared admin guard extracted, and `/settings/audit` UI added with filter + JSON details viewer.
