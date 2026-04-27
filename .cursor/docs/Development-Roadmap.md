# Development Roadmap — MSC-Projectz

## Sprint 1: Identity and authentication (priority: high)

*Goal: Fix the login experience and user identification.*

- [ ] **Login page cleanup:** Remove "Request Account," leave only "Create Account."
- [ ] **Password security:** Update password validation to allow 6+ characters (as requested).
- [ ] **Dashboard identity:** Update top nav to display `user.username` instead of `user.email`.
- [ ] **Verification emails:** Implement Brevo/FluentSMTP hook for new user registration.

## Sprint 2: Access and vault logic (priority: medium)

*Goal: Secure the data and fix internal interactions.*

- [ ] **Global vault:** Implement "Master Admin" role-based access control (RBAC).
- [ ] **Member cards:** Fix "Add Member" so it successfully opens Task Pulse.
- [ ] **Credential scoping:** Ensure standard users cannot see other users' Vault projects (access control hooks).

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

1. Pick **one task** from Sprint 1.
2. Say which task to start.
3. Implement and verify before moving to the next checkbox.
